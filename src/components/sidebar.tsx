import { useState, useEffect, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { Client } from "@langchain/langgraph-sdk";
import { SettingsDialog } from "./settings-dialog";

interface Thread {
  thread_id: string;
  id?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  values?: {
    messages?: Array<{ content: string; type: string }>;
  };
}

interface SidebarProps {
  onNewChat?: () => void;
  onSelectThread?: (threadId: string) => void;
  onClearThread?: () => void;
  currentThreadId?: string | null;
  apiUrl: string;
  defaultAssistantId: string;
  onApiUrlChange: (url: string) => void;
  onDefaultAssistantChange: (id: string) => void;
}

export function Sidebar({
  onNewChat,
  onSelectThread,
  onClearThread,
  currentThreadId,
  apiUrl,
  defaultAssistantId,
  onApiUrlChange,
  onDefaultAssistantChange,
}: SidebarProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const client = useMemo(() => new Client({ apiUrl }), [apiUrl]);

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await client.threads.search({
        limit: 50,
        offset: 0,
        metadata: {},
      });
      setThreads(data as Thread[]);
    } catch (error) {
      console.error("Failed to fetch threads:", error);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    if (currentThreadId) {
      const exists = threads.some((t) => t.thread_id === currentThreadId);
      if (!exists) {
        fetchThreads();
      }
    }
  }, [currentThreadId, threads, fetchThreads]);

  const deleteThread = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    try {
      await client.threads.delete(threadId);
      setThreads((prev) => prev.filter((t) => t.thread_id !== threadId));
      if (currentThreadId === threadId) {
        onClearThread?.();
      }
    } catch (error) {
      console.error("Failed to delete thread:", error);
    }
  };

  const getThreadName = (thread: Thread) => {
    const firstMessage = thread.values?.messages?.[0];
    if (!firstMessage) {
      return "新对话";
    }
    let content = "";
    if (typeof firstMessage.content === "string") {
      content = firstMessage.content;
    } else if (Array.isArray(firstMessage.content)) {
      const blocks = firstMessage.content as Array<{ type: string; text?: string }>;
      content = blocks
        .filter((block) => block.type === "text")
        .map((block) => block.text || "")
        .join("");
    }
    if (content.length > 30) {
      return content.slice(0, 30) + "...";
    }
    return content || "新对话";
  };

  return (
    <div className="w-72 h-dvh bg-background border-r flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">对话历史</h2>
        <div className="flex items-center gap-1">
          <SettingsDialog
            apiUrl={apiUrl}
            defaultAssistantId={defaultAssistantId}
            onApiUrlChange={onApiUrlChange}
            onDefaultAssistantChange={onDefaultAssistantChange}
          />
          <Button
            variant="default"
            size="sm"
            onClick={onNewChat}
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            新对话
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            加载中...
          </div>
        ) : threads.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            暂无历史对话
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {threads.map((thread) => (
              <button
                key={thread.thread_id}
                onClick={() => onSelectThread?.(thread.thread_id)}
                className={`w-full text-left p-3 rounded-lg transition-colors group ${
                  currentThreadId === thread.thread_id
                    ? "bg-accent"
                    : "hover:bg-accent"
                }`}
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{getThreadName(thread)}</p>
                    {(thread.updated_at || thread.updatedAt) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(thread.updated_at || thread.updatedAt || '').toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Trash2
                    className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 hover:text-destructive transition-opacity cursor-pointer"
                    onClick={(e) => deleteThread(e, thread.thread_id)}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
