import type { HookNames } from "../types";
import { isLogLevelSatisfied, type HookContentBuilder } from "./types";
import { getEventContentBuilder } from "./events-builders";
import { getHookLogLevel } from "./hook-level";
import { RequestBuilder, type SystemPromptType } from "../shared/request-builder";

const eventContentBuilder: HookContentBuilder<"event"> = (input, _output, logLevel) => {
    const event = input.event;
    const contentBuilder = getEventContentBuilder(event.type);
    if (contentBuilder === null) {
        return null;
    }
    return contentBuilder(event, logLevel)
};

const configContentBuilder: HookContentBuilder<"config"> = (input, _output, logLevel) => {
    if (!isLogLevelSatisfied(logLevel, getHookLogLevel("config"))) return null;
    return {
        hook: "config",
        sessionID: "",
        config: {
            provider: input.provider ? Object.keys(input.provider) : [],
            permission: input.permission ?? {},
            plugin: input.plugin ?? [],
            agent: input.agent ? Object.keys(input.agent) : [],
            command: input.command ? Object.keys(input.command) : [],
            model: input.model ?? ""
        }
    }
};

const chatMessageContentBuilder: HookContentBuilder<"chat.message"> = (input, output, logLevel) => {
    if (!isLogLevelSatisfied(logLevel, getHookLogLevel("chat.message"))) return null;

    const message = output.message;
    return {
        hook: "chat.message",
        sessionID: input.sessionID,
        messageInfo: {
            id: message.id,
            role: message.role,
            agent: message.agent,
            model: `${message.model.providerID}/${message.model.modelID}`,
            time: message.time.created,
            system: message.system ?? "",
            parts: output.parts
        }
    }
};

const chatParamsContentBuilder: HookContentBuilder<"chat.params"> = (input, output, logLevel) => {
    if (!isLogLevelSatisfied(logLevel, getHookLogLevel("chat.params"))) return null;
    return {
        hook: "chat.params",
        sessionID: input.sessionID,
        input: {
            agent: input.agent,
            model: `${input.model.providerID}/${input.model.id}`,
            messageID: input.message.id
        },
        output
    };
};

// Does not process this hook's actual content, serves only as the write point for request
// Always record request entries regardless of log level
const chatHeadersContentBuilder: HookContentBuilder<"chat.headers"> = (input, _output, _logLevel) => {
    const record = RequestBuilder.getInstance().composeRequest(input.sessionID);
    return record;
};

const permissionAskContentBuilder: HookContentBuilder<"permission.ask"> = (input, output, logLevel) => {
    if (!isLogLevelSatisfied(logLevel, getHookLogLevel("permission.ask"))) return null;
    return {
        hook: "permission.ask",
        sessionID: input.sessionID,
        input: {
            id: input.id,
            type: input.type,
            pattern: input.pattern,
            messageID: input.messageID,
            callID: input.callID,
            title: input.title,
            metadata: input.metadata,
            time: input.time,
        },
        output: {
            status: output.status,
        }
    };
};

const commandExecuteBeforeContentBuilder: HookContentBuilder<"command.execute.before"> = (input, output, logLevel) => {
    if (!isLogLevelSatisfied(logLevel, getHookLogLevel("command.execute.before"))) return null;
    return {
        hook: "command.execute.before",
        sessionID: input.sessionID,
        input: {
            command: input.command,
            arguments: input.arguments,
        },
        output: {
            parts: output.parts,
        }
    };
};

const toolExecuteBeforeContentBuilder: HookContentBuilder<"tool.execute.before"> = (input, output, logLevel) => {
    if (!isLogLevelSatisfied(logLevel, getHookLogLevel("tool.execute.before"))) return null;
    return {
        hook: "tool.execute.before",
        title: "toolCall",
        sessionID: input.sessionID,
        input: {
            tool: input.tool,
            callID: input.callID,
        },
        output: {
            args: output.args,
        }
    };
};

const toolExecuteAfterContentBuilder: HookContentBuilder<"tool.execute.after"> = (input, output, logLevel) => {
    if (!isLogLevelSatisfied(logLevel, getHookLogLevel("tool.execute.after"))) return null;
    return {
        hook: "tool.execute.after",
        title: "toolResult",
        sessionID: input.sessionID,
        input: {
            tool: input.tool,
            callID: input.callID,
            args: input.args,
        },
        output: {
            title: output.title,
            output: output.output,
            metadata: output.metadata,
        }
    };
};

const shellEnvContentBuilder: HookContentBuilder<"shell.env"> = (input, output, logLevel) => {
    if (!isLogLevelSatisfied(logLevel, getHookLogLevel("shell.env"))) return null;
    return {
        hook: "shell.env",
        sessionID: input.sessionID ?? "",
        input: {
            cwd: input.cwd,
        },
        output: {
            env: output.env,
        }
    };
};

// Does not process this hook's actual content, used only to collect messages for request
// log level check skipped
const chatMessagesTransformContentBuilder: HookContentBuilder<"experimental.chat.messages.transform"> = (_input, output, _logLevel) => {
    const messages = output.messages;
    const firstMsg = messages[0];
    if (!firstMsg) return null;

    const sessionID = firstMsg.info.sessionID;
    RequestBuilder.getInstance().collectMessages(sessionID, output.messages);
    return null;
};

// collect system prompt for "Request" log
const chatSystemTransformContentBuilder: HookContentBuilder<"experimental.chat.system.transform"> = (input, output, logLevel) => {
    const system = output.system;
    let promptType: SystemPromptType | null = null;
    if (system.length > 0 && input.sessionID) {
        promptType = RequestBuilder.getInstance().collectSystemPrompt(input.sessionID, system);
        if (promptType === "request") return null;
    }

    if (!isLogLevelSatisfied(logLevel, getHookLogLevel("experimental.chat.system.transform"))) return null;


    return {
        hook: "experimental.chat.system.transform",
        ...(promptType === "title" ? { title: "TitleGenerator" } : {}),
        sessionID: input.sessionID ?? "",
        input: {
            model: input.model ? `${input.model.providerID}/${input.model.id}` : ""
        },
        output: {
            system: output.system
        }
    };
};

const sessionCompactingContentBuilder: HookContentBuilder<"experimental.session.compacting"> = (input, output, logLevel) => {
    if (!isLogLevelSatisfied(logLevel, getHookLogLevel("experimental.session.compacting"))) return null;
    return {
        hook: "experimental.session.compacting",
        sessionID: input.sessionID,
        output: {
            context: output.context,
            prompt: output.prompt,
        }
    };
};

const toolDefinitionContentBuilder: HookContentBuilder<"tool.definition"> = (input, output, logLevel) => {
    if (!isLogLevelSatisfied(logLevel, getHookLogLevel("tool.definition"))) return null;
    return {
        hook: "tool.definition",
        sessionID: "",
        input: {
            toolID: input.toolID
        },
        output: {
            description: output.description,
        }
    };
};

const HookContentBuilderMap: { [K in HookNames]: HookContentBuilder<K> | null } = {
    event: eventContentBuilder,
    config: configContentBuilder,
    "chat.message": chatMessageContentBuilder,
    "chat.params": chatParamsContentBuilder,
    "chat.headers": chatHeadersContentBuilder,
    "permission.ask": permissionAskContentBuilder,
    "command.execute.before": commandExecuteBeforeContentBuilder,
    "tool.execute.before": toolExecuteBeforeContentBuilder,
    "tool.execute.after": toolExecuteAfterContentBuilder,
    "shell.env": shellEnvContentBuilder,
    "experimental.chat.messages.transform": chatMessagesTransformContentBuilder,
    "experimental.chat.system.transform": chatSystemTransformContentBuilder,
    "experimental.session.compacting": sessionCompactingContentBuilder,
    "experimental.text.complete": null,
    "tool.definition": toolDefinitionContentBuilder
};

export const GENERAL_LOGGER_HOOK_NAMES = Object.keys(HookContentBuilderMap) as readonly HookNames[];

export function getHookContentBuilder<K extends HookNames>(hookName: K): HookContentBuilder<K> | null {
    return HookContentBuilderMap[hookName];
}
