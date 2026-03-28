import { useState, useCallback, useEffect } from "react";
import { Chat } from "./components/chat";
import { Sidebar } from "./components/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useConfig } from "@/hooks/useConfig";
import { AgentSelectDialog } from "@/components/agent-select-dialog";

function App() {
  const { config, isLoading, setApiUrl, setDefaultAssistant, setThreadAssistant, getThreadAssistant } = useConfig();
  
  const getThreadIdFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("thread");
  }, []);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [currentAssistantId, setCurrentAssistantId] = useState<string>(config.defaultAssistantId);
  const [showAgentSelect, setShowAgentSelect] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const urlThreadId = getThreadIdFromUrl();
      if (urlThreadId) {
        setThreadId(urlThreadId);
        loadThreadAssistant(urlThreadId);
      }
    }
  }, [isLoading, getThreadIdFromUrl]);

  useEffect(() => {
    if (threadId) {
      const url = new URL(window.location.href);
      url.searchParams.set("thread", threadId);
      window.history.replaceState({}, "", url.toString());
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("thread");
      window.history.replaceState({}, "", url.toString());
    }
  }, [threadId]);

  const loadThreadAssistant = async (id: string) => {
    const savedAssistantId = await getThreadAssistant(id);
    if (savedAssistantId) {
      setCurrentAssistantId(savedAssistantId);
    } else {
      setCurrentAssistantId(config.defaultAssistantId);
    }
  };

  const handleNewChat = useCallback(() => {
    setShowAgentSelect(true);
  }, []);

  const handleAgentSelect = useCallback((assistantId: string) => {
    setCurrentAssistantId(assistantId);
    setThreadId(null);
  }, []);

  const handleSelectThread = useCallback(async (id: string) => {
    setThreadId(id);
    await loadThreadAssistant(id);
  }, [getThreadAssistant]);

  const handleThreadId = useCallback(async (id: string) => {
    setThreadId(id);
    if (currentAssistantId) {
      await setThreadAssistant(id, currentAssistantId);
    }
  }, [currentAssistantId, setThreadAssistant]);

  const handleClearThread = useCallback(() => {
    setThreadId(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex">
        <Sidebar
          onNewChat={handleNewChat}
          onSelectThread={handleSelectThread}
          onClearThread={handleClearThread}
          currentThreadId={threadId}
          apiUrl={config.apiUrl}
          defaultAssistantId={config.defaultAssistantId}
          onApiUrlChange={setApiUrl}
          onDefaultAssistantChange={setDefaultAssistant}
        />
        <div className="flex-1">
          <Chat
            apiUrl={config.apiUrl}
            assistantId={currentAssistantId}
            threadId={threadId}
            onThreadId={handleThreadId}
          />
        </div>
      </div>
      
      <AgentSelectDialog
        open={showAgentSelect}
        onOpenChange={setShowAgentSelect}
        apiUrl={config.apiUrl}
        defaultAssistantId={config.defaultAssistantId}
        onSelect={handleAgentSelect}
      />
    </TooltipProvider>
  );
}

export default App;
