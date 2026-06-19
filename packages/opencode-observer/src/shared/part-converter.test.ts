import { describe, expect, it } from "bun:test";
import { PartConverter } from "./part-converter.js";
import type { TextPart, ReasoningPart, ToolPart, Part } from "@opencode-ai/sdk";

function makeTextPart(overrides?: Partial<TextPart>): TextPart {
    return {
        id: "part-1",
        sessionID: "session-1",
        messageID: "msg-1",
        type: "text",
        text: "hello world",
        ...overrides,
    };
}

function makeReasoningPart(overrides?: Partial<ReasoningPart>): ReasoningPart {
    return {
        id: "part-2",
        sessionID: "session-1",
        messageID: "msg-1",
        type: "reasoning",
        text: "thinking deeply",
        time: { start: 1000 },
        ...overrides,
    };
}

function makeToolPart(overrides?: Partial<ToolPart>): ToolPart {
    return {
        id: "part-3",
        sessionID: "session-1",
        messageID: "msg-1",
        type: "tool",
        callID: "call-1",
        tool: "read_file",
        state: {
            status: "completed",
            input: { path: "/foo.ts" },
            output: "file contents",
            title: "Read file",
            metadata: {},
            time: { start: 1000, end: 2000 },
        },
        ...overrides,
    };
}

describe("PartConverter", () => {
    describe("convertPart", () => {
        it("converts a TextPart to model-text", () => {
            const part = makeTextPart();
            const result = PartConverter.convertPart(part);

            expect(result).not.toBeNull();
            expect(result!.kind).toBe("model-text");
            if (result!.kind === "model-text") {
                expect(result.content.type).toBe("text");
                expect(result.content.text).toBe("hello world");
            }
        });

        it("converts a TextPart with empty text", () => {
            const part = makeTextPart({ text: "" });
            const result = PartConverter.convertPart(part);

            expect(result).not.toBeNull();
            expect(result!.kind).toBe("model-text");
            if (result!.kind === "model-text") {
                expect(result.content.text).toBe("");
            }
        });

        it("converts a ReasoningPart to model-text with reasoning type", () => {
            const part = makeReasoningPart({ metadata: { thought: "deep" } });
            const result = PartConverter.convertPart(part);

            expect(result).not.toBeNull();
            expect(result!.kind).toBe("model-text");
            if (result!.kind === "model-text") {
                expect(result.content.type).toBe("reasoning");
                expect(result.content.text).toBe("thinking deeply");
                expect(result.content.metadata).toEqual({ thought: "deep" });
            }
        });

        it("converts a ReasoningPart without metadata (metadata is optional)", () => {
            const part = makeReasoningPart();
            const result = PartConverter.convertPart(part);

            expect(result).not.toBeNull();
            expect(result!.kind).toBe("model-text");
            if (result!.kind === "model-text") {
                expect(result.content.type).toBe("reasoning");
                expect(result.content.metadata).toBeUndefined();
            }
        });

        it("converts a ToolPart with completed state to tool-call with result", () => {
            const part = makeToolPart();
            const result = PartConverter.convertPart(part);

            expect(result).not.toBeNull();
            expect(result!.kind).toBe("tool-call");
            if (result!.kind === "tool-call") {
                expect(result.call.type).toBe("tool_use");
                expect(result.call.id).toBe("call-1");
                expect(result.call.tool).toBe("read_file");
                expect(result.call.input).toEqual({ path: "/foo.ts" });
                expect(result.result).toBeDefined();
                expect(result.result!.type).toBe("tool_result");
                expect((result.result as any).result).toBe("file contents");
            }
        });

        it("converts a ToolPart with completed state and includes metadata on result", () => {
            const part = makeToolPart({
                metadata: { source: "test" },
            });
            const result = PartConverter.convertPart(part);

            expect(result).not.toBeNull();
            if (result!.kind === "tool-call") {
                expect(result.result).toBeDefined();
                expect((result.result as any).metadata).toEqual({ source: "test" });
            }
        });

        it("converts a ToolPart with error state to tool-call with error result", () => {
            const part = makeToolPart({
                state: {
                    status: "error",
                    input: { path: "/bad.ts" },
                    error: "file not found",
                    time: { start: 1000, end: 2000 },
                },
            });
            const result = PartConverter.convertPart(part);

            expect(result).not.toBeNull();
            expect(result!.kind).toBe("tool-call");
            if (result!.kind === "tool-call") {
                expect(result.call.error).toBe("file not found");
                expect(result.result).toBeDefined();
                expect(result.result!.type).toBe("tool_result");
                expect((result.result as any).error).toBe("file not found");
            }
        });

        it("converts a ToolPart with error state and includes metadata on error result", () => {
            const part = makeToolPart({
                metadata: { errorSource: "validation" },
                state: {
                    status: "error",
                    input: { path: "/bad.ts" },
                    error: "file not found",
                    time: { start: 1000, end: 2000 },
                },
            });
            const result = PartConverter.convertPart(part);

            expect(result).not.toBeNull();
            if (result!.kind === "tool-call") {
                expect((result.result as any).metadata).toEqual({ errorSource: "validation" });
            }
        });

        it("converts a ToolPart with pending state to tool-call without result", () => {
            const part = makeToolPart({
                state: {
                    status: "pending",
                    input: { path: "/pending.ts" },
                    raw: "read_file /pending.ts",
                },
            });
            const result = PartConverter.convertPart(part);

            expect(result).not.toBeNull();
            expect(result!.kind).toBe("tool-call");
            if (result!.kind === "tool-call") {
                expect(result.call.tool).toBe("read_file");
                expect(result.result).toBeUndefined();
            }
        });

        it("converts a ToolPart with running state to tool-call without result", () => {
            const part = makeToolPart({
                state: {
                    status: "running",
                    input: { path: "/running.ts" },
                    time: { start: 1000 },
                },
            });
            const result = PartConverter.convertPart(part);

            expect(result).not.toBeNull();
            expect(result!.kind).toBe("tool-call");
            if (result!.kind === "tool-call") {
                expect(result.result).toBeUndefined();
            }
        });

        it("returns null for unsupported part types", () => {
            const part = {
                id: "part-x",
                sessionID: "session-1",
                messageID: "msg-1",
                type: "snapshot" as const,
                snapshot: "abc",
            } as unknown as Part;
            const result = PartConverter.convertPart(part);
            expect(result).toBeNull();
        });

        it("preserves metadata in tool call conversion", () => {
            const part = makeToolPart({
                metadata: { source: "test" },
            });
            const result = PartConverter.convertPart(part);

            expect(result).not.toBeNull();
            if (result!.kind === "tool-call") {
                expect(result.call.metadata).toEqual({ source: "test" });
            }
        });

        it("does not include error field on call when state is completed", () => {
            const part = makeToolPart();
            const result = PartConverter.convertPart(part);

            expect(result).not.toBeNull();
            if (result!.kind === "tool-call") {
                expect(result.call.error).toBeUndefined();
            }
        });

        it("includes error field on call only when state is error", () => {
            const part = makeToolPart({
                state: {
                    status: "error",
                    input: {},
                    error: "boom",
                    time: { start: 1000, end: 2000 },
                },
            });
            const result = PartConverter.convertPart(part);

            expect(result).not.toBeNull();
            if (result!.kind === "tool-call") {
                expect(result.call.error).toBe("boom");
            }
        });
    });
});
