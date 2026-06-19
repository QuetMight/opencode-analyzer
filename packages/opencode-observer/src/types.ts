import type { Hooks } from "@opencode-ai/plugin";
import type { Event } from "@opencode-ai/sdk";

export type HooksHandlers = {
    [K in keyof Hooks as Hooks[K] extends ((...args: any[]) => any) | undefined ? K : never]: NonNullable<Hooks[K]>;
}

type ExtractHandlerInput<T> = T extends (input: infer I, output: any) => Promise<void> ? I : never;
type ExtractHandlerOutput<T> = T extends (input: any, output: infer O) => Promise<void> ? O : never;

export type HookNames = keyof HooksHandlers;
export type PureHookNames = Exclude<HookNames, "event">;

export type HookInput<K extends HookNames> = ExtractHandlerInput<
  HooksHandlers[K]
>;
export type HookOutput<K extends HookNames> = ExtractHandlerOutput<
  HooksHandlers[K]
>;

export type EventType = Event["type"];

export type EventTypeMap = {
    [K in EventType]: Extract<Event, { type: K }>;
}
