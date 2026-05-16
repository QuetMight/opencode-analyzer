import { appendFileSync } from "node:fs";
import { join } from "node:path";

import { getFileTimestamp, getTimestamp } from "./date.js";
import { ensureFileDir } from "./fs-utils.js";
import { getOpenCodeAnalyzerDir } from "./paths.js";

// create new log file each time the system starts
let logFilePath: string;

function getLogFilePath(): string {
  if (logFilePath) return logFilePath;
  logFilePath = join(
    getOpenCodeAnalyzerDir(),
    `oca-ob_${getFileTimestamp()}.log`,
  );
  return logFilePath;
}

export function log(msg: string): void {
  const timestamp = getTimestamp();
  const line = `[${timestamp}] ${msg}\n`;

  try {
    const filePath = getLogFilePath();
    ensureFileDir(filePath);
    appendFileSync(filePath, line);
  } catch (err) {
    process.stderr.write(`[observer] log write failed: ${err}\n`);
  }
}
