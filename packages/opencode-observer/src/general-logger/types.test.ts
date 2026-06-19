import { describe, expect, it } from "bun:test";
import { isLogLevelSatisfied } from "./types.js";

describe("isLogLevelSatisfied", () => {
    it("returns true when current level equals target level", () => {
        expect(isLogLevelSatisfied("debug", "debug")).toBe(true);
        expect(isLogLevelSatisfied("info", "info")).toBe(true);
        expect(isLogLevelSatisfied("warn", "warn")).toBe(true);
        expect(isLogLevelSatisfied("error", "error")).toBe(true);
    });

    it("returns true when current level is less than target level", () => {
        expect(isLogLevelSatisfied("debug", "info")).toBe(true);
        expect(isLogLevelSatisfied("debug", "warn")).toBe(true);
        expect(isLogLevelSatisfied("debug", "error")).toBe(true);
        expect(isLogLevelSatisfied("info", "warn")).toBe(true);
        expect(isLogLevelSatisfied("info", "error")).toBe(true);
        expect(isLogLevelSatisfied("warn", "error")).toBe(true);
    });

    it("returns false when current level is greater than target level", () => {
        expect(isLogLevelSatisfied("info", "debug")).toBe(false);
        expect(isLogLevelSatisfied("warn", "debug")).toBe(false);
        expect(isLogLevelSatisfied("warn", "info")).toBe(false);
        expect(isLogLevelSatisfied("error", "debug")).toBe(false);
        expect(isLogLevelSatisfied("error", "info")).toBe(false);
        expect(isLogLevelSatisfied("error", "warn")).toBe(false);
    });

    it("debug satisfies all levels", () => {
        const levels: Array<"debug" | "info" | "warn" | "error"> = ["debug", "info", "warn", "error"];
        for (const level of levels) {
            expect(isLogLevelSatisfied("debug", level)).toBe(true);
        }
    });

    it("error satisfies only error", () => {
        expect(isLogLevelSatisfied("error", "error")).toBe(true);
        expect(isLogLevelSatisfied("error", "warn")).toBe(false);
        expect(isLogLevelSatisfied("error", "info")).toBe(false);
        expect(isLogLevelSatisfied("error", "debug")).toBe(false);
    });
});
