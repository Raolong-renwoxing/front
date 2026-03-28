import { contextBridge, ipcRenderer } from 'electron';

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

contextBridge.exposeInMainWorld('electronAPI', {
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    setApiUrl: (apiUrl: string) => ipcRenderer.invoke('config:setApiUrl', apiUrl),
    setDefaultAssistant: (assistantId: string) => ipcRenderer.invoke('config:setDefaultAssistant', assistantId),
    setThreadAssistant: (threadId: string, assistantId: string) => 
      ipcRenderer.invoke('config:setThreadAssistant', threadId, assistantId),
    getThreadAssistant: (threadId: string) => ipcRenderer.invoke('config:getThreadAssistant', threadId),
    deleteThreadAssistant: (threadId: string) => ipcRenderer.invoke('config:deleteThreadAssistant', threadId),
  },
} as ElectronAPI);
