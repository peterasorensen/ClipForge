import { contextBridge, ipcRenderer } from 'electron';

export interface DesktopCapturerSource {
  id: string;
  name: string;
  thumbnail: string;
  appIcon?: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Display {
  id: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  workArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  size: {
    width: number;
    height: number;
  };
  scaleFactor: number;
  rotation: number;
  internal: boolean;
}

export interface HitTestWindow {
  windowNumber: number;
  ownerName: string;
  name: string;
  pid: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

contextBridge.exposeInMainWorld('electronAPI', {
  getSources: (): Promise<DesktopCapturerSource[]> =>
    ipcRenderer.invoke('get-sources'),

  getDisplays: (): Promise<Display[]> =>
    ipcRenderer.invoke('get-displays'),

  hitTestWindow: (x: number, y: number): Promise<HitTestWindow | {}> =>
    ipcRenderer.invoke('hit-test-window', x, y),

  openSelection: (mode: 'area' | 'window' | 'display'): void =>
    ipcRenderer.send('open-selection', mode),

  closeSelection: (): void =>
    ipcRenderer.send('close-selection'),

  startRecording: (config?: { selectedSourceId?: string | null; selectedArea?: { x: number; y: number; width: number; height: number } | null }): void =>
    ipcRenderer.send('start-recording', config),

  stopRecording: (): void =>
    ipcRenderer.send('stop-recording'),

  saveRecording: (videoData: Buffer): Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }> =>
    ipcRenderer.invoke('save-recording', videoData),

  checkFFmpeg: (): Promise<boolean> =>
    ipcRenderer.invoke('check-ffmpeg'),

  getRecordingConfig: (): Promise<{ selectedSourceId?: string | null; selectedArea?: { x: number; y: number; width: number; height: number } | null } | null> =>
    ipcRenderer.invoke('get-recording-config'),
});

declare global {
  interface Window {
    electronAPI: {
      getSources: () => Promise<DesktopCapturerSource[]>;
      getDisplays: () => Promise<Display[]>;
      hitTestWindow: (x: number, y: number) => Promise<HitTestWindow | {}>;
      openSelection: (mode: 'area' | 'window' | 'display') => void;
      closeSelection: () => void;
      startRecording: (config?: { selectedSourceId?: string | null; selectedArea?: { x: number; y: number; width: number; height: number } | null }) => void;
      stopRecording: () => void;
      saveRecording: (videoData: Buffer) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
      checkFFmpeg: () => Promise<boolean>;
      getRecordingConfig: () => Promise<{ selectedSourceId?: string | null; selectedArea?: { x: number; y: number; width: number; height: number } | null } | null>;
    };
  }
}
