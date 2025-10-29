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
  gap: 8px;
  align-items: center;
`;

const ZoomButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => theme.colors.background.glass};
    border-color: ${({ theme }) => theme.colors.border.accent};
  }
`;

const ZoomLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  min-width: 60px;
  text-align: center;
`;

const TimelineContent = styled.div`
  flex: 1;
  display: flex;
  overflow: auto;

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

const TrackList = styled.div`
  width: 120px;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-right: 1px solid ${({ theme }) => theme.colors.border.primary};
  flex-shrink: 0;
`;

const TrackHeader = styled.div`
  height: 60px;
  padding: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
`;

const TrackName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TrackType = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
`;

const TracksContainer = styled.div`
  flex: 1;
  position: relative;
  background: ${({ theme }) => theme.colors.background.primary};
`;

const RulerContainer = styled.div`
  height: 30px;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  position: relative;
  overflow: hidden;
`;

const Ruler = styled.div<{ $zoom: number }>`
  height: 100%;
  position: relative;
  width: ${({ $zoom }) => $zoom * 100}px; /* 100 seconds visible */
`;

const RulerMark = styled.div<{ $position: number }>`
  position: absolute;
  left: ${({ $position }) => $position}px;
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
  font-size: 10px;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-left: 4px;
  font-family: 'Courier New', monospace;
`;

const TrackRow = styled.div<{ $isDragOver?: boolean }>`
  height: 60px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  position: relative;
  background: ${({ $isDragOver, theme }) =>
    $isDragOver ? `${theme.colors.accent.primary}10` : 'transparent'};
  transition: background ${({ theme }) => theme.transitions.fast};
`;

const ClipElement = styled.div<{
  $startTime: number;
  $duration: number;
  $zoom: number;
  $selected: boolean;
}>`
  position: absolute;
  left: ${({ $startTime, $zoom }) => $startTime * $zoom}px;
  width: ${({ $duration, $zoom }) => $duration * $zoom}px;
  height: 48px;
  top: 6px;
  background: ${({ $selected }) =>
    $selected ? '#e68a4d' : '#d97f43'};
  border: 2px solid
    ${({ $selected }) =>
      $selected ? '#f0a060' : '#d97f43'};
  border-radius: 12px;
  cursor: move;
  overflow: hidden;
  transition: all ${({ theme }) => theme.transitions.fast};
  box-shadow: ${({ theme }) => theme.shadows.md};

  &:hover {
    border-color: #f0a060;
    background: #e68a4d;
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

const Playhead = styled.div<{ $position: number; $zoom: number }>`
  position: absolute;
  left: ${({ $position, $zoom }) => $position * $zoom}px;
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

const AdditionalTimelineLabel = styled.div`
  width: 120px;
  height: 100%;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-right: 1px solid ${({ theme }) => theme.colors.border.primary};
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  flex-shrink: 0;
`;

const AdditionalTimelineTrack = styled.div`
  flex: 1;
  height: 100%;
  position: relative;
`;

const ZoomSegment = styled.div<{
  $startTime: number;
  $duration: number;
  $zoom: number;
}>`
  position: absolute;
  left: ${({ $startTime, $zoom }) => $startTime * $zoom}px;
  width: ${({ $duration, $zoom }) => $duration * $zoom}px;
  height: 24px;
  top: 8px;
  background: #6b7dff;
  border-radius: 8px;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: #7a8cff;
  }
`;

const LayoutSegment = styled.div<{
  $startTime: number;
  $duration: number;
  $zoom: number;
}>`
  position: absolute;
  left: ${({ $startTime, $zoom }) => $startTime * $zoom}px;
  width: ${({ $duration, $zoom }) => $duration * $zoom}px;
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
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent.primary};
  }
`;

type TimelineType = 'zooms' | 'layouts';

const Timeline: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [dragClipId, setDragClipId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [dragOverTrackId, setDragOverTrackId] = useState<string | null>(null);
  const [visibleTimelines, setVisibleTimelines] = useState<TimelineType[]>(['zooms', 'layouts']);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.5, 200));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.5, 10));
  };

  const handleClipMouseDown = (
    e: React.MouseEvent,
    clipId: string,
    clip: TimelineClip,
    resizeHandle?: 'left' | 'right'
  ) => {
    e.stopPropagation();

    if (resizeHandle) {
      setIsResizing(resizeHandle);
    } else {
      setIsDragging(true);
    }

    setDragClipId(clipId);
    setDragStartX(e.clientX);
    setDragStartTime(clip.startTime);
    setSelectedClips([clipId]);
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragClipId) return;

      const deltaX = e.clientX - dragStartX;
      const deltaTime = deltaX / zoom;

      // Find the clip
      let clip: TimelineClip | null = null;
      for (const track of tracks) {
        const found = track.clips.find((c: TimelineClip) => c.id === dragClipId);
        if (found) {
          clip = found;
          break;
        }
      }

      if (!clip) return;

      if (isDragging) {
        // Move clip
        const newStartTime = Math.max(0, dragStartTime + deltaTime);
        updateClip(dragClipId, { startTime: newStartTime });
      } else if (isResizing === 'left') {
        // Resize from left
        const newStartTime = Math.max(0, dragStartTime + deltaTime);
        const deltaStart = newStartTime - clip.startTime;
        const newDuration = clip.duration - deltaStart;

        if (newDuration > 0.1) {
          updateClip(dragClipId, {
            startTime: newStartTime,
            duration: newDuration,
            trimStart: clip.trimStart + deltaStart,
          });
        }
      } else if (isResizing === 'right') {
        // Resize from right
        const newDuration = Math.max(0.1, clip.duration + deltaTime);
        updateClip(dragClipId, { duration: newDuration });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
      setDragClipId(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDragging,
    isResizing,
    dragClipId,
    dragStartX,
    dragStartTime,
    zoom,
    tracks,
    updateClip,
  ]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / zoom;

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
          <ZoomControls>
            <ZoomButton onClick={handleZoomOut}>−</ZoomButton>
            <ZoomLabel>{Math.round(zoom)}px/s</ZoomLabel>
            <ZoomButton onClick={handleZoomIn}>+</ZoomButton>
          </ZoomControls>
        </TimelineHeader>
        <TimelineContent
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
                Layouts
              </DropdownItem>
            </DropdownMenu>
          </TimelineVisibilityDropdown>
        </div>
        <ZoomControls>
          <ZoomButton onClick={handleZoomOut}>−</ZoomButton>
          <ZoomLabel>{Math.round(zoom)}px/s</ZoomLabel>
          <ZoomButton onClick={handleZoomIn}>+</ZoomButton>
        </ZoomControls>
      </TimelineHeader>

      <TimelineContent>
        <TrackList>
          {tracks.map((track) => (
            <TrackHeader key={track.id}>
              <TrackName>{track.name}</TrackName>
              <TrackType>{track.type}</TrackType>
            </TrackHeader>
          ))}
          {visibleTimelines.includes('zooms') && (
            <AdditionalTimelineLabel>Zooms</AdditionalTimelineLabel>
          )}
          {visibleTimelines.includes('layouts') && (
            <AdditionalTimelineLabel>Layout</AdditionalTimelineLabel>
          )}
        </TrackList>

        <TracksContainer ref={containerRef} onClick={handleTimelineClick}>
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
            </TrackRow>
          ))}

          {visibleTimelines.includes('zooms') && (
            <AdditionalTimelineRow>
              <AdditionalTimelineTrack>
                {/* Sample zoom segments - these would come from state in real implementation */}
                <ZoomSegment $startTime={5} $duration={3} $zoom={zoom} />
                <ZoomSegment $startTime={15} $duration={2} $zoom={zoom} />
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
