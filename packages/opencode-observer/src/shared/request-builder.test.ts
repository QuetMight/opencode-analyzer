import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { RequestBuilder } from "./request-builder.js";
import type { MessageDetails } from "./request-builder.js";
import type { Message, Part } from "@opencode-ai/sdk";

function makeUserMessage(overrides?: Partial<Message>): Message {
    return {
        id: "msg-1",
        sessionID: "session-1",
        role: "user",
        time: { created: 1000 },
        parentID: "",
        modelID: "model-1",
        providerID: "provider-1",
        mode: "default",
        path: { cwd: "/project", root: "/" },
        cost: 0,
        tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
        ...overrides,
    } as Message;
}

function makeTextPart(overrides?: Partial<Part>): Part {
    return {
        id: "part-1",
        sessionID: "session-1",
        messageID: "msg-1",
        type: "text",
        text: "hello",
        ...overrides,
    } as Part;
}

function makeToolPart(overrides?: Partial<Part>): Part {
    return {
        id: "part-tool",
        sessionID: "session-1",
        messageID: "msg-1",
        type: "tool",
        callID: "call-1",
        tool: "read_file",
        state: {
            status: "completed",
            input: { path: "/foo.ts" },
            output: "file contents",
            title: "Read",
            metadata: {},
            time: { start: 1000, end: 2000 },
        },
        ...overrides,
    } as Part;
}

function makeMessageDetails(msg?: Partial<Message>, parts?: Part[]): MessageDetails {
    return {
        info: makeUserMessage(msg),
        parts: parts ?? [makeTextPart()],
    };
}

describe("RequestBuilder", () => {
    let builder: RequestBuilder;

    beforeEach(() => {
        builder = RequestBuilder.getInstance();
    });

    afterEach(() => {
        builder.clear();
    });

    describe("singleton", () => {
        it("returns the same instance", () => {
            const a = RequestBuilder.getInstance();
            const b = RequestBuilder.getInstance();
            expect(a).toBe(b);
        });
    });

    describe("collectMessages", () => {
        it("stores messages for a session", () => {
            const details = makeMessageDetails();
            builder.collectMessages("session-1", [details]);

            const result = builder.composeRequest("session-1");
            expect(result).not.toBeNull();
            expect(result!.sessionID).toBe("session-1");
            expect(result!.hook).toBe("experimental.chat.messages.transform");
        });

        it("stores messages for multiple sessions independently", () => {
            const details1 = makeMessageDetails({ sessionID: "session-1" });
            const details2 = makeMessageDetails({ sessionID: "session-2", id: "msg-2" });

            builder.collectMessages("session-1", [details1]);
            builder.collectMessages("session-2", [details2]);

            const result1 = builder.composeRequest("session-1");
            expect(result1).not.toBeNull();
            expect(result1!.sessionID).toBe("session-1");

            const result2 = builder.composeRequest("session-2");
            expect(result2).not.toBeNull();
            expect(result2!.sessionID).toBe("session-2");
        });

        it("handles empty messages array", () => {
            builder.collectMessages("session-empty", []);

            const result = builder.composeRequest("session-empty");
            expect(result).not.toBeNull();
            expect((result as any).output.messages).toEqual([]);
        });

        it("handles messages with tool parts (collectPartsForMessage tool-call branch)", () => {
            const details = makeMessageDetails(
                { id: "msg-tool" },
                [makeTextPart({ id: "p1" }), makeToolPart({ id: "p2" })]
            );
            builder.collectMessages("session-tool", [details]);

            const result = builder.composeRequest("session-tool");
            expect(result).not.toBeNull();
            const messages = (result as any).output.messages;
            expect(messages).toHaveLength(1);
            expect(messages[0].content.length).toBe(3);
            expect(messages[0].content[0].type).toBe("text");
            expect(messages[0].content[1].type).toBe("tool_use");
            expect(messages[0].content[2].type).toBe("tool_result");
        });

        it("handles messages with pending tool parts (no result)", () => {
            const pendingToolPart: Part = {
                id: "p-pending",
                sessionID: "session-1",
                messageID: "msg-1",
                type: "tool",
                callID: "call-pending",
                tool: "bash",
                state: {
                    status: "pending",
                    input: { command: "ls" },
                    raw: "bash ls",
                },
            } as Part;

            const details = makeMessageDetails({ id: "msg-pending" }, [pendingToolPart]);
            builder.collectMessages("session-pending", [details]);

            const result = builder.composeRequest("session-pending");
            expect(result).not.toBeNull();
            const messages = (result as any).output.messages;
            expect(messages[0].content.length).toBe(1);
            expect(messages[0].content[0].type).toBe("tool_use");
        });

        it("skips unsupported part types in messages", () => {
            const snapshotPart = {
                id: "p-snap",
                sessionID: "session-1",
                messageID: "msg-1",
                type: "snapshot",
                snapshot: "abc",
            } as unknown as Part;

            const details = makeMessageDetails({ id: "msg-snap" }, [makeTextPart({ id: "p1" }), snapshotPart]);
            builder.collectMessages("session-snap", [details]);

            const result = builder.composeRequest("session-snap");
            expect(result).not.toBeNull();
            const messages = (result as any).output.messages;
            expect(messages[0].content.length).toBe(1);
            expect(messages[0].content[0].type).toBe("text");
        });
    });

    describe("collectSystemPrompt", () => {
        it("returns 'request' for non-title system prompts", () => {
            const result = builder.collectSystemPrompt("session-1", "You are a helpful assistant.");
            expect(result).toBe("request");
        });

        it("returns 'title' for title generator prompts", () => {
            const TITLE_PROMPT = "You are a title generator. Your output ONLY a thread title. Nothing else.";
            const result = builder.collectSystemPrompt("session-1", TITLE_PROMPT);
            expect(result).toBe("title");
        });

        it("returns 'title' when title prompt is part of an array", () => {
            const TITLE_PROMPT = "You are a title generator. Your output ONLY a thread title. Nothing else.";
            const result = builder.collectSystemPrompt("session-1", [TITLE_PROMPT]);
            expect(result).toBe("title");
        });

        it("returns 'title' when title prompt is embedded within a longer string", () => {
            const TITLE_PROMPT = "You are a title generator. Your output ONLY a thread title. Nothing else.";
            const result = builder.collectSystemPrompt("session-1", `Some prefix. ${TITLE_PROMPT}`);
            expect(result).toBe("title");
        });

        it("returns null for empty system prompt", () => {
            const result = builder.collectSystemPrompt("session-1", "");
            expect(result).toBeNull();
        });

        it("returns null for empty array joined to empty string", () => {
            const result = builder.collectSystemPrompt("session-1", []);
            expect(result).toBeNull();
        });

        it("returns null when system prompt has not changed", () => {
            builder.collectSystemPrompt("session-1", "same prompt");
            const result = builder.collectSystemPrompt("session-1", "same prompt");
            expect(result).toBeNull();
        });

        it("returns 'request' when system prompt has changed", () => {
            builder.collectSystemPrompt("session-1", "first prompt");
            const result = builder.collectSystemPrompt("session-1", "second prompt");
            expect(result).toBe("request");
        });

        it("does not store title prompt in pendingSystemPrompt", () => {
            const TITLE_PROMPT = "You are a title generator. Your output ONLY a thread title. Nothing else.";
            builder.collectSystemPrompt("session-title-test", TITLE_PROMPT);

            const details = makeMessageDetails({ sessionID: "session-title-test" });
            builder.collectMessages("session-title-test", [details]);

            const result = builder.composeRequest("session-title-test");
            expect(result).not.toBeNull();
            expect((result as any).output.system).toBe("");
        });

        it("stores system prompt for different sessions independently", () => {
            builder.collectSystemPrompt("session-a", "prompt A");
            builder.collectSystemPrompt("session-b", "prompt B");

            const detailsA = makeMessageDetails({ sessionID: "session-a" });
            const detailsB = makeMessageDetails({ sessionID: "session-b", id: "msg-b" });
            builder.collectMessages("session-a", [detailsA]);
            builder.collectMessages("session-b", [detailsB]);

            const resultA = builder.composeRequest("session-a");
            expect((resultA as any).output.system).toBe("prompt A");

            const resultB = builder.composeRequest("session-b");
            expect((resultB as any).output.system).toBe("prompt B");
        });
    });

    describe("composeRequest", () => {
        it("returns null when no messages have been collected", () => {
            const result = builder.composeRequest("nonexistent-session");
            expect(result).toBeNull();
        });

        it("returns composed request with messages", () => {
            const details = makeMessageDetails();
            builder.collectMessages("session-1", [details]);

            const result = builder.composeRequest("session-1");
            expect(result).not.toBeNull();
            expect(result!.hook).toBe("experimental.chat.messages.transform");
            expect(result!.title).toBe("Request");
            expect(result!.sessionID).toBe("session-1");
            expect((result as any).output.messages).toBeDefined();
            expect((result as any).output.messages.length).toBe(1);
        });

        it("includes system prompt when collected", () => {
            const details = makeMessageDetails();
            builder.collectMessages("session-1", [details]);
            builder.collectSystemPrompt("session-1", "You are helpful.");

            const result = builder.composeRequest("session-1");
            expect(result).not.toBeNull();
            expect((result as any).output.system).toBe("You are helpful.");
        });

        it("defaults system to empty string when not collected", () => {
            const details = makeMessageDetails();
            builder.collectMessages("session-1", [details]);

            const result = builder.composeRequest("session-1");
            expect(result).not.toBeNull();
            expect((result as any).output.system).toBe("");
        });

        it("clears pending data after composing", () => {
            const details = makeMessageDetails();
            builder.collectMessages("session-1", [details]);

            builder.composeRequest("session-1");

            const result = builder.composeRequest("session-1");
            expect(result).toBeNull();
        });

        it("clears system prompt along with messages after composing", () => {
            const details = makeMessageDetails();
            builder.collectMessages("session-1", [details]);
            builder.collectSystemPrompt("session-1", "test prompt");

            builder.composeRequest("session-1");

            builder.collectMessages("session-1", [details]);
            const result = builder.composeRequest("session-1");
            expect(result).not.toBeNull();
            expect((result as any).output.system).toBe("");
        });

        it("composes request with multiple messages", () => {
            const details1 = makeMessageDetails({ id: "msg-1", role: "user" });
            const details2 = makeMessageDetails({ id: "msg-2", role: "assistant" });

            builder.collectMessages("session-1", [details1, details2]);

            const result = builder.composeRequest("session-1");
            expect(result).not.toBeNull();
            expect((result as any).output.messages.length).toBe(2);
            expect((result as any).output.messages[0].role).toBe("user");
            expect((result as any).output.messages[1].role).toBe("assistant");
        });

        it("joins array system prompts with newline", () => {
            const details = makeMessageDetails();
            builder.collectMessages("session-1", [details]);
            builder.collectSystemPrompt("session-1", ["line1", "line2"]);

            const result = builder.composeRequest("session-1");
            expect(result).not.toBeNull();
            expect((result as any).output.system).toBe("line1\nline2");
        });

        it("overwrites previous messages for the same session on re-collection", () => {
            const details1 = makeMessageDetails({ id: "msg-first" });
            builder.collectMessages("session-1", [details1]);

            const details2 = makeMessageDetails({ id: "msg-second" });
            builder.collectMessages("session-1", [details2]);

            const result = builder.composeRequest("session-1");
            expect(result).not.toBeNull();
            expect((result as any).output.messages).toHaveLength(1);
            expect((result as any).output.messages[0].role).toBeDefined();
        });
    });
});
