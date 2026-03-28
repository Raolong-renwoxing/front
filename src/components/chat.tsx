import { useEffect } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { useStream } from "@langchain/react";
import type { AIMessage } from "@langchain/core/messages";
import {
  getTextContent,
  getToolCallsWithResults,
  isHumanMessage,
  isAIMessage,
  isToolMessage,
} from "@/lib/message-utils";

interface ChatProps {
  apiUrl?: string;
  assistantId?: string;
  threadId?: string | null;
  onThreadId?: (threadId: string) => void;
}

export function Chat({
  apiUrl = "http://localhost:2024",
  assistantId = "first_agent",
  threadId,
  onThreadId,
}: ChatProps) {
  const stream = useStream({
    apiUrl,
    assistantId,
    onThreadId,
  });

  // 当 threadId 变化时，使用 switchThread 切换线程
  useEffect(() => {
    if (threadId !== undefined) {
      stream.switchThread(threadId);
    }
  }, [threadId, stream.switchThread]);

  const renderMessages = () => {
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < stream.messages.length; i++) {
      const msg = stream.messages[i];

      if (isHumanMessage(msg)) {
        elements.push(
          <Message key={`user-${i}`} from="user" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <MessageContent>{msg.content as string}</MessageContent>
          </Message>
        );
      } else if (isToolMessage(msg)) {
        continue;
      } else if (isAIMessage(msg)) {
        const aiMsg = msg as AIMessage;
        const toolCalls = getToolCallsWithResults(stream.messages);
        const hasToolCalls = aiMsg.tool_calls && aiMsg.tool_calls.length > 0;

        if (hasToolCalls) {
          const toolCallsForThisMessage = toolCalls.filter((tc) =>
            aiMsg.tool_calls!.some((aiTc) => aiTc.id === tc.id)
          );

          if (toolCallsForThisMessage.length > 0) {
            elements.push(
              <div key={`tools-${i}`} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {toolCallsForThisMessage.map((tc) => (
                  <Tool key={tc.id} defaultOpen>
                    <ToolHeader
                      type="dynamic-tool"
                      state={tc.state}
                      toolName={tc.name}
                    />
                    <ToolContent>
                      <ToolInput input={tc.args} />
                      {tc.output && (
                        <ToolOutput
                          output={tc.output}
                          errorText={undefined}
                        />
                      )}
                    </ToolContent>
                  </Tool>
                ))}
              </div>
            );
          }
        }

        const textContent = getTextContent(msg);
        if (textContent) {
          elements.push(
            <Message key={`ai-${i}`} from="assistant" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <MessageContent>
                <MessageResponse>
                  {textContent}
                </MessageResponse>
              </MessageContent>
            </Message>
          );
        }
      }
    }

    return elements;
  };

  return (
    <div className="flex flex-col h-dvh bg-background">
      <Conversation className="flex-1">
        <ConversationContent className="max-w-3xl mx-auto w-full px-3 sm:px-4 lg:px-6">
          {stream.messages.length === 0 && (
            <ConversationEmptyState
              title="开始对话"
              description="输入您的问题，AI 助手将为您提供帮助"
            />
          )}
          {renderMessages()}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto w-full px-3 sm:px-4 lg:px-6 py-3">
          <PromptInput
            onSubmit={({ text }) =>
              stream.submit({
                messages: [{ type: "human", content: text }],
              })
            }
          >
            <PromptInputBody>
              <PromptInputTextarea
                placeholder="输入您的问题..."
                className="min-h-[44px] max-h-[180px]"
              />
            </PromptInputBody>
            <PromptInputFooter className="pt-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  按 Enter 发送，Shift + Enter 换行
                </span>
              </div>
              <PromptInputSubmit
                status={stream.isLoading ? "streaming" : "ready"}
                className="shrink-0"
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}