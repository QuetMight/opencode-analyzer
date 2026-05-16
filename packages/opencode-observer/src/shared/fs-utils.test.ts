import { afterEach, describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { ensureDir, ensureFileDir } from "./fs-utils.js";

describe("fs-utils.ts", () => {
  let tmpBase: string;

  afterEach(() => {
    if (tmpBase && fs.existsSync(tmpBase)) {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }
  });

  function createTmpDir(): string {
    tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-observer-test-"));
    return tmpBase;
  }

  describe("ensureDir", () => {
    it("creates a directory that does not exist", () => {
      const tmpDir = createTmpDir();
      const newDir = path.join(tmpDir, "new-dir");

      expect(fs.existsSync(newDir)).toBe(false);
      ensureDir(newDir);
      expect(fs.existsSync(newDir)).toBe(true);

      const stat = fs.statSync(newDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it("is idempotent - calling twice does not error", () => {
      const tmpDir = createTmpDir();
      const newDir = path.join(tmpDir, "idempotent-dir");

      ensureDir(newDir);
      expect(() => ensureDir(newDir)).not.toThrow();
      expect(fs.existsSync(newDir)).toBe(true);
    });

    it("creates nested directories with recursive option", () => {
      const tmpDir = createTmpDir();
      const nestedDir = path.join(tmpDir, "a", "b", "c");

      ensureDir(nestedDir);
      expect(fs.existsSync(nestedDir)).toBe(true);
    });
  });

  describe("ensureFileDir", () => {
    it("creates parent directories for a nested file path", () => {
      const tmpDir = createTmpDir();
      const filePath = path.join(tmpDir, "deep", "nested", "file.txt");

      expect(fs.existsSync(path.dirname(filePath))).toBe(false);
      ensureFileDir(filePath);
      expect(fs.existsSync(path.dirname(filePath))).toBe(true);
    });

    it("is idempotent - calling twice does not error", () => {
      const tmpDir = createTmpDir();
      const filePath = path.join(tmpDir, "dir", "file.txt");

      ensureFileDir(filePath);
      expect(() => ensureFileDir(filePath)).not.toThrow();
    });
  });
});
