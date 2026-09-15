#!/usr/bin/env node
import { Command } from "commander";
import { stringify as stringifyYaml } from "yaml";
import { initWorkspace } from "./commands/init.js";
import { updateWorkspace, UpdateError } from "./commands/update.js";
import { cliVersion } from "./manifest.js";
import { addStream, removeStream, updateStream, getStreams, LedgerValidationError } from "./ledger/store.js";
import { applyIntentOperation, IntentOperationError, type IntentOperation } from "./ledger/intents.js";
import { getDate, getPeriodStart, type PeriodUnit } from "./dates.js";
import fs from "node:fs";
import { EXTRACTION_TEMPLATE, SHAPE_DESCRIPTIONS } from "./normalize/extraction-templates.js";
import { cleanup } from "./normalize/cleanup.js";
import { writeSnapshot, latestSnapshot, listSnapshots, removeStreamFolder } from "./streams/storage.js";
import type { StreamShape } from "./ledger/types.js";
import { workspacePaths } from "./workspace.js";
import { appendQueueItem, removeQueueItem, parseQueueItems, renderQueueList, type QueueItem } from "./queue.js";
import { defaultSyncable, classificationNote } from "./classification.js";
import { applyStreamSync, readLocalFileSource, type RetrievalResult } from "./sync.js";

const program = new Command();
program
  .name("openflow")
  .description("Local, versioned memory of the streams a workspace cares about.")
  .version(cliVersion(), "-V, --version", "print the installed openflow CLI version");

program
  .command("init")
  .description("Scaffold the current folder into an OpenFlow workspace")
  .action(() => {
    const result = initWorkspace(process.cwd());
    console.log(`Initialized OpenFlow workspace at ${result.root}`);
    for (const created of result.created) {
      console.log(`  created ${created}`);
    }
  });

program
  .command("update")
  .description("Refresh this workspace's installed /flow:* skills and commands to match the installed CLI version")
  .option("--force", "acknowledge a first-time manifest write on a workspace initialized before this feature existed", false)
  .action((opts: { force: boolean }) => {
    try {
      const result = updateWorkspace(process.cwd(), { force: opts.force });
      if (!result.updated) {
        console.log(`Already up to date (${result.toVersion})`);
        return;
      }
      const from = result.fromVersion ?? "(no manifest)";
      console.log(`Updated workspace from ${from} to ${result.toVersion}`);
      console.log(`  installed skills: ${result.installedSkills.join(", ")}`);
    } catch (err) {
      if (err instanceof UpdateError) {
        console.error(err.message);
        process.exitCode = 1;
        return;
      }
      failWith(err);
    }
  });

const ledger = program.command("ledger").description("Validated intent ledger access");

ledger
  .command("add")
  .description("Add a stream entry (validated schema + referential integrity)")
  .requiredOption("--json <entry>", "JSON-encoded ledger entry")
  .action((opts: { json: string }) => {
    try {
      const entry = addStream(process.cwd(), JSON.parse(opts.json));
      console.log(stringifyYaml(entry).trimEnd());
    } catch (err) {
      failWith(err);
    }
  });

ledger
  .command("remove")
  .description("Remove a stream entry (local ledger entry only, never the remote source)")
  .requiredOption("--id <id>", "stream id")
  .action((opts: { id: string }) => {
    try {
      removeStream(process.cwd(), opts.id);
      console.log(`Removed stream "${opts.id}"`);
    } catch (err) {
      failWith(err);
    }
  });

ledger
  .command("update")
  .description("Update fields on a stream entry (validated schema + referential integrity)")
  .requiredOption("--id <id>", "stream id")
  .requiredOption("--json <patch>", "JSON-encoded partial ledger entry")
  .action((opts: { id: string; json: string }) => {
    try {
      const entry = updateStream(process.cwd(), opts.id, JSON.parse(opts.json));
      console.log(stringifyYaml(entry).trimEnd());
    } catch (err) {
      failWith(err);
    }
  });

ledger
  .command("get")
  .description("List valid stream entries; reports (never silently drops) invalid ones")
  .action(() => {
    const result = getStreams(process.cwd());
    console.log(result.entries.length > 0 ? stringifyYaml(result.entries).trimEnd() : "streams: []");
    if (result.skipped.length > 0) {
      for (const skipped of result.skipped) {
        const id = (skipped.raw as { id?: string })?.id ?? "(unknown id)";
        console.error(`Skipped invalid entry "${id}": ${skipped.reasons.join("; ")}`);
      }
    }
  });

const intents = program.command("intents").description("In-place intents list rewriting");

intents
  .command("apply")
  .description("Apply one sharpen/add/drop operation to a stream's intents, then persist via ledger update")
  .requiredOption("--id <id>", "stream id")
  .requiredOption("--op <json>", "JSON-encoded IntentOperation")
  .addHelpText(
    "after",
    `
Ops:
  {"kind":"sharpen","match":"<existing intent, exact>","replacement":"<new text>"}
  {"kind":"add","text":"<new intent>"}
  {"kind":"drop","match":"<existing intent, exact>"}
`,
  )
  .action((opts: { id: string; op: string }) => {
    try {
      const current = getStreams(process.cwd()).entries.find((e) => e.id === opts.id);
      if (!current) {
        throw new Error(`no stream with id "${opts.id}" exists`);
      }
      const op = JSON.parse(opts.op) as IntentOperation;
      const nextIntents = applyIntentOperation(current.intents, op);
      const entry = updateStream(process.cwd(), opts.id, { intents: nextIntents });
      console.log(stringifyYaml(entry).trimEnd());
    } catch (err) {
      failWith(err);
    }
  });

const dates = program.command("dates").description("Deterministic relative-date resolution");

dates
  .command("get-date")
  .description("Resolve anchor + offset-days to an ISO date (UTC)")
  .requiredOption("--anchor <date>", "ISO anchor date")
  .option("--offset-days <n>", "days to add (negative = earlier)", "0")
  .action((opts: { anchor: string; offsetDays: string }) => {
    try {
      console.log(getDate(opts.anchor, Number.parseInt(opts.offsetDays, 10)));
    } catch (err) {
      failWith(err);
    }
  });

dates
  .command("get-period-start")
  .description("Resolve the UTC start-of-period date for a unit (day/week/month/quarter/year)")
  .requiredOption("--unit <unit>", "day|week|month|quarter|year")
  .option("--date <date>", "ISO date (defaults to today, UTC)")
  .action((opts: { unit: PeriodUnit; date?: string }) => {
    try {
      console.log(getPeriodStart(opts.unit, opts.date));
    } catch (err) {
      failWith(err);
    }
  });

const normalize = program.command("normalize").description("Raw -> normalized conversion pipeline");

normalize
  .command("shapes")
  .description("Print the current stream-shape menu with each shape's one-line selection description")
  .action(() => {
    for (const shape of Object.keys(SHAPE_DESCRIPTIONS) as StreamShape[]) {
      console.log(`${shape}: ${SHAPE_DESCRIPTIONS[shape]}`);
    }
  });

normalize
  .command("template")
  .description("Print the verbatim-extraction template for a shape")
  .requiredOption("--shape <shape>", `one of: ${Object.keys(EXTRACTION_TEMPLATE).join(", ")}`)
  .action((opts: { shape: StreamShape }) => {
    const template = EXTRACTION_TEMPLATE[opts.shape];
    if (!template) {
      failWith(new Error(`unknown shape "${opts.shape}"`));
    }
    console.log(template);
  });

normalize
  .command("cleanup")
  .description("Deterministic clean-up pass shared by every shape's agent-extraction path, except plain-text (which is stored byte-for-byte and must not be passed to this command)")
  .requiredOption("--from <file>", "file with agent-extracted text")
  .action((opts: { from: string }) => {
    try {
      console.log(cleanup(fs.readFileSync(opts.from, "utf8")));
    } catch (err) {
      failWith(err);
    }
  });

const streams = program.command("streams").description("Per-stream raw + normalized snapshot storage");

streams
  .command("snapshot")
  .description("Write a new versioned snapshot for a stream (raw or normalized)")
  .requiredOption("--id <id>", "stream id")
  .requiredOption("--kind <kind>", "raw|normalized")
  .requiredOption("--ext <ext>", "file extension, e.g. md, csv, json, txt")
  .requiredOption("--from <file>", "file with the snapshot content")
  .action((opts: { id: string; kind: "raw" | "normalized"; ext: string; from: string }) => {
    try {
      const content = fs.readFileSync(opts.from, "utf8");
      const result = writeSnapshot(process.cwd(), opts.id, opts.kind, opts.ext, content);
      console.log(stringifyYaml(result).trimEnd());
    } catch (err) {
      failWith(err);
    }
  });

streams
  .command("latest")
  .description("Print the path to a stream's latest snapshot of one kind")
  .requiredOption("--id <id>", "stream id")
  .requiredOption("--kind <kind>", "raw|normalized")
  .action((opts: { id: string; kind: "raw" | "normalized" }) => {
    const latest = latestSnapshot(process.cwd(), opts.id, opts.kind);
    if (latest) {
      console.log(latest);
    }
  });

streams
  .command("remove")
  .description("Delete a stream's local folder (raw + normalized snapshots) only — never the remote source")
  .requiredOption("--id <id>", "stream id")
  .action((opts: { id: string }) => {
    removeStreamFolder(process.cwd(), opts.id);
    console.log(`Removed local folder for stream "${opts.id}"`);
  });

streams
  .command("list")
  .description("List a stream's snapshots of one kind, oldest first")
  .requiredOption("--id <id>", "stream id")
  .requiredOption("--kind <kind>", "raw|normalized")
  .action((opts: { id: string; kind: "raw" | "normalized" }) => {
    for (const snapshotPath of listSnapshots(process.cwd(), opts.id, opts.kind)) {
      console.log(snapshotPath);
    }
  });

const queue = program.command("queue").description("The human-editable queue document (queue.md)");

queue
  .command("add")
  .description("Append a new queue item")
  .requiredOption("--json <item>", "JSON-encoded {heading, streamLine, intent, body}")
  .action((opts: { json: string }) => {
    const { queueFile } = workspacePaths(process.cwd());
    const item = JSON.parse(opts.json) as QueueItem;
    const current = fs.existsSync(queueFile) ? fs.readFileSync(queueFile, "utf8") : "";
    fs.writeFileSync(queueFile, appendQueueItem(current, item), "utf8");
    console.log(`Added queue item "${item.heading}"`);
  });

queue
  .command("remove")
  .description("Remove a queue item by its exact heading (default on resolution)")
  .requiredOption("--heading <heading>", "exact item heading")
  .action((opts: { heading: string }) => {
    const { queueFile } = workspacePaths(process.cwd());
    const current = fs.existsSync(queueFile) ? fs.readFileSync(queueFile, "utf8") : "";
    fs.writeFileSync(queueFile, removeQueueItem(current, opts.heading), "utf8");
    console.log(`Removed queue item "${opts.heading}"`);
  });

queue
  .command("list")
  .description("List queue items in full, document order (grouping by intent is the agent's job)")
  .action(() => {
    const { queueFile } = workspacePaths(process.cwd());
    const current = fs.existsSync(queueFile) ? fs.readFileSync(queueFile, "utf8") : "";
    const items = parseQueueItems(current);
    console.log(renderQueueList(items) || "No items yet.");
  });

const classify = program.command("classify").description("Static/syncable classification defaults");

classify
  .command("default")
  .description("Print the type-default syncable classification and its confirmation note")
  .requiredOption("--shape <shape>", "stream shape")
  .option("--local-file", "the stream is a local file", false)
  .option("--override <bool>", "true|false to override the default (prompt language)")
  .action((opts: { shape: StreamShape; localFile: boolean; override?: string }) => {
    const defaultValue = defaultSyncable(opts.shape, opts.localFile);
    const overridden = opts.override !== undefined;
    const syncable = overridden ? opts.override === "true" : defaultValue;
    const note = classificationNote({
      shape: opts.shape,
      isLocalFile: opts.localFile,
      syncable,
      overriddenByPrompt: overridden,
    });
    console.log(stringifyYaml({ syncable, note }).trimEnd());
  });

const sync = program.command("sync").description("Per-stream retrieval outcome -> structured finding");

sync
  .command("report")
  .description("Report a stream's sync outcome: success (writes a new snapshot + diff) or failure (leaves last good snapshot)")
  .requiredOption("--id <id>", "stream id")
  .requiredOption("--ext <ext>", "normalized file extension")
  .option("--from <file>", "file with the newly retrieved normalized content (success case)")
  .option("--failure <reason>", "specific retrieval failure cause (failure case)")
  .action((opts: { id: string; ext: string; from?: string; failure?: string }) => {
    try {
      const retrieval: RetrievalResult = opts.failure
        ? { ok: false, failure: opts.failure }
        : { ok: true, normalizedContent: fs.readFileSync(opts.from!, "utf8") };
      const finding = applyStreamSync(process.cwd(), opts.id, opts.ext, retrieval);
      if (finding.failure) {
        console.log(`id: ${finding.id}\nstatus: failed\nreason: ${finding.failure}`);
      } else if (finding.changed) {
        console.log(`id: ${finding.id}\nstatus: changed\n\n${finding.diffText}`);
      } else {
        console.log(`id: ${finding.id}\nstatus: unchanged`);
      }
    } catch (err) {
      failWith(err);
    }
  });

sync
  .command("check-local-file")
  .description("Check whether a local file source still resolves at its recorded path")
  .requiredOption("--path <path>", "recorded local file path")
  .action((opts: { path: string }) => {
    const result = readLocalFileSource(opts.path);
    if (result.ok) {
      console.log(result.content);
    } else {
      console.error(result.reason);
      process.exitCode = 1;
    }
  });

function failWith(err: unknown): never {
  if (err instanceof LedgerValidationError || err instanceof IntentOperationError || err instanceof Error) {
    console.error(err.message);
  } else {
    console.error(String(err));
  }
  process.exitCode = 1;
  throw err;
}

program.parseAsync(process.argv).catch(() => {
  if (process.exitCode === undefined) {
    process.exitCode = 1;
  }
});
