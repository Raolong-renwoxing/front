import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Bot } from "lucide-react";
import { Client } from "@langchain/langgraph-sdk";

interface Assistant {
  assistant_id: string;
  graph_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

interface AgentSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiUrl: string;
  defaultAssistantId: string;
  onSelect: (assistantId: string) => void;
}

export function AgentSelectDialog({
  open,
  onOpenChange,
  apiUrl,
  defaultAssistantId,
  onSelect,
}: AgentSelectDialogProps) {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(defaultAssistantId);

  useEffect(() => {
    if (open) {
      fetchAssistants();
      setSelectedId(defaultAssistantId);
    }
  }, [open, apiUrl, defaultAssistantId]);

  const fetchAssistants = async () => {
    setIsLoading(true);
    try {
      const client = new Client({ apiUrl });
      const data = await client.assistants.search({});
      setAssistants(data as Assistant[]);
    } catch (error) {
      console.error("Failed to fetch assistants:", error);
      setAssistants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>选择 Agent 开始对话</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : assistants.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              暂无可用的 Agent，请检查 API 配置
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {assistants.map((assistant) => (
                <button
                  key={assistant.assistant_id}
                  onClick={() => setSelectedId(assistant.assistant_id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedId === assistant.assistant_id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Bot className={`h-5 w-5 ${
                      selectedId === assistant.assistant_id
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {assistant.assistant_id}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {assistant.graph_id}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedId || assistants.length === 0}
            >
              开始对话
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
