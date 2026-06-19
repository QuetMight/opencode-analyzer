import type { EventType, EventTypeMap, HookInput, HookOutput, HookNames } from "../types";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_VALUE: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

export function isLogLevelSatisfied(currentLevel: LogLevel, targetLevel: LogLevel): boolean {
    return LOG_LEVEL_VALUE[currentLevel] <= LOG_LEVEL_VALUE[targetLevel];
}

export interface HookContentBuilderOutput {
    hook: string;
    sessionID: string;
    [key: string]: any;
}

export type HookContentBuilder<K extends HookNames> = (
    input: HookInput<K>,
    output: HookOutput<K>,
    logLevel: LogLevel
) => HookContentBuilderOutput | null;

export type EventContentBuilder<K extends EventType> = (
    event: EventTypeMap[K],
    logLevel: LogLevel
) => HookContentBuilderOutput | null;
