import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { useEditorStore } from '../store';
import VideoPlayer from './VideoPlayer';
import Timeline from './Timeline';
import MediaLibrary from './MediaLibrary';
import ExportPanel from './ExportPanel';
import { PlayIcon, PauseIcon } from './Icons';

const EditorContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.header`
  height: 60px;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 10;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  border: none;
  outline: none;

  ${({ $variant = 'secondary', theme }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: ${theme.colors.accent.primary};
          color: ${theme.colors.text.primary};

          &:hover {
            background: ${theme.colors.accent.hover};
            box-shadow: ${theme.shadows.glow};
          }
        `;
      case 'danger':
        return `
          background: ${theme.colors.status.recording};
          color: ${theme.colors.text.primary};

          &:hover {
            opacity: 0.9;
          }
        `;
      default:
        return `
          background: ${theme.colors.background.tertiary};
          color: ${theme.colors.text.primary};
          border: 1px solid ${theme.colors.border.primary};

          &:hover {
            background: ${theme.colors.background.glass};
            border-color: ${theme.colors.border.accent};
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const LeftPanelWrapper = styled.div<{ $collapsed: boolean }>`
  position: relative;
  display: flex;
  width: ${({ $collapsed }) => ($collapsed ? '0' : '280px')};
  transition: width ${({ theme }) => theme.transitions.normal};
`;

const LeftPanel = styled.aside`
  width: 280px;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-right: 1px solid ${({ theme }) => theme.colors.border.primary};
  overflow-y: auto;
  position: relative;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background.tertiary};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border.primary};
    border-radius: 3px;

    &:hover {
      background: ${({ theme }) => theme.colors.border.accent};
    }
  }
`;

const TogglePanelButton = styled.button<{ $collapsed: boolean }>`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 28px;
  height: 28px;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.background.glass};
    border-color: ${({ theme }) => theme.colors.accent.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    transform: scale(1.1);
  }

  svg {
    width: 16px;
    height: 16px;
    transition: transform ${({ theme }) => theme.transitions.fast};
    transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
  }
`;

const ExpandButton = styled.button`
  position: absolute;
  top: 16px;
  left: 12px;
  width: 32px;
  height: 32px;
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  transition: all ${({ theme }) => theme.transitions.fast};
  box-shadow: ${({ theme }) => theme.shadows.md};

  &:hover {
    background: ${({ theme }) => theme.colors.background.tertiary};
    border-color: ${({ theme }) => theme.colors.accent.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    transform: scale(1.1);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const CenterContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PreviewArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background.primary};
  padding: 24px;
  overflow: auto;
`;

const TimelineArea = styled.div`
  height: 280px;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-top: 1px solid ${({ theme }) => theme.colors.border.primary};
  display: flex;
  flex-direction: column;
`;

const PlaybackControls = styled.div`
  height: 60px;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-top: 1px solid ${({ theme }) => theme.colors.border.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 0 24px;
`;

const TimeDisplay = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  min-width: 140px;
  text-align: center;
`;

const IconButton = styled.button<{ $active?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.accent.primary : theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ $active, theme }) =>
      $active ? theme.colors.accent.hover : theme.colors.background.tertiary};
    border-color: ${({ theme }) => theme.colors.border.accent};
    box-shadow: ${({ $active, theme }) => ($active ? theme.shadows.glow : 'none')};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  gap: 16px;
  padding: 48px;
  text-align: center;

  h2 {
    font-size: 24px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0;
  }

  p {
    font-size: 14px;
    margin: 0;
    max-width: 400px;
  }
`;

const VideoEditor: React.FC = () => {
  const {
    currentTime,
    isPlaying,
    duration,
    mediaItems,
    tracks,
    selectedClipIds,
    setIsPlaying,
    addMediaItem,
    addTrack,
    addClip,
    removeClip,
  } = useEditorStore();

  const [showExportPanel, setShowExportPanel] = useState(false);
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(false);
  const hasLoadedRecording = useRef(false);

  useEffect(() => {
    // Load pending recording if exists - only run once
    if (hasLoadedRecording.current) {
      return;
    }
    hasLoadedRecording.current = true;

    const loadPendingRecording = async () => {
      const recordingData = await window.electronAPI.getPendingRecording();
      if (recordingData) {
        console.log('Loading recording:', recordingData.filePath);

        // Wait a bit to ensure file is fully written and closed
        await new Promise(resolve => setTimeout(resolve, 300));

        // Generate thumbnail
        let thumbnail: string | undefined;
        try {
          console.log('Requesting thumbnail generation...');
          thumbnail = await window.electronAPI.generateThumbnail(recordingData.filePath);
          console.log('Thumbnail generated successfully');
        } catch (error) {
          console.error('Failed to generate thumbnail:', error);
        }

        // Add to media library
        const mediaItem = {
          id: `media-${Date.now()}`,
          name: recordingData.name,
          type: recordingData.type as 'video' | 'audio' | 'image',
          filePath: recordingData.filePath,
          duration: recordingData.duration,
          width: recordingData.width,
          height: recordingData.height,
          fileSize: recordingData.fileSize,
          thumbnail,
        };

        addMediaItem(mediaItem);

        // Automatically add to timeline
        const newTrack = {
          id: `track-${Date.now()}`,
          type: 'video' as const,
          name: 'Video 1',
          clips: [],
          locked: false,
          visible: true,
        };

        addTrack(newTrack);

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
      }
    };

    loadPendingRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected clips with Backspace or Delete key
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedClipIds.length > 0) {
        // Prevent default browser back navigation on Backspace
        e.preventDefault();

        // Delete all selected clips
        selectedClipIds.forEach((clipId) => {
          removeClip(clipId);
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipIds, removeClip]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const hasContent = mediaItems.length > 0 || tracks.length > 0;

  return (
    <EditorContainer>
      <Header>
        <Title>Clip Forge Editor</Title>
        <HeaderActions>
          <Button onClick={() => window.electronAPI.importMediaFiles()}>
            Import Media
          </Button>
          <Button
            $variant="primary"
            onClick={() => setShowExportPanel(true)}
            disabled={!hasContent}
          >
            Export
          </Button>
        </HeaderActions>
      </Header>

      <MainContent>
        {isLibraryCollapsed && (
          <ExpandButton
            onClick={() => setIsLibraryCollapsed(false)}
            title="Show Media Library"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </ExpandButton>
        )}
        <LeftPanelWrapper $collapsed={isLibraryCollapsed}>
          <LeftPanel>
            <MediaLibrary />
            <TogglePanelButton
              $collapsed={isLibraryCollapsed}
              onClick={() => setIsLibraryCollapsed(true)}
              title="Hide Media Library"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </TogglePanelButton>
          </LeftPanel>
        </LeftPanelWrapper>

        <CenterContent>
          <PreviewArea>
            {hasContent ? (
              <VideoPlayer />
            ) : (
              <EmptyState>
                <h2>No Media Yet</h2>
                <p>
                  Import video clips, audio, or images to start editing your project
                </p>
                <Button $variant="primary" onClick={() => window.electronAPI.importMediaFiles()}>
                  Import Media
                </Button>
              </EmptyState>
            )}
          </PreviewArea>

          <TimelineArea>
            <PlaybackControls>
              <TimeDisplay>
                {formatTime(currentTime)} / {formatTime(duration)}
              </TimeDisplay>
              <IconButton $active={isPlaying} onClick={handlePlayPause}>
                {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
              </IconButton>
            </PlaybackControls>
            <Timeline />
          </TimelineArea>
        </CenterContent>
      </MainContent>

      {showExportPanel && <ExportPanel onClose={() => setShowExportPanel(false)} />}
    </EditorContainer>
  );
};

export default VideoEditor;
