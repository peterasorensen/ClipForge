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

contextBridge.exposeInMainWorld('electronAPI', {
  getSources: (): Promise<DesktopCapturerSource[]> =>
    ipcRenderer.invoke('get-sources'),

  getDisplays: (): Promise<Display[]> =>
    ipcRenderer.invoke('get-displays'),

  openSelection: (mode: 'area' | 'window' | 'display'): void =>
    ipcRenderer.send('open-selection', mode),

  closeSelection: (): void =>
    ipcRenderer.send('close-selection'),

  startRecording: (): void =>
    ipcRenderer.send('start-recording'),

  stopRecording: (): void =>
    ipcRenderer.send('stop-recording'),

  saveRecording: (videoData: Buffer): Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }> =>
    ipcRenderer.invoke('save-recording', videoData),

  checkFFmpeg: (): Promise<boolean> =>
    ipcRenderer.invoke('check-ffmpeg'),
});

declare global {
  interface Window {
    electronAPI: {
      getSources: () => Promise<DesktopCapturerSource[]>;
      getDisplays: () => Promise<Display[]>;
      openSelection: (mode: 'area' | 'window' | 'display') => void;
      closeSelection: () => void;
      startRecording: () => void;
      stopRecording: () => void;
      saveRecording: (videoData: Buffer) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
      checkFFmpeg: () => Promise<boolean>;
    };
  }
}
