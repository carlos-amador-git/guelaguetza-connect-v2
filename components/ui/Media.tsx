import React from 'react';

// ============================================
// Image with Loading State
// ============================================

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  aspectRatio?: '1/1' | '4/3' | '16/9' | '3/2' | '2/3' | 'auto';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showSkeleton?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239CA3AF"%3E%3Cpath d="M4 5h13v7h2V5c0-1.103-.897-2-2-2H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h8v-2H4V5z"%3E%3C/path%3E%3Cpath d="M8 11l-3 4h11l-4-6-3 4z"%3E%3C/path%3E%3Cpath d="M19 14h-2v3h-3v2h3v3h2v-3h3v-2h-3z"%3E%3C/path%3E%3C/svg%3E';

export const Image: React.FC<ImageProps> = ({
  src,
  alt = '',
  fallback = fallbackImage,
  aspectRatio = 'auto',
  objectFit = 'cover',
  rounded = 'none',
  showSkeleton = true,
  className = '',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const aspectRatios = {
    '1/1': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-video',
    '3/2': 'aspect-[3/2]',
    '2/3': 'aspect-[2/3]',
    'auto': '',
  };

  const objectFits = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  return (
    <div className={`relative overflow-hidden ${aspectRatios[aspectRatio]} ${roundedClasses[rounded]} ${className}`}>
      {showSkeleton && isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      <img
        src={hasError ? fallback : src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`
          w-full h-full ${objectFits[objectFit]} ${roundedClasses[rounded]}
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-300
        `}
        {...props}
      />
    </div>
  );
};

// ============================================
// Image Gallery
// ============================================

interface GalleryImage {
  src: string;
  alt?: string;
  thumbnail?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  aspectRatio?: '1/1' | '4/3' | '16/9';
  showCount?: boolean;
  maxVisible?: number;
  onImageClick?: (index: number) => void;
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  columns = 3,
  gap = 'md',
  aspectRatio = '1/1',
  showCount = true,
  maxVisible,
  onImageClick,
  className = '',
}) => {
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  const gaps = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-4',
  };

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  const visibleImages = maxVisible ? images.slice(0, maxVisible) : images;
  const hiddenCount = maxVisible ? Math.max(0, images.length - maxVisible) : 0;

  const handleImageClick = (index: number) => {
    if (onImageClick) {
      onImageClick(index);
    } else {
      setLightboxIndex(index);
    }
  };

  return (
    <>
      <div className={`grid ${gridCols[columns]} ${gaps[gap]} ${className}`}>
        {visibleImages.map((image, index) => (
          <button
            key={index}
            onClick={() => handleImageClick(index)}
            className="relative group overflow-hidden rounded-xl"
          >
            <Image
              src={image.thumbnail || image.src}
              alt={image.alt || `Imagen ${index + 1}`}
              aspectRatio={aspectRatio}
              rounded="xl"
              className="transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

            {showCount && index === visibleImages.length - 1 && hiddenCount > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+{hiddenCount}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Simple Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
};

// ============================================
// Lightbox
// ============================================

interface LightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  images,
  currentIndex,
  onClose,
  onNavigate,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onNavigate(Math.max(0, currentIndex - 1));
          break;
        case 'ArrowRight':
          onNavigate(Math.min(images.length - 1, currentIndex + 1));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [currentIndex, images.length, onClose, onNavigate]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Cerrar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 text-white/80 text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Previous button */}
      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Anterior"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Image */}
      <img
        src={images[currentIndex].src}
        alt={images[currentIndex].alt || ''}
        className="max-w-full max-h-full object-contain"
      />

      {/* Next button */}
      {currentIndex < images.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Siguiente"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => onNavigate(index)}
              className={`
                w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all
                ${index === currentIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}
              `}
            >
              <img
                src={image.thumbnail || image.src}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// Video Player
// ============================================

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  aspectRatio?: '16/9' | '4/3' | '1/1' | '9/16';
  rounded?: 'none' | 'md' | 'lg' | 'xl' | '2xl';
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  autoPlay = false,
  muted = false,
  loop = false,
  controls = true,
  aspectRatio = '16/9',
  rounded = 'xl',
  onPlay,
  onPause,
  onEnded,
  className = '',
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(autoPlay);
  const [showCustomControls, setShowCustomControls] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);

  const aspectRatios = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
    '9/16': 'aspect-[9/16]',
  };

  const roundedClasses = {
    none: '',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = (parseFloat(e.target.value) / 100) * duration;
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`relative ${aspectRatios[aspectRatio]} ${roundedClasses[rounded]} overflow-hidden bg-black group ${className}`}
      onMouseEnter={() => !controls && setShowCustomControls(true)}
      onMouseLeave={() => !controls && setShowCustomControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        controls={controls}
        playsInline
        onPlay={() => {
          setIsPlaying(true);
          onPlay?.();
        }}
        onPause={() => {
          setIsPlaying(false);
          onPause?.();
        }}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className="w-full h-full object-contain"
      />

      {/* Custom Controls Overlay */}
      {!controls && (
        <>
          {/* Play/Pause overlay button */}
          <button
            onClick={togglePlay}
            className={`
              absolute inset-0 flex items-center justify-center
              ${showCustomControls || !isPlaying ? 'opacity-100' : 'opacity-0'}
              transition-opacity
            `}
          >
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
              {isPlaying ? (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          </button>

          {/* Progress bar */}
          <div className={`
            absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent
            ${showCustomControls ? 'opacity-100' : 'opacity-0'}
            transition-opacity
          `}>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
            <div className="flex justify-between text-xs text-white/80 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// Audio Player
// ============================================

interface AudioPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  cover?: string;
  autoPlay?: boolean;
  showWaveform?: boolean;
  variant?: 'full' | 'compact' | 'minimal';
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  artist,
  cover,
  autoPlay = false,
  variant = 'full',
  onPlay,
  onPause,
  onEnded,
  className = '',
}) => {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(autoPlay);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const time = (parseFloat(e.target.value) / 100) * duration;
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 1;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <audio
          ref={audioRef}
          src={src}
          autoPlay={autoPlay}
          onPlay={() => { setIsPlaying(true); onPlay?.(); }}
          onPause={() => { setIsPlaying(false); onPause?.(); }}
          onEnded={() => { setIsPlaying(false); onEnded?.(); }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-oaxaca-pink text-white flex items-center justify-center hover:bg-oaxaca-pink/90 transition-colors"
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl ${className}`}>
        <audio
          ref={audioRef}
          src={src}
          autoPlay={autoPlay}
          onPlay={() => { setIsPlaying(true); onPlay?.(); }}
          onPause={() => { setIsPlaying(false); onPause?.(); }}
          onEnded={() => { setIsPlaying(false); onEnded?.(); }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />

        {cover && (
          <img src={cover} alt="" className="w-12 h-12 rounded-lg object-cover" />
        )}

        <div className="flex-1 min-w-0">
          {title && <p className="font-medium text-gray-900 dark:text-white truncate">{title}</p>}
          {artist && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{artist}</p>}
        </div>

        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-oaxaca-pink text-white flex items-center justify-center hover:bg-oaxaca-pink/90 transition-colors flex-shrink-0"
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-4 ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        autoPlay={autoPlay}
        onPlay={() => { setIsPlaying(true); onPlay?.(); }}
        onPause={() => { setIsPlaying(false); onPause?.(); }}
        onEnded={() => { setIsPlaying(false); onEnded?.(); }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Cover and Info */}
      <div className="flex items-center gap-4 mb-4">
        {cover && (
          <img src={cover} alt="" className="w-16 h-16 rounded-xl object-cover" />
        )}
        <div className="flex-1 min-w-0">
          {title && <h3 className="font-semibold text-gray-900 dark:text-white truncate">{title}</h3>}
          {artist && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{artist}</p>}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max="100"
          value={progress || 0}
          onChange={handleSeek}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-oaxaca-pink [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Volume */}
        <div className="flex items-center gap-2">
          <button onClick={toggleMute} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            {isMuted || volume === 0 ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-gray-500 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>

        {/* Play Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = Math.max(0, currentTime - 10);
              }
            }}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8zm-1.1 11H10v-3.3L9 13v-.7l1.8-.6h.1V16z" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-oaxaca-pink text-white flex items-center justify-center hover:bg-oaxaca-pink/90 transition-colors shadow-lg"
          >
            {isPlaying ? (
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = Math.min(duration, currentTime + 10);
              }
            }}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8zm-1.1 11H10v-3.3L9 13v-.7l1.8-.6h.1V16z" />
            </svg>
          </button>
        </div>

        {/* Placeholder for right side symmetry */}
        <div className="w-24" />
      </div>
    </div>
  );
};

// ============================================
// Avatar Upload
// ============================================

interface AvatarUploadProps {
  src?: string;
  onChange: (file: File) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  disabled?: boolean;
  loading?: boolean;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  src,
  onChange,
  size = 'lg',
  shape = 'circle',
  disabled = false,
  loading = false,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = '',
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
  };

  const handleClick = () => {
    if (!disabled && !loading) {
      inputRef.current?.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate type
    if (!acceptedTypes.includes(file.type)) {
      setError('Formato de archivo no soportado');
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`El archivo debe ser menor a ${maxSizeMB}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onChange(file);
  };

  const displaySrc = preview || src;

  return (
    <div className={className}>
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={`
          ${sizes[size]}
          ${shape === 'circle' ? 'rounded-full' : 'rounded-xl'}
          relative overflow-hidden bg-gray-100 dark:bg-gray-800
          border-2 border-dashed border-gray-300 dark:border-gray-600
          hover:border-oaxaca-pink dark:hover:border-oaxaca-pink
          transition-colors group
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {displaySrc ? (
          <img
            src={displaySrc}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <svg className="w-1/3 h-1/3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}

        {/* Overlay */}
        <div className={`
          absolute inset-0 bg-black/50 flex items-center justify-center
          ${loading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          transition-opacity
        `}>
          {loading ? (
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
};

// ============================================
// File Preview
// ============================================

interface FilePreviewProps {
  file: {
    name: string;
    size: number;
    type: string;
    url?: string;
  };
  onRemove?: () => void;
  onDownload?: () => void;
  showSize?: boolean;
  className?: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) {
    return (
      <svg className="w-full h-full text-oaxaca-sky" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
      </svg>
    );
  }
  if (type.startsWith('video/')) {
    return (
      <svg className="w-full h-full text-oaxaca-purple" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
      </svg>
    );
  }
  if (type.startsWith('audio/')) {
    return (
      <svg className="w-full h-full text-green-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
      </svg>
    );
  }
  if (type === 'application/pdf') {
    return (
      <svg className="w-full h-full text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" />
      </svg>
    );
  }
  return (
    <svg className="w-full h-full text-gray-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </svg>
  );
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onRemove,
  onDownload,
  showSize = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl ${className}`}>
      <div className="w-10 h-10 flex-shrink-0">
        {getFileIcon(file.type)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
        {showSize && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        {onDownload && (
          <button
            onClick={onDownload}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            aria-label="Descargar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
            aria-label="Eliminar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
