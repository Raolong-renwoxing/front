import { useState, useEffect, useCallback } from 'react';

interface AppConfig {
  apiUrl: string;
  defaultAssistantId: string;
  threadAssistants: Record<string, string>;
}

const defaultConfig: AppConfig = {
  apiUrl: 'http://localhost:2024',
  defaultAssistantId: 'first_agent',
  threadAssistants: {},
};

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      if (window.electronAPI) {
        try {
          const storedConfig = await window.electronAPI.config.get();
          setConfig(storedConfig);
        } catch (error) {
          console.error('Failed to load config:', error);
        }
      }
      setIsLoading(false);
    };
    loadConfig();
  }, []);

  const setApiUrl = useCallback(async (apiUrl: string) => {
    if (window.electronAPI) {
      await window.electronAPI.config.setApiUrl(apiUrl);
    }
    setConfig((prev) => ({ ...prev, apiUrl }));
  }, []);

  const setDefaultAssistant = useCallback(async (assistantId: string) => {
    if (window.electronAPI) {
      await window.electronAPI.config.setDefaultAssistant(assistantId);
    }
    setConfig((prev) => ({ ...prev, defaultAssistantId: assistantId }));
  }, []);

  const setThreadAssistant = useCallback(async (threadId: string, assistantId: string) => {
    if (window.electronAPI) {
      await window.electronAPI.config.setThreadAssistant(threadId, assistantId);
    }
    setConfig((prev) => ({
      ...prev,
      threadAssistants: { ...prev.threadAssistants, [threadId]: assistantId },
    }));
  }, []);

  const getThreadAssistant = useCallback(async (threadId: string) => {
    if (window.electronAPI) {
      return await window.electronAPI.config.getThreadAssistant(threadId);
    }
    return config.threadAssistants[threadId] || null;
  }, [config.threadAssistants]);

  const deleteThreadAssistant = useCallback(async (threadId: string) => {
    if (window.electronAPI) {
      await window.electronAPI.config.deleteThreadAssistant(threadId);
    }
    setConfig((prev) => {
      const newThreadAssistants = { ...prev.threadAssistants };
      delete newThreadAssistants[threadId];
      return { ...prev, threadAssistants: newThreadAssistants };
    });
  }, []);

  return {
    config,
    isLoading,
    setApiUrl,
    setDefaultAssistant,
    setThreadAssistant,
    getThreadAssistant,
    deleteThreadAssistant,
  };
}
