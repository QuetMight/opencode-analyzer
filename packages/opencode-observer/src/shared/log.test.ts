import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { log } from "./log.js";

describe("log.ts", () => {
  let tmpDir: string;
  let analyzerDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-log-test-"));
    process.env.XDG_DATA_HOME = tmpDir;
    analyzerDir = path.join(tmpDir, "opencode-analyzer");
  });

  afterEach(() => {
    delete process.env.XDG_DATA_HOME;
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("writes log lines to a file with format [{timestamp}] {msg} and appends subsequent lines", () => {
    log("hello world");

    const files = fs.readdirSync(analyzerDir).filter((f) => f.endsWith(".log"));
    expect(files.length).toBeGreaterThan(0);

    const logFile = path.join(analyzerDir, files[0]!);
    const content = fs.readFileSync(logFile, "utf-8");

    const pattern =
      /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] hello world\n$/;
    expect(content).toMatch(pattern);

    log("first message");
    log("second message");

    const content2 = fs.readFileSync(logFile, "utf-8");
    const lines = content2.trim().split("\n");
    expect(lines.length).toBe(3);
    expect(lines[0]).toMatch(/^\[.*\] hello world$/);
    expect(lines[1]).toMatch(/^\[.*\] first message$/);
    expect(lines[2]).toMatch(/^\[.*\] second message$/);
  });
});
