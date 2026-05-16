import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function ensureFileDir(filePath: string): void {
  const dir = dirname(filePath);
  ensureDir(dir);
}
