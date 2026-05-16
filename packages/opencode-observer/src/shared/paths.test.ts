import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { jest, mock } from "bun:test";
import * as path from "node:path";

const mockHomedir = "/mock/home";
const mockTmpdir = "/mock/tmp";
let mkdirCalls: string[] = [];
let accessCalls: string[] = [];

mock.module("node:os", () => ({
  homedir: jest.fn(() => mockHomedir),
  tmpdir: jest.fn(() => mockTmpdir),
}));

mock.module("node:fs", () => ({
  mkdirSync: jest.fn((dirPath: string) => {
    mkdirCalls.push(dirPath);
  }),
  accessSync: jest.fn((dirPath: string) => {
    accessCalls.push(dirPath);
  }),
}));

import {
  getDataDir,
  getOpenCodeAnalyzerDir,
  getOpenCodeDataDir,
} from "./paths.js";

describe("paths.ts", () => {
  beforeEach(() => {
    mkdirCalls = [];
    accessCalls = [];
    delete process.env.XDG_DATA_HOME;
  });

  afterEach(() => {
    delete process.env.XDG_DATA_HOME;
    mock.restore();
  });

  describe("getDataDir", () => {
    it("returns a valid path string", () => {
      const result = getDataDir();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("uses XDG_DATA_HOME when set", () => {
      process.env.XDG_DATA_HOME = "/custom/data";
      const result = getDataDir();
      expect(result).toBe("/custom/data");
    });

    it("falls back to ~/.local/share when XDG_DATA_HOME is not set", () => {
      delete process.env.XDG_DATA_HOME;
      const result = getDataDir();
      expect(result).toBe(path.join(mockHomedir, ".local", "share"));
    });
  });

  describe("getOpenCodeDataDir", () => {
    it("returns a path ending in 'opencode'", () => {
      const result = getOpenCodeDataDir();
      expect(result).toMatch(/opencode$/);
    });

    it("appends 'opencode' to the data dir", () => {
      process.env.XDG_DATA_HOME = "/test/data";
      const result = getOpenCodeDataDir();
      expect(result).toBe(path.join("/test/data", "opencode"));
    });
  });

  describe("getOpenCodeAnalyzerDir", () => {
    it("returns a path ending in 'opencode-analyzer'", () => {
      const result = getOpenCodeAnalyzerDir();
      expect(result).toMatch(/opencode-analyzer$/);
    });

    it("appends 'opencode-analyzer' to the data dir", () => {
      process.env.XDG_DATA_HOME = "/test/data";
      const result = getOpenCodeAnalyzerDir();
      expect(result).toBe(path.join("/test/data", "opencode-analyzer"));
    });
  });
});
