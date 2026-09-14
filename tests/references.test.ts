import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const rootDir = path.join(__dirname, "..");
const sharedDir = path.join(rootDir, "templates", "shared");
const skillsDir = path.join(rootDir, "templates", "skills");

const distribution: Record<string, string[]> = {
  "intent-guidance.md": ["flow-add", "flow-sync", "flow-work"],
};

describe("shared skill references stay in sync", () => {
  for (const [fileName, skillNames] of Object.entries(distribution)) {
    const canonical = fs.readFileSync(path.join(sharedDir, fileName), "utf8");
    for (const skillName of skillNames) {
      it(`${skillName}/references/${fileName} matches templates/shared/${fileName}`, () => {
        const copyPath = path.join(skillsDir, skillName, "references", fileName);
        expect(fs.existsSync(copyPath)).toBe(true);
        expect(fs.readFileSync(copyPath, "utf8")).toBe(canonical);
      });
    }
  }
});
