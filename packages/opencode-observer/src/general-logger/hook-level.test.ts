import { describe, expect, it } from "bun:test";
import { getEventLogLevel, getHookLogLevel } from "./hook-level.js";

describe("getEventLogLevel", () => {
    it("returns correct level for session events", () => {
        expect(getEventLogLevel("session.compacted")).toBe("info");
        expect(getEventLogLevel("session.created")).toBe("info");
        expect(getEventLogLevel("session.deleted")).toBe("warn");
        expect(getEventLogLevel("session.diff")).toBe("debug");
        expect(getEventLogLevel("session.error")).toBe("error");
        expect(getEventLogLevel("session.status")).toBe("info");
        expect(getEventLogLevel("session.updated")).toBe("info");
        expect(getEventLogLevel("session.idle")).toBe("debug");
    });

    it("returns correct level for message events", () => {
        expect(getEventLogLevel("message.updated")).toBe("debug");
        expect(getEventLogLevel("message.removed")).toBe("warn");
        expect(getEventLogLevel("message.part.updated")).toBe("debug");
        expect(getEventLogLevel("message.part.removed")).toBe("debug");
    });

    it("returns correct level for server events", () => {
        expect(getEventLogLevel("server.connected")).toBe("info");
        expect(getEventLogLevel("server.instance.disposed")).toBe("info");
    });

    it("returns correct level for lsp events", () => {
        expect(getEventLogLevel("lsp.client.diagnostics")).toBe("debug");
        expect(getEventLogLevel("lsp.updated")).toBe("debug");
    });

    it("returns correct level for tui events", () => {
        expect(getEventLogLevel("tui.prompt.append")).toBe("debug");
        expect(getEventLogLevel("tui.command.execute")).toBe("info");
        expect(getEventLogLevel("tui.toast.show")).toBe("debug");
    });

    it("returns correct level for permission events", () => {
        expect(getEventLogLevel("permission.updated")).toBe("info");
        expect(getEventLogLevel("permission.replied")).toBe("info");
    });

    it("returns correct level for installation events", () => {
        expect(getEventLogLevel("installation.updated")).toBe("info");
        expect(getEventLogLevel("installation.update-available")).toBe("info");
    });

    it("returns correct level for file events", () => {
        expect(getEventLogLevel("file.edited")).toBe("debug");
        expect(getEventLogLevel("file.watcher.updated")).toBe("debug");
    });

    it("returns correct level for other events", () => {
        expect(getEventLogLevel("todo.updated")).toBe("info");
        expect(getEventLogLevel("command.executed")).toBe("info");
        expect(getEventLogLevel("pty.created")).toBe("info");
        expect(getEventLogLevel("pty.updated")).toBe("info");
        expect(getEventLogLevel("pty.exited")).toBe("info");
        expect(getEventLogLevel("pty.deleted")).toBe("info");
        expect(getEventLogLevel("vcs.branch.updated")).toBe("info");
    });
});

describe("getHookLogLevel", () => {
    it("returns event level via getEventLogLevel when hook is 'event'", () => {
        expect(getHookLogLevel("event", "session.error")).toBe("error");
        expect(getHookLogLevel("event", "session.created")).toBe("info");
        expect(getHookLogLevel("event", "session.diff")).toBe("debug");
    });

    it("returns correct level for pure hook names", () => {
        expect(getHookLogLevel("config")).toBe("info");
        expect(getHookLogLevel("chat.message")).toBe("info");
        expect(getHookLogLevel("chat.params")).toBe("debug");
        expect(getHookLogLevel("permission.ask")).toBe("info");
        expect(getHookLogLevel("command.execute.before")).toBe("info");
        expect(getHookLogLevel("tool.execute.before")).toBe("info");
        expect(getHookLogLevel("tool.execute.after")).toBe("info");
        expect(getHookLogLevel("shell.env")).toBe("debug");
        expect(getHookLogLevel("experimental.chat.system.transform")).toBe("info");
        expect(getHookLogLevel("experimental.session.compacting")).toBe("info");
        expect(getHookLogLevel("tool.definition")).toBe("debug");
        expect(getHookLogLevel("chat.headers")).toBe("debug");
        expect(getHookLogLevel("experimental.chat.messages.transform")).toBe("debug");
        expect(getHookLogLevel("experimental.text.complete")).toBe("debug");
    });
});
