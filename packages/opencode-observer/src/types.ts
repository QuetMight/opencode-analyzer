import type { Hooks } from "@opencode-ai/plugin";

export type HooksHandlers = {
    [K in keyof Hooks as Hooks[K] extends ((...args: any[]) => any) | undefined ? K : never]: NonNullable<Hooks[K]>;
}

type ExtractHandlerInput<T> = T extends (input: infer I, output: infer _O) => any ? I : never;
type ExtractHandlerOutput<T> = T extends (input: infer _I, output: infer O) => any ? O : never;

export type HandlerInput<K extends keyof HooksHandlers> = ExtractHandlerInput<
  HooksHandlers[K]
>;
export type HandlerOutput<K extends keyof HooksHandlers> = ExtractHandlerOutput<
  HooksHandlers[K]
>;

/* event */
export type EventHandlerInput = ExtractHandlerInput<HooksHandlers["event"]>;

/* config */
export type ConfigHandlerInput = ExtractHandlerInput<HooksHandlers["config"]>;

/* chat.message */
export type ChatMessageHandlerInput = ExtractHandlerInput<
  HooksHandlers["chat.message"]
>;
export type ChatMessageHandlerOutput = ExtractHandlerOutput<
  HooksHandlers["chat.message"]
>;

/* chat.params */
export type ChatParamsHandlerInput = ExtractHandlerInput<
  HooksHandlers["chat.params"]
>;
export type ChatParamsHandlerOutput = ExtractHandlerOutput<
  HooksHandlers["chat.params"]
>;

/* chat.headers */
export type ChatHeadersHandlerInput = ExtractHandlerInput<
  HooksHandlers["chat.headers"]
>;
export type ChatHeadersHandlerOutput = ExtractHandlerOutput<
  HooksHandlers["chat.headers"]
>;

/* permission.ask */
export type PermissionAskHandlerInput = ExtractHandlerInput<
  HooksHandlers["permission.ask"]
>;
export type PermissionAskHandlerOutput = ExtractHandlerOutput<
  HooksHandlers["permission.ask"]
>;

/* command.execute.before */
export type CommandExecuteBeforeHandlerInput = ExtractHandlerInput<
  HooksHandlers["command.execute.before"]
>;
export type CommandExecuteBeforeHandlerOutput = ExtractHandlerOutput<
  HooksHandlers["command.execute.before"]
>;

/* tool.execute.before */
export type ToolExecuteBeforeHandlerInput = ExtractHandlerInput<
  HooksHandlers["tool.execute.before"]
>;
export type ToolExecuteBeforeHandlerOutput = ExtractHandlerOutput<
  HooksHandlers["tool.execute.before"]
>;

/* tool.execute.after */
export type ToolExecuteAfterHandlerInput = ExtractHandlerInput<
  HooksHandlers["tool.execute.after"]
>;
export type ToolExecuteAfterHandlerOutput = ExtractHandlerOutput<
  HooksHandlers["tool.execute.after"]
>;

/* shell.env */
export type ShellEnvHandlerInput = ExtractHandlerInput<
  HooksHandlers["shell.env"]
>;
export type ShellEnvHandlerOutput = ExtractHandlerOutput<
  HooksHandlers["shell.env"]
>;

/* experimental.chat.messages.transform */
export type ChatMessagesTransformHandlerInput = ExtractHandlerInput<
  HooksHandlers["experimental.chat.messages.transform"]
>;
export type ChatMessagesTransformHandlerOutput = ExtractHandlerOutput<
  HooksHandlers["experimental.chat.messages.transform"]
>;

/* experimental.chat.system.transform */
export type ChatSystemTransformHandlerInput = ExtractHandlerInput<
  HooksHandlers["experimental.chat.system.transform"]
>;
export type ChatSystemTransformHandlerOutput = ExtractHandlerOutput<
  HooksHandlers["experimental.chat.system.transform"]
>;

/* experimental.session.compacting */
export type SessionCompactingHandlerInput = ExtractHandlerInput<
  HooksHandlers["experimental.session.compacting"]
>;
export type SessionCompactingHandlerOutput = ExtractHandlerOutput<
  HooksHandlers["experimental.session.compacting"]
>;

/* experimental.text.complete */
export type TextCompleteHandlerInput = ExtractHandlerInput<
  HooksHandlers["experimental.text.complete"]
>;
export type TextCompleteHandlerOutput = ExtractHandlerOutput<
  HooksHandlers["experimental.text.complete"]
>;

/* tool.definition */
export type ToolDefinitionHandlerInput = ExtractHandlerInput<
  HooksHandlers["tool.definition"]
>;
export type ToolDefinitionHandlerOutput = ExtractHandlerOutput<
  HooksHandlers["tool.definition"]
>;
