import { describe, expect, it } from "bun:test";
import { getHookContentBuilder, GENERAL_LOGGER_HOOK_NAMES } from "./hooks-builders.js";
import { RequestBuilder } from "../shared/request-builder.js";
import type { HookInput, HookOutput } from "../types.js";
import type { Part, UserMessage } from "@opencode-ai/sdk";

function makeUserMessage(overrides?: Partial<UserMessage>): UserMessage {
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
    } as UserMessage;
}

describe("GENERAL_LOGGER_HOOK_NAMES", () => {
    it("contains all expected hook names", () => {
        expect(GENERAL_LOGGER_HOOK_NAMES).toContain("event");
        expect(GENERAL_LOGGER_HOOK_NAMES).toContain("config");
        expect(GENERAL_LOGGER_HOOK_NAMES).toContain("chat.message");
        expect(GENERAL_LOGGER_HOOK_NAMES).toContain("chat.params");
        expect(GENERAL_LOGGER_HOOK_NAMES).toContain("chat.headers");
        expect(GENERAL_LOGGER_HOOK_NAMES).toContain("permission.ask");
        expect(GENERAL_LOGGER_HOOK_NAMES).toContain("command.execute.before");
        expect(GENERAL_LOGGER_HOOK_NAMES).toContain("tool.execute.before");
        expect(GENERAL_LOGGER_HOOK_NAMES).toContain("tool.execute.after");
        expect(GENERAL_LOGGER_HOOK_NAMES).toContain("shell.env");
        expect(GENERAL_LOGGER_HOOK_NAMES).toContain("experimental.chat.messages.transform");
        expect(GENERAL_LOGGER_HOOK_NAMES).toContain("experimental.chat.system.transform");
        expect(GENERAL_LOGGER_HOOK_NAMES).toContain("experimental.session.compacting");
        expect(GENERAL_LOGGER_HOOK_NAMES).toContain("experimental.text.complete");
        expect(GENERAL_LOGGER_HOOK_NAMES).toContain("tool.definition");
    });
});

describe("getHookContentBuilder", () => {
    it("returns null for experimental.text.complete", () => {
        expect(getHookContentBuilder("experimental.text.complete")).toBeNull();
    });

    it("returns a function for config", () => {
        expect(typeof getHookContentBuilder("config")).toBe("function");
    });

    it("returns a function for event", () => {
        expect(typeof getHookContentBuilder("event")).toBe("function");
    });
});

describe("configContentBuilder", () => {
    it("returns config content at info log level", () => {
        const builder = getHookContentBuilder("config")!;
        const result = builder(
            { provider: { openai: {} }, permission: { allow: [] }, plugin: [], agent: { code: {} }, command: { help: {} }, model: "gpt-4" } as any,
            {} as any,
            "info"
        );

        expect(result).not.toBeNull();
        expect(result!.hook).toBe("config");
        expect(result!.sessionID).toBe("");
        expect(result.config.provider).toEqual(["openai"]);
        expect(result.config.agent).toEqual(["code"]);
        expect(result.config.command).toEqual(["help"]);
        expect(result.config.model).toBe("gpt-4");
    });

    it("returns null at error log level (hook level is info)", () => {
        const builder = getHookContentBuilder("chat.message")!;
        const msg = makeUserMessage();
        const result = builder(
            { sessionID: "s1" } as any,
            { message: { ...msg, agent: "code", model: { providerID: "p", modelID: "m" } }, parts: [] } as any,
            "error"
        );

        expect(result).toBeNull();
    });

    it("returns content at debug log level (debug includes all)", () => {
        const builder = getHookContentBuilder("chat.message")!;
        const msg = makeUserMessage();
        const result = builder(
            { sessionID: "s1" } as any,
            { message: { ...msg, agent: "code", model: { providerID: "p", modelID: "m" } }, parts: [] } as any,
            "debug"
        );

        expect(result).not.toBeNull();
    });

    it("handles missing optional fields", () => {
        const builder = getHookContentBuilder("config")!;
        const result = builder({} as any, {} as any, "info");

        expect(result).not.toBeNull();
        expect(result.config.provider).toEqual([]);
        expect(result.config.permission).toEqual({});
        expect(result.config.plugin).toEqual([]);
        expect(result.config.agent).toEqual([]);
        expect(result.config.command).toEqual([]);
        expect(result.config.model).toBe("");
    });
});

describe("chatMessageContentBuilder", () => {
    it("returns message content at info log level", () => {
        const builder = getHookContentBuilder("chat.message")!;
        const msg = makeUserMessage();
        const result = builder(
            {
                sessionID: "session-1",
                agent: "code",
                model: { providerID: "openai", modelID: "gpt-4" },
            } as any,
            {
                message: { ...msg, agent: "code", model: { providerID: "openai", modelID: "gpt-4" }, system: "You are helpful." },
                parts: [],
            } as any,
            "info"
        );

        expect(result).not.toBeNull();
        expect(result!.hook).toBe("chat.message");
        expect(result!.sessionID).toBe("session-1");
        expect(result.messageInfo.agent).toBe("code");
        expect(result.messageInfo.model).toBe("openai/gpt-4");
        expect(result.messageInfo.system).toBe("You are helpful.");
    });

    it("returns content at debug log level (debug includes all)", () => {
        const builder = getHookContentBuilder("chat.message")!;
        const msg = makeUserMessage();
        const result = builder(
            { sessionID: "s1" } as any,
            { message: { ...msg, agent: "code", model: { providerID: "p", modelID: "m" } }, parts: [] } as any,
            "debug"
        );

        expect(result).not.toBeNull();
    });

    it("defaults system to empty string when undefined", () => {
        const builder = getHookContentBuilder("chat.message")!;
        const msg = makeUserMessage();
        const result = builder(
            { sessionID: "s1" } as any,
            { message: { ...msg, agent: "code", model: { providerID: "p", modelID: "m" } }, parts: [] } as any,
            "info"
        );

        expect(result).not.toBeNull();
        expect(result.messageInfo.system).toBe("");
    });
});

describe("chatParamsContentBuilder", () => {
    it("returns params content at debug log level", () => {
        const builder = getHookContentBuilder("chat.params")!;
        const msg = makeUserMessage();
        const result = builder(
            { sessionID: "session-1", agent: "code", model: { providerID: "openai", id: "gpt-4" }, message: msg } as any,
            { temperature: 0.7, topP: 1, topK: 0, options: {} } as any,
            "debug"
        );

        expect(result).not.toBeNull();
        expect(result!.hook).toBe("chat.params");
        expect(result!.sessionID).toBe("session-1");
        expect(result.input.agent).toBe("code");
        expect(result.input.model).toBe("openai/gpt-4");
        expect(result.input.messageID).toBe("msg-1");
    });

    it("returns null at info log level (hook level is debug)", () => {
        const builder = getHookContentBuilder("chat.params")!;
        const result = builder({} as any, {} as any, "info");

        expect(result).toBeNull();
    });
});

describe("chatHeadersContentBuilder", () => {
    it("composes request via RequestBuilder", () => {
        const rb = RequestBuilder.getInstance();
        const msg = makeUserMessage();
        const part: Part = {
            id: "p1",
            sessionID: "session-1",
            messageID: "msg-1",
            type: "text",
            text: "hello",
        } as Part;
        rb.collectMessages("session-1", [{ info: msg, parts: [part] }]);
        rb.collectSystemPrompt("session-1", "test prompt");

        const builder = getHookContentBuilder("chat.headers")!;
        const result = builder(
            { sessionID: "session-1" } as any,
            { headers: {} } as any,
            "debug"
        );

        expect(result).not.toBeNull();
        expect(result!.hook).toBe("experimental.chat.messages.transform");
        expect(result!.title).toBe("Request");
        expect(result!.sessionID).toBe("session-1");
        expect(result.output.system).toBe("test prompt");
    });

    it("returns null when no pending messages exist", () => {
        const builder = getHookContentBuilder("chat.headers")!;
        const result = builder(
            { sessionID: "nonexistent" } as any,
            { headers: {} } as any,
            "debug"
        );

        expect(result).toBeNull();
    });

    it("does not check log level", () => {
        const rb = RequestBuilder.getInstance();
        const msg = makeUserMessage({ sessionID: "session-nl" });
        rb.collectMessages("session-nl", [{ info: msg, parts: [] }]);

        const builder = getHookContentBuilder("chat.headers")!;
        const result = builder(
            { sessionID: "session-nl" } as any,
            { headers: {} } as any,
            "debug"
        );

        expect(result).not.toBeNull();
    });
});

describe("permissionAskContentBuilder", () => {
    it("returns content at info log level", () => {
        const builder = getHookContentBuilder("permission.ask")!;
        const result = builder(
            { id: "perm-1", type: "tool", sessionID: "session-1", title: "Allow read" } as any,
            { status: "ask" } as any,
            "info"
        );

        expect(result).not.toBeNull();
        expect(result!.hook).toBe("permission.ask");
        expect(result!.sessionID).toBe("session-1");
        expect(result.input.id).toBe("perm-1");
        expect(result.input.title).toBe("Allow read");
        expect(result.output.status).toBe("ask");
    });

    it("returns null at error log level (hook level is info)", () => {
        const builder = getHookContentBuilder("experimental.session.compacting")!;
        const result = builder(
            { sessionID: "session-1" } as any,
            { context: [], prompt: undefined } as any,
            "error"
        );

        expect(result).toBeNull();
    });

    it("returns content at debug log level (debug includes all)", () => {
        const builder = getHookContentBuilder("experimental.session.compacting")!;
        const result = builder(
            { sessionID: "session-1" } as any,
            { context: [] } as any,
            "debug"
        );

        expect(result).not.toBeNull();
    });
});

describe("toolExecuteBeforeContentBuilder", () => {
    it("returns content with title toolCall at info log level", () => {
        const builder = getHookContentBuilder("tool.execute.before")!;
        const result = builder(
            { tool: "read_file", sessionID: "session-1", callID: "call-1" } as any,
            { args: { path: "/foo" } } as any,
            "info"
        );

        expect(result).not.toBeNull();
        expect(result!.hook).toBe("tool.execute.before");
        expect(result.title).toBe("toolCall");
        expect(result!.sessionID).toBe("session-1");
        expect(result.input.tool).toBe("read_file");
        expect(result.input.callID).toBe("call-1");
        expect(result.output.args).toEqual({ path: "/foo" });
    });
});

describe("toolExecuteAfterContentBuilder", () => {
    it("returns content with title toolResult at info log level", () => {
        const builder = getHookContentBuilder("tool.execute.after")!;
        const result = builder(
            { tool: "read_file", sessionID: "session-1", callID: "call-1", args: {} } as any,
            { title: "Read file", output: "contents", metadata: {} } as any,
            "info"
        );

        expect(result).not.toBeNull();
        expect(result!.hook).toBe("tool.execute.after");
        expect(result.title).toBe("toolResult");
        expect(result!.sessionID).toBe("session-1");
        expect(result.input.tool).toBe("read_file");
        expect(result.output.title).toBe("Read file");
        expect(result.output.output).toBe("contents");
    });
});

describe("shellEnvContentBuilder", () => {
    it("returns content at debug log level", () => {
        const builder = getHookContentBuilder("shell.env")!;
        const result = builder(
            { cwd: "/project", sessionID: "session-1" } as any,
            { env: { PATH: "/usr/bin" } } as any,
            "debug"
        );

        expect(result).not.toBeNull();
        expect(result!.hook).toBe("shell.env");
        expect(result!.sessionID).toBe("session-1");
        expect(result.input.cwd).toBe("/project");
        expect(result.output.env).toEqual({ PATH: "/usr/bin" });
    });

    it("defaults sessionID to empty string when undefined", () => {
        const builder = getHookContentBuilder("shell.env")!;
        const result = builder(
            { cwd: "/project" } as any,
            { env: {} } as any,
            "debug"
        );

        expect(result).not.toBeNull();
        expect(result!.sessionID).toBe("");
    });

    it("returns null at info log level (hook level is debug)", () => {
        const builder = getHookContentBuilder("shell.env")!;
        const result = builder({} as any, {} as any, "info");

        expect(result).toBeNull();
    });
});

describe("chatMessagesTransformContentBuilder", () => {
    it("collects messages via RequestBuilder", () => {
        const rb = RequestBuilder.getInstance();
        const msg = makeUserMessage();
        const builder = getHookContentBuilder("experimental.chat.messages.transform")!;
        const result = builder(
            {} as any,
            { messages: [{ info: msg, parts: [] }] } as any,
            "debug"
        );

        expect(result).toBeNull();

        const composed = rb.composeRequest("session-1");
        expect(composed).not.toBeNull();
        expect(composed!.sessionID).toBe("session-1");
    });

    it("returns null when messages array is empty", () => {
        const builder = getHookContentBuilder("experimental.chat.messages.transform")!;
        const result = builder(
            {} as any,
            { messages: [] } as any,
            "debug"
        );

        expect(result).toBeNull();
    });

    it("does not check log level", () => {
        const msg = makeUserMessage({ sessionID: "session-nl2" });
        const builder = getHookContentBuilder("experimental.chat.messages.transform")!;
        const result = builder(
            {} as any,
            { messages: [{ info: msg, parts: [] }] } as any,
            "info"
        );

        expect(result).toBeNull();

        const composed = RequestBuilder.getInstance().composeRequest("session-nl2");
        expect(composed).not.toBeNull();
    });
});

describe("chatSystemTransformContentBuilder", () => {
    it("returns null when system prompt type is 'request'", () => {
        const builder = getHookContentBuilder("experimental.chat.system.transform")!;
        const result = builder(
            { sessionID: "session-sys", model: { providerID: "openai", id: "gpt-4" } } as any,
            { system: ["You are a helpful assistant."] } as any,
            "info"
        );

        expect(result).toBeNull();
    });

    it("returns TitleGenerator output when system prompt type is 'title'", () => {
        const TITLE_PROMPT = "You are a title generator. Your output ONLY a thread title. Nothing else.";
        const builder = getHookContentBuilder("experimental.chat.system.transform")!;
        const result = builder(
            { sessionID: "session-title", model: { providerID: "openai", id: "gpt-4" } } as any,
            { system: [TITLE_PROMPT] } as any,
            "info"
        );

        expect(result).not.toBeNull();
        expect(result!.hook).toBe("experimental.chat.system.transform");
        expect(result.title).toBe("TitleGenerator");
    });

    it("returns system transform output when sessionID is missing", () => {
        const builder = getHookContentBuilder("experimental.chat.system.transform")!;
        const result = builder(
            { model: { providerID: "openai", id: "gpt-4" } } as any,
            { system: ["You are helpful."] } as any,
            "info"
        );

        expect(result).not.toBeNull();
        expect(result!.sessionID).toBe("");
        expect(result.title).toBeUndefined();
    });

    it("returns null when system is empty and log level is debug", () => {
        const builder = getHookContentBuilder("experimental.chat.system.transform")!;
        const result = builder(
            { sessionID: "session-1" } as any,
            { system: [] } as any,
            "info"
        );

        expect(result).not.toBeNull();
    });

    it("returns null at error log level when system is empty (hook level is info)", () => {
        const builder = getHookContentBuilder("experimental.chat.system.transform")!;
        const result = builder(
            { sessionID: "session-1" } as any,
            { system: [] } as any,
            "error"
        );

        expect(result).toBeNull();
    });

    it("includes model in input when present", () => {
        const builder = getHookContentBuilder("experimental.chat.system.transform")!;
        const result = builder(
            { sessionID: "session-1", model: { providerID: "anthropic", id: "claude-3" } } as any,
            { system: [] } as any,
            "info"
        );

        expect(result).not.toBeNull();
        expect(result.input.model).toBe("anthropic/claude-3");
    });

    it("defaults model to empty string when not present", () => {
        const builder = getHookContentBuilder("experimental.chat.system.transform")!;
        const result = builder(
            { sessionID: "session-1" } as any,
            { system: [] } as any,
            "info"
        );

        expect(result).not.toBeNull();
        expect(result.input.model).toBe("");
    });
});

describe("sessionCompactingContentBuilder", () => {
    it("returns content at info log level", () => {
        const builder = getHookContentBuilder("experimental.session.compacting")!;
        const result = builder(
            { sessionID: "session-1" } as any,
            { context: ["summary"], prompt: "Compact this" } as any,
            "info"
        );

        expect(result).not.toBeNull();
        expect(result!.hook).toBe("experimental.session.compacting");
        expect(result!.sessionID).toBe("session-1");
        expect(result.output.context).toEqual(["summary"]);
        expect(result.output.prompt).toBe("Compact this");
    });

    it("returns content at debug log level (debug includes all)", () => {
        const builder = getHookContentBuilder("experimental.session.compacting")!;
        const result = builder(
            { sessionID: "session-1" } as any,
            { context: [] } as any,
            "debug"
        );

        expect(result).not.toBeNull();
    });
});

describe("toolDefinitionContentBuilder", () => {
    it("returns content at debug log level", () => {
        const builder = getHookContentBuilder("tool.definition")!;
        const result = builder(
            { toolID: "read_file" } as any,
            { description: "Read a file", parameters: {} } as any,
            "debug"
        );

        expect(result).not.toBeNull();
        expect(result!.hook).toBe("tool.definition");
        expect(result!.sessionID).toBe("");
        expect(result.input.toolID).toBe("read_file");
        expect(result.output.description).toBe("Read a file");
    });

    it("returns null at info log level (hook level is debug)", () => {
        const builder = getHookContentBuilder("tool.definition")!;
        const result = builder({} as any, {} as any, "info");

        expect(result).toBeNull();
    });
});

describe("eventContentBuilder", () => {
    it("delegates to event content builder for session.error", () => {
        const builder = getHookContentBuilder("event")!;
        const result = builder(
            { event: { type: "session.error", properties: { sessionID: "sess-1" } } } as any,
            {} as any,
            "error"
        );

        expect(result).not.toBeNull();
        expect(result!.hook).toBe("event");
        expect(result!.title).toBe("session.error");
    });

    it("returns null for event types with no handler (session.idle)", () => {
        const builder = getHookContentBuilder("event")!;
        const result = builder(
            { event: { type: "session.idle", properties: {} } } as any,
            {} as any,
            "debug"
        );

        expect(result).toBeNull();
    });

    it("returns null when log level is insufficient", () => {
        const builder = getHookContentBuilder("event")!;
        const result = builder(
            { event: { type: "session.error", properties: { sessionID: "sess-1" } } } as any,
            {} as any,
            "error"
        );

        expect(result).not.toBeNull();

        const result2 = builder(
            { event: { type: "session.created", properties: { info: { id: "s1", projectID: "p1", directory: "/", title: "t", version: "1", time: { created: 1, updated: 1 } } } } } as any,
            {} as any,
            "error"
        );

        expect(result2).toBeNull();
    });
});

describe("commandExecuteBeforeContentBuilder", () => {
    it("returns content at info log level", () => {
        const builder = getHookContentBuilder("command.execute.before")!;
        const result = builder(
            { command: "help", sessionID: "session-1", arguments: "" } as any,
            { parts: [] } as any,
            "info"
        );

        expect(result).not.toBeNull();
        expect(result!.hook).toBe("command.execute.before");
        expect(result!.sessionID).toBe("session-1");
        expect(result.input.command).toBe("help");
        expect(result.input.arguments).toBe("");
    });
});
