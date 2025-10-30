import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import { useEditorStore, TimelineClip } from '../store';

const TimelineContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TimelineHeader = styled.div`
  height: 40px;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
`;

const ZoomControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  user-select: none;
`;

const ZoomSliderContainer = styled.div`
  position: relative;
  width: 120px;
  height: 24px;
  display: flex;
  align-items: center;
`;

const ZoomSliderTrack = styled.div`
  width: 100%;
  height: 4px;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 2px;
  position: relative;
  cursor: pointer;
`;

const ZoomSliderThumb = styled.div.attrs<{ $position: number }>(({ $position }) => ({
  style: {
    left: `${$position}%`,
  }
}))<{ $position: number }>`
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  background: ${({ theme }) => theme.colors.accent.primary};
  border-radius: 50%;
  cursor: grab;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    box-shadow: 0 0 8px ${({ theme }) => theme.colors.accent.glow};
  }

  &:active {
    cursor: grabbing;
    box-shadow: 0 0 12px ${({ theme }) => theme.colors.accent.glow};
  }
`;

const ZoomLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  white-space: nowrap;
`;

const TimelineContent = styled.div`
  flex: 1;
  display: flex;
  overflow: auto;
  padding-left: 16px;
  background: ${({ theme }) => theme.colors.background.primary};

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background.tertiary};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border.primary};
    border-radius: 4px;

    &:hover {
      background: ${({ theme }) => theme.colors.border.accent};
    }
  }
`;

const RowLabel = styled.div`
  position: absolute;
  bottom: 2px;
  left: 8px;
  font-size: 10px;
  color: ${({ theme }) => theme.colors.text.muted};
  pointer-events: none;
  user-select: none;
  opacity: 0.6;
`;

const TracksContainer = styled.div`
  flex: 1;
  position: relative;
  background: ${({ theme }) => theme.colors.background.primary};
`;

const RulerContainer = styled.div`
  height: 30px;
  background: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  position: relative;
  overflow: hidden;
`;

const Ruler = styled.div.attrs<{ $zoom: number }>(({ $zoom }) => ({
  style: {
    width: `${$zoom * 100}px`, // 100 seconds visible
  }
}))<{ $zoom: number }>`
  height: 100%;
  position: relative;
`;

const RulerMark = styled.div.attrs<{ $position: number }>(({ $position }) => ({
  style: {
    left: `${$position}px`,
  }
}))<{ $position: number }>`
  position: absolute;
  top: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  &::before {
    content: '';
    width: 1px;
    height: 8px;
    background: ${({ theme }) => theme.colors.border.primary};
  }
`;

const RulerLabel = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-left: 4px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-weight: 400;
`;

const TrackRow = styled.div<{ $isDragOver?: boolean }>`
  height: 60px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  position: relative;
  background: ${({ $isDragOver, theme }) =>
    $isDragOver ? `${theme.colors.accent.primary}10` : 'transparent'};
  transition: background ${({ theme }) => theme.transitions.fast};
`;

const ClipElement = styled.div.attrs<{
  $startTime: number;
  $duration: number;
  $zoom: number;
  $selected: boolean;
}>(({ $startTime, $duration, $zoom, $selected }) => ({
  style: {
    left: `${$startTime * $zoom}px`,
    width: `${$duration * $zoom}px`,
    background: $selected ? '#e68a4d' : '#d97f43',
    borderColor: $selected ? '#f0a060' : '#d97f43',
  }
}))<{
  $startTime: number;
  $duration: number;
  $zoom: number;
  $selected: boolean;
}>`
  position: absolute;
  height: 48px;
  top: 6px;
  border: 2px solid;
  border-radius: 12px;
  cursor: move;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.md};

  &:hover {
    border-color: #f0a060 !important;
    background: #e68a4d !important;
  }
`;

const ClipContent = styled.div`
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  pointer-events: none;
`;

const ClipName = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ClipDuration = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: 'Courier New', monospace;
`;

const ResizeHandle = styled.div<{ $position: 'left' | 'right' }>`
  position: absolute;
  ${({ $position }) => $position}: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: ew-resize;
  background: ${({ theme }) => theme.colors.accent.primary};
  opacity: 0;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  ${ClipElement}:hover & {
    opacity: 0.6;
  }

  &:hover {
    opacity: 1 !important;
  }
`;

const Playhead = styled.div.attrs<{ $position: number; $zoom: number }>(({ $position, $zoom }) => ({
  style: {
    left: `${$position * $zoom}px`,
  }
}))<{ $position: number; $zoom: number }>`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: ${({ theme }) => theme.colors.accent.primary};
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 0 8px ${({ theme }) => theme.colors.accent.glow};

  &::before {
    content: '';
    position: absolute;
    top: -6px;
    left: -6px;
    width: 14px;
    height: 14px;
    background: ${({ theme }) => theme.colors.accent.primary};
    border-radius: 50%;
  }
`;

const EmptyTimeline = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 14px;
`;

const TimelineVisibilityDropdown = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 12px;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.background.glass};
    border-color: ${({ theme }) => theme.colors.border.accent};
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  min-width: 180px;
  z-index: 100;
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
`;

const DropdownItem = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.background.glass};
  }

  &:first-child {
    border-top-left-radius: ${({ theme }) => theme.borderRadius.md};
    border-top-right-radius: ${({ theme }) => theme.borderRadius.md};
  }

  &:last-child {
    border-bottom-left-radius: ${({ theme }) => theme.borderRadius.md};
    border-bottom-right-radius: ${({ theme }) => theme.borderRadius.md};
  }

  input[type="checkbox"] {
    width: 14px;
    height: 14px;
    cursor: pointer;
  }
`;

const AdditionalTimelineRow = styled.div`
  height: 40px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  position: relative;
  background: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  align-items: center;
`;


const AdditionalTimelineTrack = styled.div`
  flex: 1;
  height: 100%;
  position: relative;
`;

const ZoomSegment = styled.div.attrs<{
  $startTime: number;
  $duration: number;
  $zoom: number;
}>(({ $startTime, $duration, $zoom }) => ({
  style: {
    left: `${$startTime * $zoom}px`,
    width: `${$duration * $zoom}px`,
  }
}))<{
  $startTime: number;
  $duration: number;
  $zoom: number;
}>`
  position: absolute;
  height: 24px;
  top: 8px;
  background: #6b7dff;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: #7a8cff;
  }
`;

const LayoutSegment = styled.div.attrs<{
  $startTime: number;
  $duration: number;
  $zoom: number;
}>(({ $startTime, $duration, $zoom }) => ({
  style: {
    left: `${$startTime * $zoom}px`,
    width: `${$duration * $zoom}px`,
  }
}))<{
  $startTime: number;
  $duration: number;
  $zoom: number;
}>`
  position: absolute;
  height: 24px;
  top: 8px;
  background: ${({ theme }) => theme.colors.background.glass};
  border: 1px solid ${({ theme }) => theme.colors.border.accent};
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.text.secondary};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent.primary};
  }
`;

type TimelineType = 'zooms' | 'layouts';

const Timeline: React.FC = () => {
  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const zoomLabelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [dragOverTrackId, setDragOverTrackId] = useState<string | null>(null);
  const [visibleTimelines, setVisibleTimelines] = useState<TimelineType[]>(['zooms', 'layouts']);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isZoomHovered, setIsZoomHovered] = useState(false);

  // Use refs for drag state to avoid re-renders during drag
  const dragStateRef = useRef({
    isDragging: false,
    isResizing: null as 'left' | 'right' | null,
    clipId: null as string | null,
    startX: 0,
    startTime: 0,
    startDuration: 0,
    startTrimStart: 0,
  });

  const {
    tracks,
    currentTime,
    zoom,
    duration,
    mediaItems,
    selectedClipIds,
    setZoom,
    setCurrentTime,
    updateClip,
    setSelectedClips,
    addClip,
    addTrack,
    pushToHistory,
  } = useEditorStore();

  const toggleTimeline = (timeline: TimelineType) => {
    setVisibleTimelines((prev) =>
      prev.includes(timeline)
        ? prev.filter((t) => t !== timeline)
        : [...prev, timeline]
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownOpen && !(e.target as HTMLElement).closest('[data-dropdown]')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Track container width for calculating visible time
  useEffect(() => {
    if (!timelineContentRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(timelineContentRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Calculate visible time in seconds
  const getVisibleTime = () => {
    if (containerWidth === 0) return 0;
    return containerWidth / zoom;
  };

  // Format visible time as "X seconds" or "X minutes"
  const formatVisibleTime = () => {
    const visibleSeconds = getVisibleTime();
    if (visibleSeconds < 60) {
      return `${Math.round(visibleSeconds)} second${Math.round(visibleSeconds) !== 1 ? 's' : ''} visible`;
    } else {
      const minutes = visibleSeconds / 60;
      if (minutes < 10) {
        return `${minutes.toFixed(1)} minutes visible`;
      } else {
        return `${Math.round(minutes)} minutes visible`;
      }
    }
  };

  // Convert zoom (10-200 px/s) to slider position (0-100%)
  const zoomToSliderPosition = () => {
    const minZoom = 10;
    const maxZoom = 200;
    return ((zoom - minZoom) / (maxZoom - minZoom)) * 100;
  };

  // Handle slider drag
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const sliderElement = e.currentTarget as HTMLElement;
    const rect = sliderElement.getBoundingClientRect();

    const updateZoom = (clientX: number) => {
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = x / rect.width;
      const minZoom = 10;
      const maxZoom = 200;
      const newZoom = minZoom + percentage * (maxZoom - minZoom);
      setZoom(Math.max(minZoom, Math.min(newZoom, maxZoom)));
    };

    updateZoom(e.clientX);

    const handleMouseMove = (e: MouseEvent) => {
      updateZoom(e.clientX);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle pinch/spread gesture for zooming
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Check if this is a pinch gesture (Ctrl/Cmd + wheel)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        // Show zoom label during gesture
        setIsZoomHovered(true);

        // Clear existing timeout
        if (zoomLabelTimeoutRef.current) {
          clearTimeout(zoomLabelTimeoutRef.current);
        }

        // Hide label after 1 second of no gesture
        zoomLabelTimeoutRef.current = setTimeout(() => {
          setIsZoomHovered(false);
        }, 1000);

        const delta = -e.deltaY;
        const zoomFactor = delta > 0 ? 1.03 : 0.97;
        const newZoom = zoom * zoomFactor;

        setZoom(Math.max(10, Math.min(newZoom, 200)));
      }
    };

    const container = tracksContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (zoomLabelTimeoutRef.current) {
        clearTimeout(zoomLabelTimeoutRef.current);
      }
    };
  }, [zoom]);

  const handleClipMouseDown = (
    e: React.MouseEvent,
    clipId: string,
    clip: TimelineClip,
    resizeHandle?: 'left' | 'right'
  ) => {
    e.stopPropagation();
    e.preventDefault();

    // Store initial state in ref
    const dragState = dragStateRef.current;
    dragState.isDragging = !resizeHandle;
    dragState.isResizing = resizeHandle || null;
    dragState.clipId = clipId;
    dragState.startX = e.clientX;
    dragState.startTime = clip.startTime;
    dragState.startDuration = clip.duration;
    dragState.startTrimStart = clip.trimStart;

    setSelectedClips([clipId]);

    let rafId: number | null = null;
    let hasMoved = false;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();

      // Cancel previous frame if pending
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      // Schedule update on next frame
      rafId = requestAnimationFrame(() => {
        const deltaX = e.clientX - dragState.startX;
        const deltaTime = deltaX / zoom;

        // Track if we've moved
        if (!hasMoved && Math.abs(deltaX) > 2) {
          hasMoved = true;
        }

        if (dragState.isDragging && dragState.clipId) {
          // Move clip
          const newStartTime = Math.max(0, dragState.startTime + deltaTime);
          updateClip(dragState.clipId, { startTime: newStartTime }, true);
        } else if (dragState.isResizing === 'left' && dragState.clipId) {
          // Resize from left
          const newStartTime = Math.max(0, dragState.startTime + deltaTime);
          const newDuration = Math.max(0.1, dragState.startDuration - deltaTime);
          const newTrimStart = dragState.startTrimStart + deltaTime;

          updateClip(dragState.clipId, {
            startTime: newStartTime,
            duration: newDuration,
            trimStart: newTrimStart,
          }, true);
        } else if (dragState.isResizing === 'right' && dragState.clipId) {
          // Resize from right
          const newDuration = Math.max(0.1, dragState.startDuration + deltaTime);
          updateClip(dragState.clipId, { duration: newDuration }, true);
        }
        rafId = null;
      });
    };

    const handleMouseUp = () => {
      // Cleanup
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Save to history if we actually moved the clip
      if (hasMoved) {
        pushToHistory();
      }

      // Reset state
      dragState.isDragging = false;
      dragState.isResizing = null;
      dragState.clipId = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineContentRef.current) return;

    const rect = timelineContentRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    // Account for padding-left: 16px on TimelineContent
    const timelineX = x - 16;
    const time = Math.max(0, timelineX) / zoom;

    setCurrentTime(Math.max(0, Math.min(time, duration)));
  };

  const handleTrackDragOver = (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverTrackId(trackId);
  };

  const handleTrackDragLeave = () => {
    setDragOverTrackId(null);
  };

  const handleTrackDrop = (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    setDragOverTrackId(null);

    const mediaItemId = e.dataTransfer.getData('mediaItemId');
    if (!mediaItemId) return;

    const mediaItem = mediaItems.find((item) => item.id === mediaItemId);
    if (!mediaItem) return;

    // Calculate drop position on timeline
    const trackElement = e.currentTarget as HTMLElement;
    const rect = trackElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const dropTime = Math.max(0, x / zoom);

    // Find the target track
    const targetTrack = tracks.find((t) => t.id === trackId);
    if (!targetTrack) return;

    // Check if media type matches track type
    if (mediaItem.type !== targetTrack.type && mediaItem.type !== 'image') {
      // If types don't match, create a new compatible track
      const newTrack = {
        id: `track-${Date.now()}`,
        type: mediaItem.type as 'video' | 'audio',
        name: `${mediaItem.type.charAt(0).toUpperCase() + mediaItem.type.slice(1)} ${
          tracks.filter((t) => t.type === mediaItem.type).length + 1
        }`,
        clips: [],
        locked: false,
        visible: true,
      };
      addTrack(newTrack);

      // Create clip on new track
      const newClip = {
        id: `clip-${Date.now()}`,
        mediaItemId: mediaItem.id,
        trackId: newTrack.id,
        startTime: dropTime,
        duration: mediaItem.duration,
        trimStart: 0,
        trimEnd: 0,
        volume: 1,
      };
      addClip(newClip);
    } else {
      // Create clip on existing track
      const newClip = {
        id: `clip-${Date.now()}`,
        mediaItemId: mediaItem.id,
        trackId: trackId,
        startTime: dropTime,
        duration: mediaItem.duration,
        trimStart: 0,
        trimEnd: 0,
        volume: 1,
      };
      addClip(newClip);
    }
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Generate ruler marks
  const rulerMarks = [];
  const interval = zoom > 50 ? 1 : zoom > 25 ? 5 : 10; // seconds
  for (let i = 0; i <= 100; i += interval) {
    rulerMarks.push(
      <RulerMark key={i} $position={i * zoom}>
        <RulerLabel>{formatTime(i)}</RulerLabel>
      </RulerMark>
    );
  }

  const handleEmptyTimelineDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const mediaItemId = e.dataTransfer.getData('mediaItemId');
    if (!mediaItemId) return;

    const mediaItem = mediaItems.find((item) => item.id === mediaItemId);
    if (!mediaItem || mediaItem.type === 'image') return;

    // Create a new track
    const newTrack = {
      id: `track-${Date.now()}`,
      type: mediaItem.type as 'video' | 'audio',
      name: `${mediaItem.type.charAt(0).toUpperCase() + mediaItem.type.slice(1)} 1`,
      clips: [],
      locked: false,
      visible: true,
    };
    addTrack(newTrack);

    // Create clip at start
    const newClip = {
      id: `clip-${Date.now()}`,
      mediaItemId: mediaItem.id,
      trackId: newTrack.id,
      startTime: 0,
      duration: mediaItem.duration,
      trimStart: 0,
      trimEnd: 0,
      volume: 1,
    };
    addClip(newClip);
  };

  if (tracks.length === 0) {
    return (
      <TimelineContainer>
        <TimelineHeader>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Timeline</span>
          <ZoomControls
            onMouseEnter={() => setIsZoomHovered(true)}
            onMouseLeave={() => setIsZoomHovered(false)}
          >
            {isZoomHovered && <ZoomLabel>{formatVisibleTime()}</ZoomLabel>}
            <ZoomSliderContainer onMouseDown={handleSliderMouseDown}>
              <ZoomSliderTrack />
              <ZoomSliderThumb $position={zoomToSliderPosition()} />
            </ZoomSliderContainer>
          </ZoomControls>
        </TimelineHeader>
        <TimelineContent
          ref={timelineContentRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleEmptyTimelineDrop}
        >
          <EmptyTimeline>
            Drag media from the library to create clips on the timeline
          </EmptyTimeline>
        </TimelineContent>
      </TimelineContainer>
    );
  }

  const visibleCount = 1 + visibleTimelines.length; // 1 for main timeline + visible timelines

  return (
    <TimelineContainer>
      <TimelineHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <TimelineVisibilityDropdown data-dropdown>
            <DropdownButton onClick={() => setDropdownOpen(!dropdownOpen)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              {visibleCount} visible timeline{visibleCount !== 1 ? 's' : ''}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </DropdownButton>
            <DropdownMenu $isOpen={dropdownOpen}>
              <DropdownItem>
                <input
                  type="checkbox"
                  checked={visibleTimelines.includes('zooms')}
                  onChange={() => toggleTimeline('zooms')}
                />
                Zooms
              </DropdownItem>
              <DropdownItem>
                <input
                  type="checkbox"
                  checked={visibleTimelines.includes('layouts')}
                  onChange={() => toggleTimeline('layouts')}
                />
                Camera Layouts
              </DropdownItem>
            </DropdownMenu>
          </TimelineVisibilityDropdown>
        </div>
        <ZoomControls
          onMouseEnter={() => setIsZoomHovered(true)}
          onMouseLeave={() => setIsZoomHovered(false)}
        >
          {isZoomHovered && <ZoomLabel>{formatVisibleTime()}</ZoomLabel>}
          <ZoomSliderContainer onMouseDown={handleSliderMouseDown}>
            <ZoomSliderTrack />
            <ZoomSliderThumb $position={zoomToSliderPosition()} />
          </ZoomSliderContainer>
        </ZoomControls>
      </TimelineHeader>

      <TimelineContent ref={timelineContentRef} onClick={handleTimelineClick}>
        <TracksContainer ref={tracksContainerRef}>
          <RulerContainer>
            <Ruler $zoom={zoom}>{rulerMarks}</Ruler>
          </RulerContainer>

          {tracks.map((track) => (
            <TrackRow
              key={track.id}
              $isDragOver={dragOverTrackId === track.id}
              onDragOver={(e) => handleTrackDragOver(e, track.id)}
              onDragLeave={handleTrackDragLeave}
              onDrop={(e) => handleTrackDrop(e, track.id)}
            >
              {track.clips.map((clip) => {
                const mediaItem = mediaItems.find((m) => m.id === clip.mediaItemId);
                return (
                  <ClipElement
                    key={clip.id}
                    $startTime={clip.startTime}
                    $duration={clip.duration}
                    $zoom={zoom}
                    $selected={selectedClipIds.includes(clip.id)}
                    onMouseDown={(e) => handleClipMouseDown(e, clip.id, clip)}
                  >
                    <ResizeHandle
                      $position="left"
                      onMouseDown={(e) => handleClipMouseDown(e, clip.id, clip, 'left')}
                    />
                    <ClipContent>
                      <ClipName>{mediaItem?.name || 'Unknown'}</ClipName>
                      <ClipDuration>{formatTime(clip.duration)}</ClipDuration>
                    </ClipContent>
                    <ResizeHandle
                      $position="right"
                      onMouseDown={(e) => handleClipMouseDown(e, clip.id, clip, 'right')}
                    />
                  </ClipElement>
                );
              })}
              <RowLabel>{track.name}</RowLabel>
            </TrackRow>
          ))}

          {visibleTimelines.includes('zooms') && (
            <AdditionalTimelineRow>
              <AdditionalTimelineTrack>
                {/* Sample zoom segments - these would come from state in real implementation */}
                <ZoomSegment $startTime={5} $duration={3} $zoom={zoom} />
                <ZoomSegment $startTime={15} $duration={2} $zoom={zoom} />
                <RowLabel>Zooms</RowLabel>
              </AdditionalTimelineTrack>
            </AdditionalTimelineRow>
          )}

          {visibleTimelines.includes('layouts') && (
            <AdditionalTimelineRow>
              <AdditionalTimelineTrack>
                {/* Sample layout segments - these would come from state in real implementation */}
                <LayoutSegment $startTime={0} $duration={10} $zoom={zoom}>
                  Fullscreen
                </LayoutSegment>
                <LayoutSegment $startTime={10} $duration={10} $zoom={zoom}>
                  Fullscreen
                </LayoutSegment>
                <RowLabel>Camera Layout</RowLabel>
              </AdditionalTimelineTrack>
            </AdditionalTimelineRow>
          )}

          <Playhead $position={currentTime} $zoom={zoom} />
        </TracksContainer>
      </TimelineContent>
    </TimelineContainer>
  );
};

export default Timeline;
