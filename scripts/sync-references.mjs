// Copies each canonical file under templates/shared/ into every skill's own references/
// folder that uses it, so the skill directories stay self-contained (each is copied wholesale
// into a workspace by `openflow init`/`update`, so a skill must never point outside itself) while
// templates/shared/ stays the single place to edit the guidance.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sharedDir = path.join(rootDir, "templates", "shared");
const skillsDir = path.join(rootDir, "templates", "skills");

// Which skills need which shared reference file.
const distribution = {
  "intent-guidance.md": ["flow-add", "flow-sync", "flow-work"],
  "queue-item-guidance.md": ["flow-add", "flow-sync"],
};

for (const [fileName, skillNames] of Object.entries(distribution)) {
  const sourcePath = path.join(sharedDir, fileName);
  const contents = fs.readFileSync(sourcePath, "utf8");
  for (const skillName of skillNames) {
    const destDir = path.join(skillsDir, skillName, "references");
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(path.join(destDir, fileName), contents, "utf8");
  }
}

console.log("Synced shared references into skill directories.");
