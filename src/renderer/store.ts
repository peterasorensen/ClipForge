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

// Video Editor Types
export interface MediaItem {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  filePath: string;
  duration: number;
  thumbnail?: string;
  width?: number;
  height?: number;
  fileSize: number;
}

export interface TimelineClip {
  id: string;
  mediaItemId: string;
  trackId: string;
  startTime: number; // Position on timeline in seconds
  duration: number;  // Duration in seconds
  trimStart: number; // Trim from start of source in seconds
  trimEnd: number;   // Trim from end of source in seconds
  volume: number;    // 0-1
  effects?: string[]; // Effect IDs
}

export interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'text';
  name: string;
  clips: TimelineClip[];
  locked: boolean;
  visible: boolean;
}

interface EditorState {
  // Media library
  mediaItems: MediaItem[];
  selectedMediaItemId: string | null;

  // Timeline
  tracks: TimelineTrack[];
  currentTime: number;
  zoom: number; // Pixels per second
  isPlaying: boolean;
  duration: number; // Total timeline duration

  // Selection
  selectedClipIds: string[];
  selectedTrackId: string | null;

  // Export
  exportProgress: number;
  isExporting: boolean;

  // Actions
  addMediaItem: (item: MediaItem) => void;
  removeMediaItem: (id: string) => void;
  setSelectedMediaItem: (id: string | null) => void;

  addTrack: (track: TimelineTrack) => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, updates: Partial<TimelineTrack>) => void;

  addClip: (clip: TimelineClip) => void;
  removeClip: (id: string) => void;
  updateClip: (id: string, updates: Partial<TimelineClip>) => void;
  splitClip: (clipId: string, splitTime: number) => void;

  setCurrentTime: (time: number) => void;
  setZoom: (zoom: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setDuration: (duration: number) => void;

  setSelectedClips: (ids: string[]) => void;
  setSelectedTrack: (id: string | null) => void;

  setExportProgress: (progress: number) => void;
  setIsExporting: (isExporting: boolean) => void;

  resetEditor: () => void;
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

export const useEditorStore = create<EditorState>((set) => ({
  // Initial state
  mediaItems: [],
  selectedMediaItemId: null,
  tracks: [],
  currentTime: 0,
  zoom: 50, // 50 pixels per second
  isPlaying: false,
  duration: 0,
  selectedClipIds: [],
  selectedTrackId: null,
  exportProgress: 0,
  isExporting: false,

  // Media library actions
  addMediaItem: (item) =>
    set((state) => ({
      mediaItems: [...state.mediaItems, item],
    })),

  removeMediaItem: (id) =>
    set((state) => {
      // Also remove all clips using this media item
      const updatedTracks = state.tracks.map((track) => ({
        ...track,
        clips: track.clips.filter((clip) => clip.mediaItemId !== id),
      }));

      return {
        mediaItems: state.mediaItems.filter((item) => item.id !== id),
        selectedMediaItemId:
          state.selectedMediaItemId === id ? null : state.selectedMediaItemId,
        tracks: updatedTracks,
      };
    }),

  setSelectedMediaItem: (id) => set({ selectedMediaItemId: id }),

  // Track actions
  addTrack: (track) =>
    set((state) => ({
      tracks: [...state.tracks, track],
    })),

  removeTrack: (id) =>
    set((state) => ({
      tracks: state.tracks.filter((track) => track.id !== id),
      selectedTrackId: state.selectedTrackId === id ? null : state.selectedTrackId,
    })),

  updateTrack: (id, updates) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === id ? { ...track, ...updates } : track
      ),
    })),

  // Clip actions
  addClip: (clip) =>
    set((state) => {
      const track = state.tracks.find((t) => t.id === clip.trackId);
      if (!track) return state;

      const updatedTracks = state.tracks.map((t) =>
        t.id === clip.trackId
          ? { ...t, clips: [...t.clips, clip] }
          : t
      );

      // Update duration if clip extends timeline
      const clipEnd = clip.startTime + clip.duration;
      const newDuration = Math.max(state.duration, clipEnd);

      return {
        tracks: updatedTracks,
        duration: newDuration,
      };
    }),

  removeClip: (id) =>
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        clips: track.clips.filter((clip) => clip.id !== id),
      })),
      selectedClipIds: state.selectedClipIds.filter((clipId) => clipId !== id),
    })),

  updateClip: (id, updates) =>
    set((state) => {
      const updatedTracks = state.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) =>
          clip.id === id ? { ...clip, ...updates } : clip
        ),
      }));

      // Recalculate duration
      let maxDuration = 0;
      updatedTracks.forEach((track) => {
        track.clips.forEach((clip) => {
          const clipEnd = clip.startTime + clip.duration;
          maxDuration = Math.max(maxDuration, clipEnd);
        });
      });

      return {
        tracks: updatedTracks,
        duration: maxDuration,
      };
    }),

  splitClip: (clipId, splitTime) =>
    set((state) => {
      let splitTrack: TimelineTrack | null = null;
      let splitClip: TimelineClip | null = null;

      // Find the clip to split
      for (const track of state.tracks) {
        const clip = track.clips.find((c: TimelineClip) => c.id === clipId);
        if (clip) {
          splitTrack = track;
          splitClip = clip;
          break;
        }
      }

      if (!splitClip || !splitTrack) return state;

      // Calculate split position relative to clip start
      const relativeTime = splitTime - splitClip.startTime;
      if (relativeTime <= 0 || relativeTime >= splitClip.duration) return state;

      // Create two new clips
      const clip1: TimelineClip = {
        ...splitClip,
        id: `${splitClip.id}-1`,
        duration: relativeTime,
        trimEnd: splitClip.trimEnd + (splitClip.duration - relativeTime),
      };

      const clip2: TimelineClip = {
        ...splitClip,
        id: `${splitClip.id}-2`,
        startTime: splitTime,
        duration: splitClip.duration - relativeTime,
        trimStart: splitClip.trimStart + relativeTime,
      };

      // Update tracks with split clips
      const updatedTracks = state.tracks.map((track) =>
        track.id === splitTrack!.id
          ? {
              ...track,
              clips: track.clips
                .filter((c: TimelineClip) => c.id !== clipId)
                .concat([clip1, clip2])
                .sort((a: TimelineClip, b: TimelineClip) => a.startTime - b.startTime),
            }
          : track
      );

      return {
        tracks: updatedTracks,
        selectedClipIds: [clip1.id, clip2.id],
      };
    }),

  // Playback actions
  setCurrentTime: (time) => set({ currentTime: time }),
  setZoom: (zoom) => set({ zoom }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setDuration: (duration) => set({ duration }),

  // Selection actions
  setSelectedClips: (ids) => set({ selectedClipIds: ids }),
  setSelectedTrack: (id) => set({ selectedTrackId: id }),

  // Export actions
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setIsExporting: (isExporting) => set({ isExporting }),

  // Reset
  resetEditor: () =>
    set({
      mediaItems: [],
      selectedMediaItemId: null,
      tracks: [],
      currentTime: 0,
      zoom: 50,
      isPlaying: false,
      duration: 0,
      selectedClipIds: [],
      selectedTrackId: null,
      exportProgress: 0,
      isExporting: false,
    }),
}));
