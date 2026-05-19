import type { EventType, EventTypeMap, HandlerInput, HandlerOutput, HookNames } from "../types";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LogLevelValue: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

export function isLogLevelSatisfied(currentLevel: LogLevel, targetLevel: LogLevel): boolean {
    return LogLevelValue[currentLevel] <= LogLevelValue[targetLevel];
}

export type HookContentBuilderOutput = Record<string, any>;

export type HookContentBuilder<K extends HookNames> = (input: HandlerInput<K>, output: HandlerOutput<K>) => Promise<HookContentBuilderOutput>;

export type EventContentBuilder<K extends EventType> = (event: EventTypeMap[K], logLevel: LogLevel) => Promise<HookContentBuilderOutput>;
