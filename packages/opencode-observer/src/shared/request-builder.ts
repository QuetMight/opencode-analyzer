import type { Message, Part } from "@opencode-ai/sdk";
import { PartConverter, type PartContent, type RequestPartContent } from "./part-converter";
import type { HookContentBuilderOutput } from "../general-logger/types";

export type SystemPromptType = "request" | "title";

export interface MessageDetails {
    info: Message;
    parts: Part[];
}

export interface MessageContent {
    role: Message["role"];
    content: RequestPartContent[];
}

const TITLE_GENERATOR_PROMPT = "You are a title generator. Your output ONLY a thread title. Nothing else.";

// TODO: Memory leak prevention — if composeRequest is skipped due to an exception,
// pendingMessages/pendingSystemPrompt will never be cleared. Add try-finally cleanup
// in hooks.ts consumer side (Plan A), and consider TTL eviction or maxSize cap (Plan B/C)
// after verifying production request-response intervals.

export class RequestBuilder {
    private static instance: RequestBuilder;
    private pendingMessages = new Map<string, MessageContent[]>();    // sessionID -> MessageContent[]
    private pendingSystemPrompt = new Map<string, string>();    // sessionID -> systemPrompt

    private constructor() { }

    static getInstance(): RequestBuilder {
        if (!RequestBuilder.instance) {
            RequestBuilder.instance = new RequestBuilder();
        }
        return RequestBuilder.instance;
    }

    clear(): void {
        this.pendingMessages.clear();
        this.pendingSystemPrompt.clear();
    }

    collectMessages(sessionID: string, messages: MessageDetails[]): void {
        const contents: MessageContent[] = [];

        for (const msg of messages) {
            contents.push({
                role: msg.info.role,
                content: this.collectPartsForMessage(msg)
            });
        }

        this.pendingMessages.set(sessionID, contents);
    }

    /**
     * collect system prompt of current request
     * @param sessionID id of current session
     * @param system system prompt content, either a single string or an array of strings
     * @returns type of system prompt as `SystemPromptType`
     */
    collectSystemPrompt(sessionID: string, system: string | string[]): SystemPromptType | null {
        const content = Array.isArray(system)
            ? system.join("\n")
            : system;

        if (!content) return null;

        if (content.includes(TITLE_GENERATOR_PROMPT)) {
            // Title generation requests are not recorded as request entries
            return "title";
        }

        let systemForMsg = this.pendingSystemPrompt.get(sessionID);

        if (systemForMsg && systemForMsg === content) return null;

        this.pendingSystemPrompt.set(sessionID, content);
        return "request";
    }

    /**
     * Compose a complete request record
     * @param sessionID id of current session
     * @returns The composed request record as hook output, or null if no pending messages
     */
    composeRequest(sessionID: string): HookContentBuilderOutput | null {
        const messages = this.pendingMessages.get(sessionID);
        const system = this.pendingSystemPrompt.get(sessionID);

        if (!messages) return null;

        this.pendingMessages.delete(sessionID);
        this.pendingSystemPrompt.delete(sessionID);

        return {
            hook: "experimental.chat.messages.transform",
            title: "Request",
            sessionID: sessionID,
            output: {
                system: system ?? "",
                messages
            }
        }
    }

    private collectPartsForMessage(msg: MessageDetails): RequestPartContent[] {
        const partContents: RequestPartContent[] = [];
        for (const p of msg.parts) {
            const convertedPart = PartConverter.convertPart(p);
            if (convertedPart === null) continue;

            switch (convertedPart.kind) {
                case "model-text": {
                    partContents.push(convertedPart.content);
                    break;
                }
                case "tool-call": {
                    partContents.push(convertedPart.call);
                    if (convertedPart.result) partContents.push(convertedPart.result);
                    break;
                }
            }
        }
        return partContents;
    }
}
