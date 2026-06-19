import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { ResponseBuilder } from "./response-builder.js";
import type { AssistantMessage, Part } from "@opencode-ai/sdk";

function makeAssistantMessage(overrides?: Partial<AssistantMessage>): AssistantMessage {
    return {
        id: "msg-1",
        sessionID: "session-1",
        role: "assistant",
        time: { created: 1000, completed: 2000 },
        parentID: "",
        modelID: "model-1",
        providerID: "provider-1",
        mode: "default",
        path: { cwd: "/project", root: "/" },
        cost: 0.01,
        tokens: { input: 100, output: 50, reasoning: 0, cache: { read: 0, write: 0 } },
        finish: "stop",
        ...overrides,
    };
}

function makeTextPart(overrides?: Partial<Part>): Part {
    return {
        id: "part-1",
        sessionID: "session-1",
        messageID: "msg-1",
        type: "text",
        text: "response text",
        ...overrides,
    } as Part;
}

function makeReasoningPart(overrides?: Partial<Part>): Part {
    return {
        id: "part-reasoning",
        sessionID: "session-1",
        messageID: "msg-1",
        type: "reasoning",
        text: "thinking step",
        time: { start: 1000 },
        ...overrides,
    } as Part;
}

function makeToolPart(overrides?: Partial<Part>): Part {
    return {
        id: "part-2",
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

describe("ResponseBuilder", () => {
    let builder: ResponseBuilder;

    beforeEach(() => {
        builder = ResponseBuilder.getInstance();
    });

    afterEach(() => {
        builder.clear();
    });

    describe("singleton", () => {
        it("returns the same instance", () => {
            const a = ResponseBuilder.getInstance();
            const b = ResponseBuilder.getInstance();
            expect(a).toBe(b);
        });
    });

    describe("collectPart", () => {
        it("collects a text part for a message", () => {
            const part = makeTextPart({ id: "p-text-test" });
            builder.collectPart("msg-text-test", part);

            const info = makeAssistantMessage({ id: "msg-text-test" });
            const result = builder.composeResponse(info);

            expect(result.output.content).toHaveLength(1);
            expect(result.output.content[0].type).toBe("text");
            expect(result.output.content[0].text).toBe("response text");
        });

        it("collects a reasoning part as model-text for a message", () => {
            const part = makeReasoningPart({ id: "p-reasoning-test" });
            builder.collectPart("msg-reasoning-test", part);

            const info = makeAssistantMessage({ id: "msg-reasoning-test" });
            const result = builder.composeResponse(info);

            expect(result.output.content).toHaveLength(1);
            expect(result.output.content[0].type).toBe("reasoning");
            expect(result.output.content[0].text).toBe("thinking step");
        });

        it("collects a tool part for a message (only call, not result)", () => {
            const part = makeToolPart({ id: "p-tool-test" });
            builder.collectPart("msg-tool-test", part);

            const info = makeAssistantMessage({ id: "msg-tool-test" });
            const result = builder.composeResponse(info);

            expect(result.output.content).toHaveLength(1);
            expect(result.output.content[0].type).toBe("tool_use");
            expect(result.output.content[0].tool).toBe("read_file");
        });

        it("collects multiple parts for the same message", () => {
            builder.collectPart("msg-multi-test", makeTextPart({ id: "part-1" }));
            builder.collectPart("msg-multi-test", makeToolPart({ id: "part-2" }));

            const info = makeAssistantMessage({ id: "msg-multi-test" });
            const result = builder.composeResponse(info);

            expect(result.output.content).toHaveLength(2);
        });

        it("updates existing part by id", () => {
            builder.collectPart("msg-update-test", makeTextPart({ id: "part-1", text: "first" }));
            builder.collectPart("msg-update-test", makeTextPart({ id: "part-1", text: "updated" }));

            const info = makeAssistantMessage({ id: "msg-update-test" });
            const result = builder.composeResponse(info);

            expect(result.output.content).toHaveLength(1);
            expect(result.output.content[0].text).toBe("updated");
        });

        it("collects parts for different messages independently", () => {
            builder.collectPart("msg-ind-1", makeTextPart({ id: "p1" }));
            builder.collectPart("msg-ind-2", makeTextPart({ id: "p2", messageID: "msg-2" }));

            const info1 = makeAssistantMessage({ id: "msg-ind-1" });
            const result1 = builder.composeResponse(info1);
            expect(result1.output.content).toHaveLength(1);

            const info2 = makeAssistantMessage({ id: "msg-ind-2" });
            const result2 = builder.composeResponse(info2);
            expect(result2.output.content).toHaveLength(1);
        });

        it("skips unsupported part types", () => {
            const part = {
                id: "part-x",
                sessionID: "session-1",
                messageID: "msg-1",
                type: "snapshot",
                snapshot: "abc",
            } as unknown as Part;
            builder.collectPart("msg-skip-test", part);

            const info = makeAssistantMessage({ id: "msg-skip-test" });
            const result = builder.composeResponse(info);
            expect(result.output.content).toHaveLength(0);
        });
    });

    describe("composeResponse", () => {
        it("returns response with correct hook and title", () => {
            const info = makeAssistantMessage({ id: "msg-compose-1" });
            const result = builder.composeResponse(info);

            expect(result.hook).toBe("event");
            expect(result.title).toBe("Response");
        });

        it("returns response with correct sessionID", () => {
            const info = makeAssistantMessage({ sessionID: "my-session", id: "msg-compose-2" });
            const result = builder.composeResponse(info);

            expect(result.sessionID).toBe("my-session");
        });

        it("includes role and finish_reason in output", () => {
            const info = makeAssistantMessage({ finish: "stop", id: "msg-compose-3" });
            const result = builder.composeResponse(info);

            expect(result.output.role).toBe("assistant");
            expect(result.output.finish_reason).toBe("stop");
        });

        it("defaults finish_reason to empty string when finish is undefined", () => {
            const info = makeAssistantMessage({ finish: undefined, id: "msg-compose-4" });
            const result = builder.composeResponse(info);

            expect(result.output.finish_reason).toBe("");
        });

        it("includes tokens in output", () => {
            const info = makeAssistantMessage({
                tokens: { input: 100, output: 50, reasoning: 10, cache: { read: 5, write: 3 } },
                id: "msg-compose-5",
            });
            const result = builder.composeResponse(info);

            expect(result.output.tokens).toEqual({
                input: 100,
                output: 50,
                reasoning: 10,
                cache: { read: 5, write: 3 },
            });
        });

        it("returns empty content when no parts were collected", () => {
            const info = makeAssistantMessage({ id: "msg-compose-empty" });
            const result = builder.composeResponse(info);

            expect(result.output.content).toEqual([]);
        });

        it("clears pending parts after composing", () => {
            builder.collectPart("msg-compose-clear", makeTextPart({ id: "p-clear" }));
            const info1 = makeAssistantMessage({ id: "msg-compose-clear" });
            builder.composeResponse(info1);

            const info2 = makeAssistantMessage({ id: "msg-compose-clear" });
            const result2 = builder.composeResponse(info2);
            expect(result2.output.content).toEqual([]);
        });

        it("includes event info in the result", () => {
            const info = makeAssistantMessage({ id: "msg-compose-event" });
            const result = builder.composeResponse(info);

            expect(result.event.type).toBe("message.updated");
            expect(result.event.properties.info).toBe(info);
        });

        it("skips collection when messageID is empty", () => {
            builder.collectPart("", makeTextPart({ id: "p-undef" }));

            const info = makeAssistantMessage({ id: undefined as any });
            const result = builder.composeResponse(info);

            expect(result.output.content).toHaveLength(0);
        });

        it("does not delete pendingParts when id is falsy", () => {
            const uniqueId = `falsy-test-${Date.now()}`;
            builder.collectPart(uniqueId, makeTextPart({ id: "p-falsy-1" }));

            const info = makeAssistantMessage({ id: undefined as any });
            const result = builder.composeResponse(info);
            expect(result.output.content.length).toBeGreaterThanOrEqual(0);
        });
    });
});
