import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useEditorStore } from '../store';

const PlayerContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const VideoWrapper = styled.div`
  position: relative;
  background: #000;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
`;

const Video = styled.video`
  width: 100%;
  height: auto;
  display: block;
`;

const VideoOverlay = styled.div<{ $show: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  pointer-events: ${({ $show }) => ($show ? 'auto' : 'none')};
  transition: opacity ${({ theme }) => theme.transitions.fast};
`;

const PlayButton = styled.button`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent.primary};
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  box-shadow: ${({ theme }) => theme.shadows.glow};

  &:hover {
    transform: scale(1.1);
    background: ${({ theme }) => theme.colors.accent.hover};
    box-shadow: ${({ theme }) => theme.shadows.glowLg};
  }

  svg {
    margin-left: 4px;
  }
`;

const PlayerInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 13px;
  padding: 0 8px;
`;

const EmptyPlayer = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 2px dashed ${({ theme }) => theme.colors.border.primary};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: ${({ theme }) => theme.colors.text.muted};

  svg {
    width: 64px;
    height: 64px;
    opacity: 0.3;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
`;

const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  const {
    currentTime,
    isPlaying,
    tracks,
    mediaItems,
    setCurrentTime,
    setIsPlaying,
    setDuration,
  } = useEditorStore();

  // Get the current clip being played
  useEffect(() => {
    if (tracks.length === 0 || mediaItems.length === 0) {
      setVideoSrc(null);
      return;
    }

    // Find the first video track
    const videoTrack = tracks.find((t) => t.type === 'video' && t.visible);
    if (!videoTrack) {
      setVideoSrc(null);
      return;
    }

    // Find clip at current time
    const currentClip = videoTrack.clips.find(
      (clip) =>
        currentTime >= clip.startTime &&
        currentTime < clip.startTime + clip.duration
    );

    if (!currentClip) {
      setVideoSrc(null);
      return;
    }

    // Find media item
    const mediaItem = mediaItems.find((item) => item.id === currentClip.mediaItemId);
    if (mediaItem && mediaItem.type === 'video') {
      // Use custom protocol to access local files
      setVideoSrc(`media-file://${mediaItem.filePath}`);
    }
  }, [currentTime, tracks, mediaItems]);

  // Handle play/pause
  useEffect(() => {
    if (!videoRef.current || !videoSrc) return;

    if (isPlaying) {
      videoRef.current.play().catch((err) => {
        console.error('Failed to play video:', err);
        setIsPlaying(false);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, videoSrc, setIsPlaying]);

  // Sync current time with video
  useEffect(() => {
    if (!videoRef.current || !videoSrc) return;

    const video = videoRef.current;
    const handleTimeUpdate = () => {
      // Sync with timeline
      if (Math.abs(video.currentTime - currentTime) > 0.1) {
        setCurrentTime(video.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    // Set initial time
    video.currentTime = currentTime;

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoSrc, currentTime, setCurrentTime, setDuration, setIsPlaying]);

  const handleVideoClick = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMouseEnter = () => {
    if (!isPlaying && videoSrc) {
      setShowOverlay(true);
    }
  };

  const handleMouseLeave = () => {
    setShowOverlay(false);
  };

  if (!videoSrc) {
    return (
      <PlayerContainer>
        <EmptyPlayer>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <p>No video to preview</p>
          <p>Add clips to the timeline to see preview</p>
        </EmptyPlayer>
      </PlayerContainer>
    );
  }

  return (
    <PlayerContainer>
      <VideoWrapper
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleVideoClick}
      >
        <Video ref={videoRef} src={videoSrc} />
        <VideoOverlay $show={showOverlay}>
          <PlayButton>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </PlayButton>
        </VideoOverlay>
      </VideoWrapper>
      <PlayerInfo>
        <span>Preview</span>
        <span>
          {tracks.length} track{tracks.length !== 1 ? 's' : ''} • {mediaItems.length} item
          {mediaItems.length !== 1 ? 's' : ''}
        </span>
      </PlayerInfo>
    </PlayerContainer>
  );
};

export default VideoPlayer;
