import type { Session } from "@opencode-ai/sdk";

import type { EventType } from "../types";
import { isLogLevelSatisfied, type EventContentBuilder, type LogLevel } from "./types";

export const EventContentBuilders: { [K in EventType]: EventContentBuilder<K> | null } = {
    // session
    "session.compacted": async (event, logLevel) => { const properties = event.properties; return {}; },
    "session.created": async (event, logLevel) => { const properties = event.properties; return {}; },
    "session.deleted": async (event, logLevel) => { const properties = event.properties; return {}; },
    "session.diff": async (event, logLevel) => { const properties = event.properties; return {}; },
    "session.error": async (event, logLevel) => { const properties = event.properties; return {}; },
    "session.status": async (event, logLevel) => { const properties = event.properties; return {}; },
    "session.updated": async (event, logLevel) => { const properties = event.properties; return {}; },
    "session.idle": null,
    // message
    "message.updated": async (event, logLevel) => { const properties = event.properties; return {}; },
    "message.removed": async (event, logLevel) => { const properties = event.properties; return {}; },
    "message.part.updated": async (event, logLevel) => { const properties = event.properties; return {}; },
    "message.part.removed": async (event, logLevel) => { const properties = event.properties; return {}; },
    // server
    "server.connected": async (event, logLevel) => { const properties = event.properties; return {}; },
    "server.instance.disposed": async (event, logLevel) => { const properties = event.properties; return {}; },
    // lsp
    "lsp.client.diagnostics": async (event, logLevel) => { const properties = event.properties; return {}; },
    "lsp.updated": async (event, logLevel) => { const properties = event.properties; return {}; },
    // tui
    "tui.prompt.append": async (event, logLevel) => { const properties = event.properties; return {}; },
    "tui.command.execute": async (event, logLevel) => { const properties = event.properties; return {}; },
    "tui.toast.show": async (event, logLevel) => { const properties = event.properties; return {}; },
    // permission
    "permission.updated": async (event, logLevel) => { const properties = event.properties; return {}; },
    "permission.replied": async (event, logLevel) => { const properties = event.properties; return {}; },
    // installation
    "installation.updated": async (event, logLevel) => { const properties = event.properties; return {}; },
    "installation.update-available": async (event, logLevel) => { const properties = event.properties; return {}; },
    // file
    "file.edited": async (event, logLevel) => { const properties = event.properties; return {}; },
    "file.watcher.updated": async (event, logLevel) => { const properties = event.properties; return {}; },
    // todo
    "todo.updated": async (event, logLevel) => { const properties = event.properties; return {}; },
    // command
    "command.executed": async (event, logLevel) => { const properties = event.properties; return {}; },
    // pty
    "pty.created": async (event, logLevel) => { const properties = event.properties; return {}; },
    "pty.updated": async (event, logLevel) => { const properties = event.properties; return {}; },
    "pty.exited": async (event, logLevel) => { const properties = event.properties; return {}; },
    "pty.deleted": async (event, logLevel) => { const properties = event.properties; return {}; },
    // vcs
    "vcs.branch.updated": async (event, logLevel) => { const properties = event.properties; return {}; },
};

function handleSessionBrief(session: Session, logLevel: LogLevel) {
    if (isLogLevelSatisfied(logLevel, "debug")) {
        return session;
    }
    return {
        id: session.id,
        ...(session.parentID && { parentID: session.parentID }),
    }
}

function handleSessionDetail(session: Session, logLevel: LogLevel) {
    if (isLogLevelSatisfied(logLevel, "debug")) {
        return session;
    }
    return {
        id: session.id,
        projectID: session.projectID,
        
        ...(session.parentID && { parentID: session.parentID }),

    }
}
