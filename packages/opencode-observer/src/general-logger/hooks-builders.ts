import type { HookNames } from "../types";
import type { HookContentBuilder } from "./types";

export function getHookContentBuilder<K extends HookNames>(hookName: K): HookContentBuilder<K> | null {
    return HookContentBuilderMap[hookName];
}

const eventContentBuilder: HookContentBuilder<"event"> = async (input) => { };

const configContentBuilder: HookContentBuilder<"config"> = async (input) => { };

const chatMessageContentBuilder: HookContentBuilder<"chat.message"> = async (input, output) => { };

const chatParamsContentBuilder: HookContentBuilder<"chat.params"> = async (input, output) => { };

const chatHeadersContentBuilder: HookContentBuilder<"chat.headers"> = async (input, output) => { };

const permissionAskContentBuilder: HookContentBuilder<"permission.ask"> = async (input, output) => { };

const commandExecuteBeforeContentBuilder: HookContentBuilder<"command.execute.before"> = async (input, output) => { };

const toolExecuteBeforeContentBuilder: HookContentBuilder<"tool.execute.before"> = async (input, output) => { };

const toolExecuteAfterContentBuilder: HookContentBuilder<"tool.execute.after"> = async (input, output) => { };

const shellEnvContentBuilder: HookContentBuilder<"shell.env"> = async (input, output) => { };

const chatMessagesTransformContentBuilder: HookContentBuilder<"experimental.chat.messages.transform"> = async (input, output) => { };

const chatSystemTransformContentBuilder: HookContentBuilder<"experimental.chat.system.transform"> = async (input, output) => { };

const sessionCompactingContentBuilder: HookContentBuilder<"experimental.session.compacting"> = async (input, output) => { };

const textCompleteContentBuilder: HookContentBuilder<"experimental.text.complete"> = async (input, output) => { };

const toolDefinitionContentBuilder: HookContentBuilder<"tool.definition"> = async (input, output) => { };

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
    "experimental.text.complete": textCompleteContentBuilder,
    "tool.definition": toolDefinitionContentBuilder
};

export const GENERAL_LOGGER_HOOK_NAMES = Object.keys(HookContentBuilderMap) as readonly HookNames[];
