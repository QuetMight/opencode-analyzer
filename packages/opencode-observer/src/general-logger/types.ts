import type { HandlerInput, HandlerOutput, HookNames } from "../types";

export type LogLevel = "debug" | "info" | "warn" | "error";

export const LogLevelValue: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

export type HookContentBuilderOutput = void;

export type HookContentBuilder<K extends HookNames> = (input: HandlerInput<K>, output: HandlerOutput<K>) => Promise<HookContentBuilderOutput>;