import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
    config: {
        get: () => ipcRenderer.invoke('config:get'),
        setApiUrl: (apiUrl) => ipcRenderer.invoke('config:setApiUrl', apiUrl),
        setDefaultAssistant: (assistantId) => ipcRenderer.invoke('config:setDefaultAssistant', assistantId),
        setThreadAssistant: (threadId, assistantId) => ipcRenderer.invoke('config:setThreadAssistant', threadId, assistantId),
        getThreadAssistant: (threadId) => ipcRenderer.invoke('config:getThreadAssistant', threadId),
        deleteThreadAssistant: (threadId) => ipcRenderer.invoke('config:deleteThreadAssistant', threadId),
    },
});
