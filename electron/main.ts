import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface StoreSchema {
  apiUrl: string;
  defaultAssistantId: string;
  threadAssistants: Record<string, string>;
}

const store = new Store<StoreSchema>({
  defaults: {
    apiUrl: 'http://localhost:2024',
    defaultAssistantId: 'first_agent',
    threadAssistants: {},
  },
});

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Linang's AI 助手",
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  Menu.setApplicationMenu(null);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('config:get', () => {
  return {
    apiUrl: store.store.apiUrl,
    defaultAssistantId: store.store.defaultAssistantId,
    threadAssistants: store.store.threadAssistants,
  };
});

ipcMain.handle('config:setApiUrl', (_, apiUrl: string) => {
  store.set('apiUrl', apiUrl);
  return true;
});

ipcMain.handle('config:setDefaultAssistant', (_, assistantId: string) => {
  store.set('defaultAssistantId', assistantId);
  return true;
});

ipcMain.handle('config:setThreadAssistant', (_, threadId: string, assistantId: string) => {
  const threadAssistants = store.store.threadAssistants || {};
  threadAssistants[threadId] = assistantId;
  store.set('threadAssistants', threadAssistants);
  return true;
});

ipcMain.handle('config:getThreadAssistant', (_, threadId: string) => {
  const threadAssistants = store.store.threadAssistants || {};
  return threadAssistants[threadId] || null;
});

ipcMain.handle('config:deleteThreadAssistant', (_, threadId: string) => {
  const threadAssistants = store.store.threadAssistants || {};
  delete threadAssistants[threadId];
  store.set('threadAssistants', threadAssistants);
  return true;
});
