import { app, BrowserWindow, ipcMain, desktopCapturer, screen, dialog } from 'electron';
import path from 'path';
import Store from 'electron-store';

// In development mode, these are provided by Vite
// In production, they're provided by Electron Forge
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

// Initialize store for future use
new Store();

let controlBar: BrowserWindow | null = null;
let selectionWindow: BrowserWindow | null = null;
let recordingToolbar: BrowserWindow | null = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createControlBar = (): void => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;

  controlBar = new BrowserWindow({
    width: 600,
    height: 80,
    x: Math.floor((width - 600) / 2),
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    controlBar.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    controlBar.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  controlBar.setAlwaysOnTop(true, 'screen-saver');
  controlBar.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Open DevTools in development
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    controlBar.webContents.openDevTools({ mode: 'detach' });
  }
};

const createSelectionWindow = (mode: 'area' | 'window' | 'display'): void => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height, x, y } = primaryDisplay.bounds;

  if (selectionWindow) {
    selectionWindow.close();
  }

  selectionWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    selectionWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#selection/${mode}`);
  } else {
    selectionWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), {
      hash: `selection/${mode}`,
    });
  }

  selectionWindow.setAlwaysOnTop(true, 'screen-saver');

  selectionWindow.on('closed', () => {
    selectionWindow = null;
  });
};

const createRecordingToolbar = (): void => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  recordingToolbar = new BrowserWindow({
    width: 300,
    height: 60,
    x: Math.floor((width - 300) / 2),
    y: height - 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    recordingToolbar.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#recording-toolbar`);
  } else {
    recordingToolbar.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), {
      hash: 'recording-toolbar',
    });
  }

  recordingToolbar.setAlwaysOnTop(true, 'screen-saver');
  recordingToolbar.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
};

// App lifecycle
app.on('ready', () => {
  createControlBar();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createControlBar();
  }
});

// IPC Handlers
ipcMain.handle('get-sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 150, height: 150 },
    fetchWindowIcons: true,
  });

  // Note: Electron's desktopCapturer doesn't provide window bounds
  // For a production app, you'd need native modules to get window positions
  // For now, we'll arrange windows in a visual grid
  const windowsOnly = sources.filter(s => !s.id.startsWith('screen'));

  // Create a simple grid layout for windows
  const cols = 3;
  const windowWidth = 300;
  const windowHeight = 200;
  const padding = 50;
  const startX = 100;
  const startY = 100;

  const sourcesWithBounds = windowsOnly.map((source, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    return {
      ...source,
      thumbnail: source.thumbnail?.toDataURL?.() || source.thumbnail,
      appIcon: source.appIcon?.toDataURL?.() || null,
      bounds: {
        x: startX + col * (windowWidth + padding),
        y: startY + row * (windowHeight + padding),
        width: windowWidth,
        height: windowHeight,
      },
    };
  });

  return [...sourcesWithBounds, ...sources.filter(s => s.id.startsWith('screen'))];
});

ipcMain.handle('get-displays', async () => {
  const displays = screen.getAllDisplays();
  return displays;
});

ipcMain.on('open-selection', (_event, mode: 'area' | 'window' | 'display') => {
  createSelectionWindow(mode);
});

ipcMain.on('close-selection', () => {
  if (selectionWindow) {
    selectionWindow.close();
    selectionWindow = null;
  }
});

ipcMain.on('start-recording', () => {
  if (controlBar) {
    controlBar.hide();
  }
  if (selectionWindow) {
    selectionWindow.close();
    selectionWindow = null;
  }
  createRecordingToolbar();
});

ipcMain.on('stop-recording', () => {
  if (recordingToolbar) {
    recordingToolbar.close();
    recordingToolbar = null;
  }
  if (controlBar) {
    controlBar.show();
  }
});

ipcMain.handle('save-recording', async (_event, videoData: Buffer) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Save Recording',
    defaultPath: `recording-${Date.now()}.mp4`,
    filters: [{ name: 'Video', extensions: ['mp4'] }],
  });

  if (canceled || !filePath) {
    return { success: false, canceled: true };
  }

  try {
    const fs = require('fs').promises;
    await fs.writeFile(filePath, videoData);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('check-ffmpeg', async () => {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec('ffmpeg -version', (error: Error | null) => {
      resolve(!error);
    });
  });
});
