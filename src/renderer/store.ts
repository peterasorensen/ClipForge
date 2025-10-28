import { create } from 'zustand';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  recordingMode: 'area' | 'window' | 'display' | null;
  selectedArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  selectedSourceId: string | null;
  mediaStream: MediaStream | null;
  mediaRecorder: MediaRecorder | null;
  recordedChunks: Blob[];
  micEnabled: boolean;
  cameraEnabled: boolean;

  setRecordingMode: (mode: 'area' | 'window' | 'display' | null) => void;
  setSelectedArea: (area: RecordingState['selectedArea']) => void;
  setSelectedSourceId: (id: string | null) => void;
  setMediaStream: (stream: MediaStream | null) => void;
  setMediaRecorder: (recorder: MediaRecorder | null) => void;
  addRecordedChunk: (chunk: Blob) => void;
  clearRecordedChunks: () => void;
  setIsRecording: (isRecording: boolean) => void;
  setIsPaused: (isPaused: boolean) => void;
  setRecordingTime: (time: number) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  reset: () => void;
}

export const useRecordingStore = create<RecordingState>((set) => ({
  isRecording: false,
  isPaused: false,
  recordingTime: 0,
  recordingMode: null,
  selectedArea: null,
  selectedSourceId: null,
  mediaStream: null,
  mediaRecorder: null,
  recordedChunks: [],
  micEnabled: false,
  cameraEnabled: false,

  setRecordingMode: (mode) => set({ recordingMode: mode }),
  setSelectedArea: (area) => set({ selectedArea: area }),
  setSelectedSourceId: (id) => set({ selectedSourceId: id }),
  setMediaStream: (stream) => set({ mediaStream: stream }),
  setMediaRecorder: (recorder) => set({ mediaRecorder: recorder }),
  addRecordedChunk: (chunk) =>
    set((state) => ({
      recordedChunks: [...state.recordedChunks, chunk],
    })),
  clearRecordedChunks: () => set({ recordedChunks: [] }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setIsPaused: (isPaused) => set({ isPaused }),
  setRecordingTime: (time) => set({ recordingTime: time }),
  toggleMic: () => set((state) => ({ micEnabled: !state.micEnabled })),
  toggleCamera: () => set((state) => ({ cameraEnabled: !state.cameraEnabled })),
  reset: () =>
    set({
      isRecording: false,
      isPaused: false,
      recordingTime: 0,
      recordingMode: null,
      selectedArea: null,
      selectedSourceId: null,
      mediaStream: null,
      mediaRecorder: null,
      recordedChunks: [],
    }),
}));
