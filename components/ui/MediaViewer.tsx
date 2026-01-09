import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Share2, ZoomIn, ZoomOut, RotateCw, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { PinchZoomView } from './GestureHandler';

// ============================================
// Types
// ============================================

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  src: string;
  thumbnail?: string;
  alt?: string;
  width?: number;
  height?: number;
}

interface MediaViewerProps {
  items: MediaItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  showThumbnails?: boolean;
  enableDownload?: boolean;
  enableShare?: boolean;
  className?: string;
}

// ============================================
// MediaViewer Component
// ============================================

/**
 * MediaViewer - Full-screen media gallery with zoom
 *
 * Features:
 * - Pinch to zoom images
 * - Swipe to navigate
 * - Video playback
 * - Thumbnail strip
 * - Download and share
 *
 * Usage:
 * <MediaViewer
 *   items={[{ id: '1', type: 'image', src: '/photo.jpg' }]}
 *   isOpen={isOpen}
 *   onClose={() => setOpen(false)}
 * />
 */
const MediaViewer: React.FC<MediaViewerProps> = ({
  items,
  initialIndex = 0,
  isOpen,
  onClose,
  onIndexChange,
  showThumbnails = true,
  enableDownload = true,
  enableShare = true,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentItem = items[currentIndex];

  // Reset index when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setShowControls(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex]);

  // Auto-hide controls
  useEffect(() => {
    if (!showControls) return;

    controlsTimeoutRef.current = setTimeout(() => {
      if (!isZoomed) {
        setShowControls(false);
      }
    }, 3000);

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isZoomed]);

  // Navigate to item
  const goTo = useCallback(
    (index: number) => {
      const newIndex = Math.max(0, Math.min(items.length - 1, index));
      setCurrentIndex(newIndex);
      onIndexChange?.(newIndex);
      triggerHaptic('selection');
    },
    [items.length, onIndexChange]
  );

  const goNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      goTo(currentIndex + 1);
    }
  }, [currentIndex, items.length, goTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      goTo(currentIndex - 1);
    }
  }, [currentIndex, goTo]);

  // Toggle controls
  const toggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
        case 'ArrowRight':
          goNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goNext, goPrev]);

  // Handle swipe
  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (isZoomed) return;

      if (direction === 'left') {
        goNext();
      } else {
        goPrev();
      }
    },
    [isZoomed, goNext, goPrev]
  );

  // Download current media
  const handleDownload = useCallback(async () => {
    if (!currentItem) return;

    try {
      const response = await fetch(currentItem.src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `media-${currentItem.id}.${currentItem.type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerHaptic('success');
    } catch (error) {
      console.error('Download failed:', error);
      triggerHaptic('error');
    }
  }, [currentItem]);

  // Share current media
  const handleShare = useCallback(async () => {
    if (!currentItem || !navigator.share) return;

    try {
      await navigator.share({
        title: currentItem.alt || 'Compartir media',
        url: currentItem.src,
      });
      triggerHaptic('success');
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  }, [currentItem]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-black ${className}`}>
      {/* Main content */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        onClick={toggleControls}
      >
        {currentItem?.type === 'image' ? (
          <PinchZoomView
            minScale={1}
            maxScale={5}
            onScaleChange={(scale) => setIsZoomed(scale > 1.1)}
            className="w-full h-full flex items-center justify-center"
          >
            <img
              src={currentItem.src}
              alt={currentItem.alt || ''}
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          </PinchZoomView>
        ) : currentItem?.type === 'video' ? (
          <VideoPlayer src={currentItem.src} />
        ) : null}
      </div>

      {/* Top bar */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-white text-sm font-medium">
          {currentIndex + 1} / {items.length}
        </div>

        <div className="flex items-center gap-2">
          {enableDownload && (
            <button
              onClick={handleDownload}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <Download size={20} />
            </button>
          )}
          {enableShare && navigator.share && (
            <button
              onClick={handleShare}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <Share2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation arrows */}
      {items.length > 1 && !isZoomed && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            disabled={currentIndex === 0}
            className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full transition-all ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            } ${currentIndex === 0 ? 'opacity-30' : 'hover:bg-black/70'}`}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            disabled={currentIndex === items.length - 1}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full transition-all ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            } ${currentIndex === items.length - 1 ? 'opacity-30' : 'hover:bg-black/70'}`}
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {showThumbnails && items.length > 1 && (
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(index);
                }}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                  index === currentIndex
                    ? 'ring-2 ring-white scale-110'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={item.thumbnail || item.src}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {item.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play size={16} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// VideoPlayer Component
// ============================================

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  autoPlay = false,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
    triggerHaptic('impact');
  }, [isPlaying]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;

    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    triggerHaptic('selection');
  }, [isMuted]);

  // Update progress
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    setProgress(videoRef.current.currentTime);
  }, []);

  // Seek
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setProgress(time);
  }, []);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-hide controls
  useEffect(() => {
    if (!showControls || !isPlaying) return;

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center ${className}`}
      onClick={() => setShowControls(true)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={isMuted}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        className="max-w-full max-h-full"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      />

      {/* Play button overlay */}
      {!isPlaying && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/30"
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center">
            <Play size={36} className="text-gray-900 ml-1" />
          </div>
        </button>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={progress}
          onChange={handleSeek}
          className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
        />

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2 text-white hover:bg-white/20 rounded-full"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button
              onClick={toggleMute}
              className="p-2 text-white hover:bg-white/20 rounded-full"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <span className="text-white text-sm">
              {formatTime(progress)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ImagePreview - Simple image with lightbox
// ============================================

interface ImagePreviewProps {
  src: string;
  alt?: string;
  className?: string;
  enableZoom?: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt = '',
  className = '',
  enableZoom = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`cursor-pointer ${className}`}
        onClick={() => enableZoom && setIsOpen(true)}
      />

      {enableZoom && (
        <MediaViewer
          items={[{ id: '1', type: 'image', src, alt }]}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          showThumbnails={false}
        />
      )}
    </>
  );
};

// ============================================
// useMediaViewer Hook
// ============================================

export const useMediaViewer = (items: MediaItem[]) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const open = useCallback((index: number = 0) => {
    setCurrentIndex(index);
    setIsOpen(true);
    triggerHaptic('light');
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    currentIndex,
    open,
    close,
    props: {
      items,
      initialIndex: currentIndex,
      isOpen,
      onClose: close,
      onIndexChange: setCurrentIndex,
    },
  };
};

export default MediaViewer;
