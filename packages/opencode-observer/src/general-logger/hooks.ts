import type { PluginInput } from "@opencode-ai/plugin";

import type { GeneralLoggerConfig } from "../config/schema";
import type { HandlerInput, HandlerOutput, HookNames, HooksHandlers } from "../types";
import { GENERAL_LOGGER_HOOK_NAMES, getHookContentBuilder } from "./hooks-builders";

function handleEvents(): HooksHandlers["event"] | null {
    const contentBuilder = getHookContentBuilder("event");
    if (!contentBuilder) return null;
    return async (input: HandlerInput<"event">): Promise<void> => {
    }
}

function handleHooks(hookName: HookNames): HooksHandlers[HookNames] | null {
    const contentBuilder = getHookContentBuilder(hookName);
    if (!contentBuilder) return null;
    return async (input: HandlerInput<HookNames>, output: HandlerOutput<HookNames>): Promise<void> => {
    };
}

export function createGeneralLoggerHooks(_ctx: PluginInput, config: GeneralLoggerConfig): HooksHandlers | null {
    if (!config.enabled) return null;

    const handlers: Record<string, unknown> = {};
    for (const hookName of GENERAL_LOGGER_HOOK_NAMES) {
        let handler: HooksHandlers[HookNames] | null = null;
        if (hookName === "event") {
            handler = handleEvents();
            if (!handler) continue;
            handlers[hookName] = handler;
        } else {
            handler = handleHooks(hookName);
            if (!handler) continue;
            handlers[hookName] = handler;
        }
    }

    return handlers;
}