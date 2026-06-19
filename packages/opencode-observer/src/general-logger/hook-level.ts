import type { EventType, HookNames, PureHookNames } from "../types";
import type { LogLevel } from "./types";

const HOOK_LOG_LEVELS: Record<PureHookNames, LogLevel> = {
    config: "info",
    "chat.message": "info",
    "chat.params": "debug",
    "permission.ask": "info",
    "command.execute.before": "info",
    "tool.execute.before": "info",
    "tool.execute.after": "info",
    "shell.env": "debug",
    "experimental.chat.system.transform": "info",
    "experimental.session.compacting": "info",
    "tool.definition": "debug",
    // Hooks not directly processed
    "chat.headers": "debug",    // Serves only as the write point for request entries
    "experimental.chat.messages.transform": "debug",    // Used only to collect message content for request entries
    "experimental.text.complete": "debug"
}

const EVENT_LOG_LEVELS: Record<EventType, LogLevel> = {
    // session
    "session.compacted": "info",
    "session.created": "info",
    "session.deleted": "warn",
    "session.diff": "debug",
    "session.error": "error",
    "session.status": "info",
    "session.updated": "info",
    // message
    "message.updated": "debug", // Response entries are logged unconditionally; this level only affects other content
    "message.removed": "warn",
    "message.part.updated": "debug",
    "message.part.removed": "debug",
    // server
    "server.connected": "info",
    "server.instance.disposed": "info",
    // lsp
    "lsp.client.diagnostics": "debug",
    "lsp.updated": "debug",
    // tui
    "tui.prompt.append": "debug",
    "tui.command.execute": "info",
    "tui.toast.show": "debug",
    // permission
    "permission.updated": "info",
    "permission.replied": "info",
    // installation
    "installation.updated": "info",
    "installation.update-available": "info",
    // file
    "file.edited": "debug",
    "file.watcher.updated": "debug",
    // todo
    "todo.updated": "info",
    // command
    "command.executed": "info",
    // pty
    "pty.created": "info",
    "pty.updated": "info",
    "pty.exited": "info",
    "pty.deleted": "info",
    // vcs
    "vcs.branch.updated": "info",
    // Events not directly processed
    "session.idle": "debug",    // old fashioned idle event, use "session.status" instead
}

export function getEventLogLevel(eventType: EventType): LogLevel {
    return EVENT_LOG_LEVELS[eventType];
}

export function getHookLogLevel(hookName: "event", eventType: EventType): LogLevel;
export function getHookLogLevel(hookName: PureHookNames): LogLevel;
export function getHookLogLevel(hookName: HookNames, eventType?: EventType): LogLevel {
    if (hookName === "event") {
        return getEventLogLevel(eventType!);
    }
    return HOOK_LOG_LEVELS[hookName];
}
