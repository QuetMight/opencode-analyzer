import type { Hooks } from "@opencode-ai/plugin";

export type HooksHandlers = {
    [K in keyof Hooks as Hooks[K] extends ((...args: any[]) => any) | undefined ? K : never]: NonNullable<Hooks[K]>;
}

type ExtractHandlerInput<T> = T extends (input: infer I, output: infer _O) => any ? I : never;
type ExtractHandlerOutput<T> = T extends (input: infer _I, output: infer O) => any ? O : never;

export type HookNames = keyof HooksHandlers;

export type HandlerInput<K extends HookNames> = ExtractHandlerInput<
  HooksHandlers[K]
>;
export type HandlerOutput<K extends HookNames> = ExtractHandlerOutput<
  HooksHandlers[K]
>;
