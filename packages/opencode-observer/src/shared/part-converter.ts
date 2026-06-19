import type { Part, TextPart, ReasoningPart, ToolPart } from "@opencode-ai/sdk";

export type ModelText = {
    type: "text";
    text: string;
} | {
    type: "reasoning";
    text: string;
    metadata?: { [key: string]: unknown; } | undefined;
}

export type ModelToolCall = {
    type: "tool_use";
    id: string;
    tool: string;
    input: { [key: string]: unknown; };
    error?: string;
    metadata?: { [key: string]: unknown; } | undefined;
}

export type ToolResult = {
    type: "tool_result";
    id: string;
    result: string;
    metadata?: { [key: string]: unknown; } | undefined;
} | {
    type: "tool_result";
    id: string;
    error: string;
    metadata?: { [key: string]: unknown; } | undefined;
}

export type PartContent =
    | { kind: "model-text"; content: ModelText }
    | { kind: "tool-call"; call: ModelToolCall; result?: ToolResult }
    | null;

export type ResponsePartContent = ModelText | ModelToolCall;
export type RequestPartContent = ModelText | ModelToolCall | ToolResult;

export class PartConverter {
    static convertPart(part: Part): PartContent {
        switch (part.type) {
            case "text": return this.convertText(part);
            case "reasoning": return this.convertReasoning(part);
            case "tool": return this.convertTool(part);
            default: return null;
        }
    }

    private static convertText(part: TextPart): PartContent {
        return {
            kind: "model-text",
            content: {
                type: "text",
                text: part.text
            }
        };
    }

    private static convertReasoning(part: ReasoningPart): PartContent {
        return {
            kind: "model-text",
            content: {
                type: "reasoning",
                text: part.text,
                metadata: part.metadata
            }
        };
    }

    private static convertTool(part: ToolPart): PartContent {
        const state = part.state;

        const call: ModelToolCall = {
            type: "tool_use",
            id: part.callID,
            tool: part.tool,
            input: state.input,
            ...(state.status === "error" && { error: state.error }),
            metadata: part.metadata
        };

        const result = this.convertToolResult(part);

        return {
            kind: "tool-call",
            call,
            ...(result && { result })
        };
    }

    private static convertToolResult(part: ToolPart): ToolResult | undefined {
        const state = part.state;
        if (state.status === "completed") {
            return {
                type: "tool_result",
                id: part.callID,
                result: state.output,
                metadata: part.metadata
            };
        }
        if (state.status === "error") {
            return {
                type: "tool_result",
                id: part.callID,
                error: state.error,
                metadata: part.metadata
            };
        }
        return undefined;
    }
}
