import { describe, expect, it } from "bun:test";
import { getEventContentBuilder } from "./events-builders.js";
import { ResponseBuilder } from "../shared/response-builder.js";
import type { Session, Message, AssistantMessage, Part } from "@opencode-ai/sdk";

function makeSession(overrides?: Partial<Session>): Session {
    return {
        id: "sess-1",
        projectID: "proj-1",
        directory: "/project",
        parentID: undefined,
        title: "Test Session",
        version: "1.0.0",
        time: { created: 1000, updated: 2000 },
        ...overrides,
    };
}

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

function makeAssistantMessage(overrides?: Partial<AssistantMessage>): AssistantMessage {
    return {
        id: "msg-assistant",
        sessionID: "session-1",
        role: "assistant",
        time: { created: 1000, completed: 2000 },
        parentID: "",
        modelID: "model-1",
        providerID: "provider-1",
        mode: "default",
        path: { cwd: "/project", root: "/" },
        cost: 0,
        tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
        ...overrides,
    };
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

describe("getEventContentBuilder", () => {
    it("returns null for session.idle", () => {
        expect(getEventContentBuilder("session.idle")).toBeNull();
    });

    it("returns null for file.edited", () => {
        expect(getEventContentBuilder("file.edited")).toBeNull();
    });

    it("returns a function for session.created", () => {
        expect(typeof getEventContentBuilder("session.created")).toBe("function");
    });

    it("returns a function for message.updated", () => {
        expect(typeof getEventContentBuilder("message.updated")).toBe("function");
    });
});

describe("session event handlers", () => {
    describe("handleSessionCreated", () => {
        it("returns event content at info log level", () => {
            const builder = getEventContentBuilder("session.created")!;
            const session = makeSession();
            const result = builder({ type: "session.created", properties: { info: session } }, "info");

            expect(result).not.toBeNull();
            expect(result!.hook).toBe("event");
            expect(result!.title).toBe("session.created");
            expect(result!.sessionID).toBe("sess-1");
        });

        it("returns event content at debug log level (debug includes all)", () => {
            const builder = getEventContentBuilder("session.created")!;
            const session = makeSession();
            const result = builder({ type: "session.created", properties: { info: session } }, "debug");

            expect(result).not.toBeNull();
            expect(result!.sessionID).toBe("sess-1");
        });

        it("returns null at error log level (event level is info)", () => {
            const builder = getEventContentBuilder("session.created")!;
            const session = makeSession();
            const result = builder({ type: "session.created", properties: { info: session } }, "error");

            expect(result).toBeNull();
        });
    });

    describe("handleSessionDeleted", () => {
        it("returns event content at warn log level", () => {
            const builder = getEventContentBuilder("session.deleted")!;
            const session = makeSession();
            const result = builder({ type: "session.deleted", properties: { info: session } }, "warn");

            expect(result).not.toBeNull();
            expect(result!.hook).toBe("event");
            expect(result!.sessionID).toBe("sess-1");
        });

        it("returns event content at debug log level (debug includes all)", () => {
            const builder = getEventContentBuilder("session.deleted")!;
            const session = makeSession();
            const result = builder({ type: "session.deleted", properties: { info: session } }, "debug");

            expect(result).not.toBeNull();
        });

        it("returns null at error log level (event level is warn)", () => {
            const builder = getEventContentBuilder("session.deleted")!;
            const session = makeSession();
            const result = builder({ type: "session.deleted", properties: { info: session } }, "error");

            expect(result).toBeNull();
        });
    });

    describe("handleSessionError", () => {
        it("returns event content with the provided error", () => {
            const builder = getEventContentBuilder("session.error")!;
            const result = builder({
                type: "session.error",
                properties: {
                    sessionID: "sess-1",
                    error: { name: "PluginLoadError", data: { plugin: "foo" } },
                },
            }, "error");

            expect(result).not.toBeNull();
            expect(result!.hook).toBe("event");
            expect(result!.sessionID).toBe("sess-1");
            expect(result.event.properties.error).toEqual({ name: "PluginLoadError", data: { plugin: "foo" } });
        });

        it("falls back to UnrecognizedError when error is undefined", () => {
            const builder = getEventContentBuilder("session.error")!;
            const result = builder({
                type: "session.error",
                properties: { sessionID: "sess-1" },
            }, "error");

            expect(result).not.toBeNull();
            expect(result.event.properties.error).toEqual({
                name: "UnrecognizedError",
                data: {},
            });
        });

        it("defaults sessionID to empty string when missing", () => {
            const builder = getEventContentBuilder("session.error")!;
            const result = builder({
                type: "session.error",
                properties: {},
            }, "error");

            expect(result).not.toBeNull();
            expect(result!.sessionID).toBe("");
        });

        it("returns null at error log level (event level is error - only error itself passes)", () => {
            const builder = getEventContentBuilder("session.error")!;
            const result = builder({
                type: "session.error",
                properties: { sessionID: "sess-1" },
            }, "error");

            expect(result).not.toBeNull();
        });

        it("returns null at higher log level than event level", () => {
            const builder = getEventContentBuilder("session.created")!;
            const session = makeSession();
            const result = builder({ type: "session.created", properties: { info: session } }, "error");

            expect(result).toBeNull();
        });
    });

    describe("handleSessionUpdated", () => {
        it("returns event content at info log level", () => {
            const builder = getEventContentBuilder("session.updated")!;
            const session = makeSession();
            const result = builder({ type: "session.updated", properties: { info: session } }, "info");

            expect(result).not.toBeNull();
            expect(result!.sessionID).toBe("sess-1");
        });

        it("includes parentID when present at info level", () => {
            const builder = getEventContentBuilder("session.updated")!;
            const session = makeSession({ parentID: "parent-1" });
            const result = builder({ type: "session.updated", properties: { info: session } }, "info");

            expect(result).not.toBeNull();
            expect(result.event.properties.parentID).toBe("parent-1");
        });

        it("omits parentID when not present at info level", () => {
            const builder = getEventContentBuilder("session.updated")!;
            const session = makeSession();
            const result = builder({ type: "session.updated", properties: { info: session } }, "info");

            expect(result).not.toBeNull();
            expect(result.event.properties.parentID).toBeUndefined();
        });
    });

    describe("handleSessionDiff", () => {
        it("returns event content at debug log level", () => {
            const builder = getEventContentBuilder("session.diff")!;
            const result = builder({
                type: "session.diff",
                properties: { sessionID: "sess-1", diff: [] },
            }, "debug");

            expect(result).not.toBeNull();
            expect(result!.sessionID).toBe("sess-1");
        });

        it("returns null at info log level (event level is debug)", () => {
            const builder = getEventContentBuilder("session.diff")!;
            const result = builder({
                type: "session.diff",
                properties: { sessionID: "sess-1", diff: [] },
            }, "info");

            expect(result).toBeNull();
        });
    });
});

describe("message event handlers", () => {
    describe("handleMessageUpdated (assistant completed)", () => {
        it("composes response via ResponseBuilder when assistant message is completed", () => {
            const rb = ResponseBuilder.getInstance();
            rb.collectPart("msg-assistant", makeTextPart({ id: "p1", messageID: "msg-assistant" }));

            const builder = getEventContentBuilder("message.updated")!;
            const msg = makeAssistantMessage();
            const result = builder({ type: "message.updated", properties: { info: msg } }, "debug");

            expect(result).not.toBeNull();
            expect(result!.title).toBe("Response");
            expect(result!.hook).toBe("event");
        });

        it("returns event content for non-completed user message at debug level", () => {
            const builder = getEventContentBuilder("message.updated")!;
            const msg = makeUserMessage();
            const result = builder({ type: "message.updated", properties: { info: msg } }, "debug");

            expect(result).not.toBeNull();
            expect(result!.hook).toBe("event");
            expect(result!.title).toBe("message.updated");
        });

        it("returns null for non-completed message at info level (event level is debug)", () => {
            const builder = getEventContentBuilder("message.updated")!;
            const msg = makeUserMessage();
            const result = builder({ type: "message.updated", properties: { info: msg } }, "info");

            expect(result).toBeNull();
        });

        it("returns event content for assistant message without completed time at debug level", () => {
            const builder = getEventContentBuilder("message.updated")!;
            const msg = makeAssistantMessage({ time: { created: 1000 } } as any);
            const result = builder({ type: "message.updated", properties: { info: msg } }, "debug");

            expect(result).not.toBeNull();
            expect(result!.title).toBe("message.updated");
        });
    });

    describe("handleMessageRemoved", () => {
        it("returns event content at warn log level", () => {
            const builder = getEventContentBuilder("message.removed")!;
            const result = builder({
                type: "message.removed",
                properties: { sessionID: "sess-1", messageID: "msg-1" },
            }, "warn");

            expect(result).not.toBeNull();
            expect(result!.sessionID).toBe("sess-1");
            expect(result.event.properties.messageID).toBe("msg-1");
        });

        it("returns null at error log level (event level is warn)", () => {
            const builder = getEventContentBuilder("message.removed")!;
            const result = builder({
                type: "message.removed",
                properties: { sessionID: "sess-1", messageID: "msg-1" },
            }, "error");

            expect(result).toBeNull();
        });
    });

    describe("handleMessagePartUpdated", () => {
        it("collects part via ResponseBuilder when part has messageID", () => {
            const builder = getEventContentBuilder("message.part.updated")!;
            const part = makeTextPart({ id: "p1", messageID: "msg-1" });
            const result = builder({
                type: "message.part.updated",
                properties: { part },
            }, "debug");

            expect(result).not.toBeNull();
        });

        it("returns event content at debug log level", () => {
            const builder = getEventContentBuilder("message.part.updated")!;
            const part = makeTextPart();
            const result = builder({
                type: "message.part.updated",
                properties: { part },
            }, "debug");

            expect(result).not.toBeNull();
            expect(result!.hook).toBe("event");
            expect(result!.sessionID).toBe("session-1");
        });

        it("returns null at info log level (event level is debug)", () => {
            const builder = getEventContentBuilder("message.part.updated")!;
            const part = makeTextPart();
            const result = builder({
                type: "message.part.updated",
                properties: { part },
            }, "info");

            expect(result).toBeNull();
        });

        it("still collects part even when log level filters out the event", () => {
            const rb = ResponseBuilder.getInstance();
            const builder = getEventContentBuilder("message.part.updated")!;
            const part = makeTextPart({ id: "p-collect-test", messageID: "msg-collect" });

            builder({
                type: "message.part.updated",
                properties: { part },
            }, "info");

            const msg = makeAssistantMessage({ id: "msg-collect" });
            const response = rb.composeResponse(msg);
            expect(response.output.content.length).toBeGreaterThanOrEqual(1);
        });
    });
});

describe("no-session event handlers", () => {
    it("server.connected returns event at info level", () => {
        const builder = getEventContentBuilder("server.connected")!;
        const result = builder({
            type: "server.connected",
            properties: {},
        }, "info");

        expect(result).not.toBeNull();
        expect(result!.sessionID).toBe("");
    });

    it("server.instance.disposed returns event at info level", () => {
        const builder = getEventContentBuilder("server.instance.disposed")!;
        const result = builder({
            type: "server.instance.disposed",
            properties: { id: "inst-1" },
        }, "info");

        expect(result).not.toBeNull();
    });

    it("installation.updated returns event at info level", () => {
        const builder = getEventContentBuilder("installation.updated")!;
        const result = builder({
            type: "installation.updated",
            properties: { version: "2.0.0" },
        }, "info");

        expect(result).not.toBeNull();
    });

    it("lsp.client.diagnostics returns null at info level (event level is debug)", () => {
        const builder = getEventContentBuilder("lsp.client.diagnostics")!;
        const result = builder({
            type: "lsp.client.diagnostics",
            properties: {},
        }, "info");

        expect(result).toBeNull();
    });

    it("lsp.client.diagnostics returns event at debug level", () => {
        const builder = getEventContentBuilder("lsp.client.diagnostics")!;
        const result = builder({
            type: "lsp.client.diagnostics",
            properties: {},
        }, "debug");

        expect(result).not.toBeNull();
    });

    it("vcs.branch.updated returns event at info level", () => {
        const builder = getEventContentBuilder("vcs.branch.updated")!;
        const result = builder({
            type: "vcs.branch.updated",
            properties: { branch: "main" },
        }, "info");

        expect(result).not.toBeNull();
    });
});

describe("session-aware event handlers (strip sessionID from properties)", () => {
    it("session.compacted strips sessionID from properties", () => {
        const builder = getEventContentBuilder("session.compacted")!;
        const result = builder({
            type: "session.compacted",
            properties: { sessionID: "sess-1", summary: true },
        }, "info");

        expect(result).not.toBeNull();
        expect(result!.sessionID).toBe("sess-1");
        expect(result.event.properties.sessionID).toBeUndefined();
        expect(result.event.properties.summary).toBe(true);
    });

    it("session.status strips sessionID from properties and preserves other fields", () => {
        const builder = getEventContentBuilder("session.status")!;
        const result = builder({
            type: "session.status",
            properties: { sessionID: "sess-1", status: "idle" },
        }, "info");

        expect(result).not.toBeNull();
        expect(result!.sessionID).toBe("sess-1");
        expect(result.event.properties.status).toBe("idle");
    });

    it("todo.updated strips sessionID from properties", () => {
        const builder = getEventContentBuilder("todo.updated")!;
        const result = builder({
            type: "todo.updated",
            properties: { sessionID: "sess-1", todos: [] },
        }, "info");

        expect(result).not.toBeNull();
        expect(result!.sessionID).toBe("sess-1");
    });

    it("command.executed strips sessionID from properties", () => {
        const builder = getEventContentBuilder("command.executed")!;
        const result = builder({
            type: "command.executed",
            properties: { sessionID: "sess-1", command: "help" },
        }, "info");

        expect(result).not.toBeNull();
        expect(result!.sessionID).toBe("sess-1");
    });

    it("permission.updated passes through Permission properties", () => {
        const builder = getEventContentBuilder("permission.updated")!;
        const result = builder({
            type: "permission.updated",
            properties: {
                id: "perm-1",
                type: "tool",
                sessionID: "sess-1",
                title: "Allow file read",
            },
        }, "info");

        expect(result).not.toBeNull();
        expect(result!.sessionID).toBe("sess-1");
    });

    it("permission.replied strips sessionID from properties", () => {
        const builder = getEventContentBuilder("permission.replied")!;
        const result = builder({
            type: "permission.replied",
            properties: { sessionID: "sess-1", permissionID: "perm-1", response: "allow" },
        }, "info");

        expect(result).not.toBeNull();
        expect(result!.sessionID).toBe("sess-1");
    });
});

describe("handleSessionBrief (via session.deleted / session.updated)", () => {
    it("at warn level returns only sessionID and parentID", () => {
        const builder = getEventContentBuilder("session.deleted")!;
        const session = makeSession({ parentID: "parent-1" });
        const result = builder({ type: "session.deleted", properties: { info: session } }, "warn");

        expect(result).not.toBeNull();
        expect(result!.sessionID).toBe("sess-1");
        expect(result.event.properties.parentID).toBe("parent-1");
        expect(result.event.properties.projectID).toBeUndefined();
        expect(result.event.properties.title).toBeUndefined();
    });

    it("at warn level omits parentID when absent", () => {
        const builder = getEventContentBuilder("session.deleted")!;
        const session = makeSession();
        const result = builder({ type: "session.deleted", properties: { info: session } }, "warn");

        expect(result).not.toBeNull();
        expect(result.event.properties.parentID).toBeUndefined();
    });

    it("at debug level returns full session object with sessionID replacing id", () => {
        const builder = getEventContentBuilder("session.deleted")!;
        const session = makeSession();
        const result = builder({ type: "session.deleted", properties: { info: session } }, "debug");

        expect(result).not.toBeNull();
        expect(result.event.properties.projectID).toBe("proj-1");
        expect(result.event.properties.title).toBe("Test Session");
    });
});

describe("handleSessionDetail (via session.created)", () => {
    it("at info level returns limited session fields", () => {
        const builder = getEventContentBuilder("session.created")!;
        const session = makeSession({ parentID: "parent-1" });
        const result = builder({ type: "session.created", properties: { info: session } }, "info");

        expect(result).not.toBeNull();
        expect(result!.sessionID).toBe("sess-1");
        expect(result.event.properties.projectID).toBe("proj-1");
        expect(result.event.properties.directory).toBe("/project");
        expect(result.event.properties.parentID).toBe("parent-1");
        expect(result.event.properties.title).toBe("Test Session");
        expect(result.event.properties.version).toBe("1.0.0");
    });

    it("at debug level returns full session object with sessionID replacing id", () => {
        const builder = getEventContentBuilder("session.created")!;
        const session = makeSession();
        const result = builder({ type: "session.created", properties: { info: session } }, "debug");

        expect(result).not.toBeNull();
        expect(result.event.properties.projectID).toBe("proj-1");
        expect(result.event.properties.summary).toBeUndefined();
    });
});
