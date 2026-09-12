import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function makeTempWorkspace(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "openflow-test-"));
}

export function cleanupWorkspace(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}
