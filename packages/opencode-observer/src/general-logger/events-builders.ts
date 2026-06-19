import type { Session } from "@opencode-ai/sdk";

import type { EventType, EventTypeMap } from "../types";
import type { EventContentBuilder, HookContentBuilderOutput, LogLevel } from "./types";
import { isLogLevelSatisfied } from "./types";
import { ResponseBuilder } from "../shared/response-builder";
import { getEventLogLevel } from "./hook-level";

type EventContent = {
    type: EventType;
    properties: Record<string, any>;
};

function buildEventContent(
    title: string,
    sessionID: string,
    eventContent: EventContent
): HookContentBuilderOutput {
    return {
        hook: "event",
        title,
        sessionID,
        event: eventContent
    }
}

function buildNoSessionEventContent(event: EventTypeMap[EventType], logLevel: LogLevel): HookContentBuilderOutput | null {
    const eventType = event.type;
    if (!isLogLevelSatisfied(logLevel, getEventLogLevel(eventType))) return null;

    const title = eventType;
    const eventContent: EventContent = {
        type: eventType,
        properties: event.properties
    }

    return buildEventContent(title, "", eventContent);
}

function stripSessionIDAndBuild(
    event: { type: EventType; properties: { sessionID: string;[key: string]: any } },
    logLevel: LogLevel
): HookContentBuilderOutput | null {
    if (!isLogLevelSatisfied(logLevel, getEventLogLevel(event.type))) return null;
    const { sessionID, ...rest } = event.properties;
    return buildEventContent(event.type, sessionID, {
        type: event.type,
        properties: rest
    });
}

function handleSessionBrief(session: Session, logLevel: LogLevel): Record<string, any> {
    if (isLogLevelSatisfied(logLevel, "debug")) {
        const { id, ...rest } = session;
        return {
            sessionID: id,
            ...rest
        };
    }
    return {
        sessionID: session.id,
        ...(session.parentID && { parentID: session.parentID }),
    }
}

function handleSessionDetail(session: Session, logLevel: LogLevel): Record<string, any> {
    if (isLogLevelSatisfied(logLevel, "debug")) {
        const { id, ...rest } = session;
        return {
            sessionID: id,
            ...rest
        };
    }
    return {
        sessionID: session.id,
        projectID: session.projectID,
        directory: session.directory,
        ...(session.parentID && { parentID: session.parentID }),
        title: session.title,
        version: session.version,
        time: session.time
    }
}

const handleSessionCompacted: EventContentBuilder<"session.compacted"> = (event, logLevel) => stripSessionIDAndBuild(event, logLevel);

const handleSessionCreated: EventContentBuilder<"session.created"> = (event, logLevel) => {
    const eventType = event.type;
    if (!isLogLevelSatisfied(logLevel, getEventLogLevel(eventType))) return null;

    const title = eventType;
    const { sessionID, ...rest } = handleSessionDetail(event.properties.info, logLevel);
    const eventContent: EventContent = {
        type: eventType,
        properties: rest
    }

    return buildEventContent(title, sessionID, eventContent);
}

const handleSessionDeleted: EventContentBuilder<"session.deleted"> = (event, logLevel) => {
    const eventType = event.type;
    if (!isLogLevelSatisfied(logLevel, getEventLogLevel(eventType))) return null;

    const title = eventType;
    const { sessionID, ...rest } = handleSessionBrief(event.properties.info, logLevel);
    const eventContent: EventContent = {
        type: eventType,
        properties: rest
    }

    return buildEventContent(title, sessionID, eventContent);
}

const handleSessionDiff: EventContentBuilder<"session.diff"> = (event, logLevel) => stripSessionIDAndBuild(event, logLevel);

// System-level errors may not contain a sessionID,
// e.g. plugin load/install failure, agent initialization failure, Skill/command/agent md file parse failure, etc.
const handleSessionError: EventContentBuilder<"session.error"> = (event, logLevel) => {
    const eventType = event.type;
    if (!isLogLevelSatisfied(logLevel, getEventLogLevel(eventType))) return null;

    const title = eventType;
    const { sessionID, error } = event.properties;
    const eventContent: EventContent = {
        type: eventType,
        properties: {
            error: error ?? {
                name: "UnrecognizedError",
                data: {}
            }
        }
    }

    return buildEventContent(title, sessionID ?? "", eventContent);
}

const handleSessionStatus: EventContentBuilder<"session.status"> = (event, logLevel) => stripSessionIDAndBuild(event, logLevel);

const handleSessionUpdated: EventContentBuilder<"session.updated"> = (event, logLevel) => {
    const eventType = event.type;
    if (!isLogLevelSatisfied(logLevel, getEventLogLevel(eventType))) return null;

    const title = eventType;
    const { sessionID, ...rest } = handleSessionBrief(event.properties.info, logLevel);
    const eventContent: EventContent = {
        type: eventType,
        properties: rest
    }

    return buildEventContent(title, sessionID, eventContent);
}

// Used to compose the final response log entry
const handleMessageUpdated: EventContentBuilder<"message.updated"> = (event, logLevel) => {
    const message = event.properties.info;

    // Always log completed responses regardless of log level
    if (message.role === "assistant" && message.time.completed != null) {
        return ResponseBuilder.getInstance().composeResponse(message);
    }

    const eventType = event.type;
    if (!isLogLevelSatisfied(logLevel, getEventLogLevel(eventType))) return null;

    const title = eventType;
    const sessionID = message.sessionID;
    const eventContent: EventContent = {
        type: eventType,
        properties: {
            messageID: message.id,
            role: message.role,
            time: message.time
        }
    }

    return buildEventContent(title, sessionID, eventContent);
}

const handleMessageRemoved: EventContentBuilder<"message.removed"> = (event, logLevel) => stripSessionIDAndBuild(event, logLevel);

// Used to collect response part content
const handleMessagePartUpdated: EventContentBuilder<"message.part.updated"> = (event, logLevel) => {
    const part = event.properties.part;

    // Always collect parts for responses regardless of log level
    ResponseBuilder.getInstance().collectPart(part.messageID, part);

    const eventType = event.type;
    if (!isLogLevelSatisfied(logLevel, getEventLogLevel(eventType))) return null;

    const title = eventType;
    const sessionID = part.sessionID;
    const eventContent: EventContent = {
        type: eventType,
        properties: event.properties
    }

    return buildEventContent(title, sessionID, eventContent);
}

const handleMessagePartRemoved: EventContentBuilder<"message.part.removed"> = (event, logLevel) => stripSessionIDAndBuild(event, logLevel);

const handleServerConnected: EventContentBuilder<"server.connected"> = (event, logLevel) => {
    return buildNoSessionEventContent(event, logLevel);
}

const handleServerInstanceDisposed: EventContentBuilder<"server.instance.disposed"> = (event, logLevel) => {
    return buildNoSessionEventContent(event, logLevel);
}

const handleLspClientDiagnostics: EventContentBuilder<"lsp.client.diagnostics"> = (event, logLevel) => {
    return buildNoSessionEventContent(event, logLevel);
}

const handleLspUpdated: EventContentBuilder<"lsp.updated"> = (event, logLevel) => {
    return buildNoSessionEventContent(event, logLevel);
}

const handleTuiPromptAppend: EventContentBuilder<"tui.prompt.append"> = (event, logLevel) => {
    return buildNoSessionEventContent(event, logLevel);
}

const handleTuiCommandExecute: EventContentBuilder<"tui.command.execute"> = (event, logLevel) => {
    return buildNoSessionEventContent(event, logLevel);
}

const handleTuiToastShow: EventContentBuilder<"tui.toast.show"> = (event, logLevel) => {
    return buildNoSessionEventContent(event, logLevel);
}

const handlePermissionUpdated: EventContentBuilder<"permission.updated"> = (event, logLevel) => stripSessionIDAndBuild(event, logLevel);

const handlePermissionReplied: EventContentBuilder<"permission.replied"> = (event, logLevel) => stripSessionIDAndBuild(event, logLevel);

const handleInstallationUpdated: EventContentBuilder<"installation.updated"> = (event, logLevel) => {
    return buildNoSessionEventContent(event, logLevel);
}

const handleInstallationUpdateAvailable: EventContentBuilder<"installation.update-available"> = (event, logLevel) => {
    return buildNoSessionEventContent(event, logLevel);
}

const handleFileWatcherUpdated: EventContentBuilder<"file.watcher.updated"> = (event, logLevel) => {
    return buildNoSessionEventContent(event, logLevel);
}

const handleTodoUpdated: EventContentBuilder<"todo.updated"> = (event, logLevel) => stripSessionIDAndBuild(event, logLevel);

const handleCommandExecuted: EventContentBuilder<"command.executed"> = (event, logLevel) => stripSessionIDAndBuild(event, logLevel);

const handlePtyCreated: EventContentBuilder<"pty.created"> = (event, logLevel) => {
    return buildNoSessionEventContent(event, logLevel);
}

const handlePtyUpdated: EventContentBuilder<"pty.updated"> = (event, logLevel) => {
    return buildNoSessionEventContent(event, logLevel);
}

const handlePtyExited: EventContentBuilder<"pty.exited"> = (event, logLevel) => {
    return buildNoSessionEventContent(event, logLevel);
}

const handlePtyDeleted: EventContentBuilder<"pty.deleted"> = (event, logLevel) => {
    return buildNoSessionEventContent(event, logLevel);
}

const handleVcsBranchUpdated: EventContentBuilder<"vcs.branch.updated"> = (event, logLevel) => {
    return buildNoSessionEventContent(event, logLevel);
}

export const EventContentBuilders: { [K in EventType]: EventContentBuilder<K> | null } = {
    // session
    "session.compacted": handleSessionCompacted,
    "session.created": handleSessionCreated,
    "session.deleted": handleSessionDeleted,
    "session.diff": handleSessionDiff,
    "session.error": handleSessionError,
    "session.status": handleSessionStatus,
    "session.updated": handleSessionUpdated,
    "session.idle": null,
    // message
    "message.updated": handleMessageUpdated,
    "message.removed": handleMessageRemoved,
    "message.part.updated": handleMessagePartUpdated,
    "message.part.removed": handleMessagePartRemoved,
    // server
    "server.connected": handleServerConnected,
    "server.instance.disposed": handleServerInstanceDisposed,
    // lsp
    "lsp.client.diagnostics": handleLspClientDiagnostics,
    "lsp.updated": handleLspUpdated,
    // tui
    "tui.prompt.append": handleTuiPromptAppend,
    "tui.command.execute": handleTuiCommandExecute,
    "tui.toast.show": handleTuiToastShow,
    // permission
    "permission.updated": handlePermissionUpdated,
    "permission.replied": handlePermissionReplied,
    // installation
    "installation.updated": handleInstallationUpdated,
    "installation.update-available": handleInstallationUpdateAvailable,
    // file
    "file.edited": null,
    "file.watcher.updated": handleFileWatcherUpdated,
    // todo
    "todo.updated": handleTodoUpdated,
    // command
    "command.executed": handleCommandExecuted,
    // pty
    "pty.created": handlePtyCreated,
    "pty.updated": handlePtyUpdated,
    "pty.exited": handlePtyExited,
    "pty.deleted": handlePtyDeleted,
    // vcs
    "vcs.branch.updated": handleVcsBranchUpdated,
};

export function getEventContentBuilder<K extends EventType>(eventType: K): EventContentBuilder<K> | null {
    return EventContentBuilders[eventType];
}
