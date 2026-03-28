import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import type { BaseMessageLike, BaseMessage } from "@langchain/core/messages";

export function getTextContent(message: BaseMessage): string {
  const msg = message as AIMessage;
  if (typeof msg.content === "string") {
    return msg.content;
  }
  let text = "";
  for (const block of msg.content) {
    if (block.type === "text") {
      text += block.text;
    }
  }
  return text;
}

export function getReasoningText(message: BaseMessage): string {
  const msg = message as AIMessage;
  if (typeof msg.content === "string") {
    return "";
  }
  for (const block of msg.content) {
    if (block.type === "reasoning") {
      return block.reasoning as string;
    }
  }
  return "";
}

export function getToolCalls(message: BaseMessage): Array<{
  id: string;
  name: string;
  args: Record<string, unknown>;
  output?: string;
  state: string;
}> {
  const msg = message as AIMessage;
  const toolCalls: Array<{
    id: string;
    name: string;
    args: Record<string, unknown>;
    output?: string;
    state: string;
  }> = [];

  if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
    for (const tc of msg.tool_calls) {
      toolCalls.push({
        id: tc.id as string,
        name: tc.name as string,
        args: tc.args as Record<string, unknown>,
        state: "input-available",
      });
    }
  }

  if (typeof msg.content === "string") {
    return toolCalls;
  }

  for (const block of msg.content) {
    if (block.type === "tool-call") {
      const existingTool = toolCalls.find((tc) => tc.id === block.toolCallId);
      if (existingTool) {
        existingTool.output = block.output as string | undefined;
        existingTool.state = block.output ? "output-available" : "input-available";
      }
    }
  }
  return toolCalls;
}

export function hasReasoning(message: BaseMessage): boolean {
  const msg = message as AIMessage;
  if (typeof msg.content === "string") {
    return false;
  }
  return msg.content.some((block) => block.type === "reasoning");
}

export function isHumanMessage(msg: BaseMessageLike): boolean {
  return HumanMessage.isInstance(msg);
}

export function isAIMessage(msg: BaseMessageLike): boolean {
  return AIMessage.isInstance(msg);
}

export function isToolMessage(msg: BaseMessageLike): boolean {
  return ToolMessage.isInstance(msg);
}

export type ToolCallWithResult = {
  id: string;
  name: string;
  args: Record<string, unknown>;
  output?: string;
  state: "input-available" | "output-available";
};

export function getToolCallsWithResults(
  messages: BaseMessage[]
): ToolCallWithResult[] {
  const toolCallsMap = new Map<string, ToolCallWithResult>();
  const toolResultsMap = new Map<string, string>();

  for (const msg of messages) {
    if (isToolMessage(msg)) {
      const toolMsg = msg as ToolMessage;
      if (toolMsg.tool_call_id) {
        const content = typeof toolMsg.content === "string"
          ? toolMsg.content
          : JSON.stringify(toolMsg.content);
        toolResultsMap.set(toolMsg.tool_call_id, content);
      }
    }
  }

  for (const msg of messages) {
    if (isAIMessage(msg)) {
      const aiMsg = msg as AIMessage;
      if (aiMsg.tool_calls && Array.isArray(aiMsg.tool_calls)) {
        for (const tc of aiMsg.tool_calls) {
          const toolResult = toolResultsMap.get(tc.id as string);
          toolCallsMap.set(tc.id as string, {
            id: tc.id as string,
            name: tc.name as string,
            args: tc.args as Record<string, unknown>,
            output: toolResult,
            state: toolResult ? "output-available" : "input-available",
          });
        }
      }
    }
  }

  return Array.from(toolCallsMap.values());
}