import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Loader2, Check, X } from "lucide-react";
import { Client } from "@langchain/langgraph-sdk";

interface Assistant {
  assistant_id: string;
  graph_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

interface SettingsDialogProps {
  apiUrl: string;
  defaultAssistantId: string;
  onApiUrlChange: (url: string) => void;
  onDefaultAssistantChange: (id: string) => void;
}

export function SettingsDialog({
  apiUrl,
  defaultAssistantId,
  onApiUrlChange,
  onDefaultAssistantChange,
}: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [tempApiUrl, setTempApiUrl] = useState(apiUrl);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoadingAssistants, setIsLoadingAssistants] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setTempApiUrl(apiUrl);
  }, [apiUrl]);

  const fetchAssistants = useCallback(async () => {
    setIsLoadingAssistants(true);
    setConnectionStatus('checking');
    setErrorMessage('');
    
    try {
      const client = new Client({ apiUrl: tempApiUrl });
      const data = await client.assistants.search({});
      setAssistants(data as Assistant[]);
      setConnectionStatus('success');
    } catch (error) {
      console.error("Failed to fetch assistants:", error);
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '连接失败');
      setAssistants([]);
    } finally {
      setIsLoadingAssistants(false);
    }
  }, [tempApiUrl]);

  useEffect(() => {
    if (open && tempApiUrl) {
      fetchAssistants();
    }
  }, [open, tempApiUrl, fetchAssistants]);

  const handleSave = () => {
    onApiUrlChange(tempApiUrl);
    setOpen(false);
  };

  const handleAssistantSelect = (assistantId: string) => {
    onDefaultAssistantChange(assistantId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8"
      >
        <Settings className="h-4 w-4" />
      </button>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">API 地址</label>
            <div className="flex gap-2">
              <Input
                value={tempApiUrl}
                onChange={(e) => setTempApiUrl(e.target.value)}
                placeholder="http://localhost:2024"
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={fetchAssistants}
                disabled={isLoadingAssistants}
              >
                {isLoadingAssistants ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  '测试'
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2 h-5">
              {connectionStatus === 'success' && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  连接成功
                </div>
              )}
              {connectionStatus === 'error' && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <X className="h-4 w-4" />
                  {errorMessage}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">默认 Agent</label>
            {isLoadingAssistants ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : assistants.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                请先配置有效的 API 地址
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {assistants.map((assistant) => (
                  <button
                    key={assistant.assistant_id}
                    onClick={() => handleAssistantSelect(assistant.assistant_id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      defaultAssistantId === assistant.assistant_id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <div className="font-medium text-sm">
                      {assistant.assistant_id}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Graph: {assistant.graph_id}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
