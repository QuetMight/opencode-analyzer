import type { AssistantMessage, Part } from "@opencode-ai/sdk";
import { PartConverter, type ResponsePartContent } from "./part-converter";
import type { HookContentBuilderOutput } from "../general-logger/types";

// TODO: Memory leak prevention — if composeResponse is skipped due to an exception,
// pendingParts will never be cleared. Add try-finally cleanup in hooks.ts consumer
// side (Plan A), and consider TTL eviction or maxSize cap (Plan B/C) after verifying
// production request-response intervals.

export class ResponseBuilder {
    private static instance: ResponseBuilder;
    private pendingParts = new Map<string, Map<string, ResponsePartContent>>(); // messageID -> partID -> ResponsePartContent

    private constructor() { }

    static getInstance(): ResponseBuilder {
        if (!ResponseBuilder.instance) {
            ResponseBuilder.instance = new ResponseBuilder();
        }
        return ResponseBuilder.instance;
    }

    clear(): void {
        this.pendingParts.clear();
    }

    collectPart(messageID: string, part: Part): void {
        if (!messageID) return;
        const convertedPart = PartConverter.convertPart(part);
        if (!convertedPart) return;

        let content: ResponsePartContent | undefined;
        switch (convertedPart.kind) {
            case "model-text": {
                content = convertedPart.content;
                break;
            }
            case "tool-call": {
                content = convertedPart.call;
                break;
            }
        }
        if (!content) return;

        let partsForMessage = this.pendingParts.get(messageID);
        if (!partsForMessage) {
            partsForMessage = new Map<string, ResponsePartContent>();
            this.pendingParts.set(messageID, partsForMessage);
        }
        partsForMessage.set(part.id, content);
    }

    composeResponse(info: AssistantMessage): HookContentBuilderOutput {
        const { id, sessionID, role, finish, tokens } = info;
        const messageID = id ?? "";
        const partsForMessage = this.pendingParts.get(messageID);
        const content = partsForMessage ? Array.from(partsForMessage.values()) : [];

        if (messageID) {
            this.pendingParts.delete(messageID);
        }

        return {
            hook: "event",
            title: "Response",
            sessionID,
            event: {
                type: "message.updated",
                properties: {
                    info
                }
            },
            output: {
                role,
                content,
                finish_reason: finish ?? "",
                tokens
            }
        }
    }
}
