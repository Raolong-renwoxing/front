export interface ElectronAPI {
  config: {
    get: () => Promise<{
      apiUrl: string;
      defaultAssistantId: string;
      threadAssistants: Record<string, string>;
    }>;
    setApiUrl: (apiUrl: string) => Promise<boolean>;
    setDefaultAssistant: (assistantId: string) => Promise<boolean>;
    setThreadAssistant: (threadId: string, assistantId: string) => Promise<boolean>;
    getThreadAssistant: (threadId: string) => Promise<string | null>;
    deleteThreadAssistant: (threadId: string) => Promise<boolean>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
