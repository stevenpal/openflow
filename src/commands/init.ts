import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { workspacePaths } from "../workspace.js";
import { initEmptyLedger } from "../ledger/store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dist/commands/init.js -> package root -> templates/
const TEMPLATES_DIR = path.join(__dirname, "..", "..", "templates");

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export interface InitResult {
  root: string;
  created: string[];
}

/**
 * Scaffolds `root` into an OpenFlow workspace: `/flow:*` skills, the streams/ folder, and an
 * empty intent ledger. Workspaces are plain folders with no shared state, so two `openflow init`
 * calls in different folders are independent by construction.
 */
export function initWorkspace(root: string): InitResult {
  const paths = workspacePaths(root);
  const created: string[] = [];

  fs.mkdirSync(paths.streamsDir, { recursive: true });
  created.push(paths.streamsDir);

  fs.mkdirSync(paths.openflowDir, { recursive: true });

  if (!fs.existsSync(paths.ledgerFile)) {
    initEmptyLedger(root);
    created.push(paths.ledgerFile);
  }

  const skillsSrc = path.join(TEMPLATES_DIR, "skills");
  fs.mkdirSync(paths.claudeSkillsDir, { recursive: true });
  copyDir(skillsSrc, paths.claudeSkillsDir);
  created.push(paths.claudeSkillsDir);

  const commandsSrc = path.join(TEMPLATES_DIR, "commands", "flow");
  fs.mkdirSync(paths.claudeCommandsDir, { recursive: true });
  copyDir(commandsSrc, paths.claudeCommandsDir);
  created.push(paths.claudeCommandsDir);

  if (!fs.existsSync(paths.queueFile)) {
    fs.writeFileSync(paths.queueFile, "# Queue\n\nNo items yet. Add streams with `/flow:add`.\n", "utf8");
    created.push(paths.queueFile);
  }

  return { root, created };
}
