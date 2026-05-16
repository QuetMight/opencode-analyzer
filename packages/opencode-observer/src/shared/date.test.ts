import { describe, expect, it } from "bun:test";
import { getFileTimestamp, getTimestamp } from "./date.js";

describe("date.ts", () => {
  describe("getFileTimestamp", () => {
    it("returns a string matching YYYY-MM-DD_HH-mm-ss-SSS pattern", () => {
      const result = getFileTimestamp();
      const pattern = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-\d{3}$/;
      expect(result).toMatch(pattern);
    });

    it("returns a string with underscore separator between date and time", () => {
      const result = getFileTimestamp();
      expect(result).toContain("_");
      const [datePart, timePart] = result.split("_");
      expect(datePart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(timePart).toMatch(/^\d{2}-\d{2}-\d{2}-\d{3}$/);
    });
  });

  describe("getTimestamp", () => {
    it("returns a string matching YYYY-MM-DD HH:mm:ss.SSS pattern", () => {
      const result = getTimestamp();
      const pattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/;
      expect(result).toMatch(pattern);
    });

    it("returns a string with space separator between date and time", () => {
      const result = getTimestamp();
      expect(result).toContain(" ");
      const [datePart, timePart] = result.split(" ");
      expect(datePart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(timePart).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
    });
  });
});
