import React, { useState, useEffect, useRef } from 'react';
import { ImageOff } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string;
  blurHash?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  threshold?: number;
  rootMargin?: string;
}

// Generate a simple blur placeholder color from the image URL
const generatePlaceholderColor = (src: string): string => {
  let hash = 0;
  for (let i = 0; i < src.length; i++) {
    hash = src.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 40%, 85%)`;
};

// Generate a simple SVG blur placeholder
const generateBlurSVG = (color: string): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <filter id="blur" x="0" y="0">
          <feGaussianBlur in="SourceGraphic" stdDeviation="20"/>
        </filter>
      </defs>
      <rect fill="${color}" width="100" height="100" filter="url(#blur)"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg.trim())}`;
};

/**
 * LazyImage - Image component with lazy loading and blur placeholder
 *
 * Features:
 * - Intersection Observer for lazy loading
 * - Blur placeholder while loading
 * - Error state with fallback
 * - Smooth fade-in animation
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholderSrc,
  width,
  height,
  aspectRatio,
  objectFit = 'cover',
  fallback,
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const placeholderColor = generatePlaceholderColor(src);
  const blurPlaceholder = placeholderSrc || generateBlurSVG(placeholderColor);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  // Preload image when in view
  useEffect(() => {
    if (!isInView || hasError) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    img.onerror = () => {
      setHasError(true);
      onError?.();
    };
  }, [isInView, src, hasError, onLoad, onError]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : undefined,
    aspectRatio: aspectRatio || (height ? undefined : '1'),
    backgroundColor: placeholderColor,
  };

  if (hasError) {
    return (
      <div
        ref={containerRef}
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={containerStyle}
      >
        {fallback || (
          <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
            <ImageOff size={24} />
            <span className="text-xs">Error al cargar</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`} style={containerStyle}>
      {/* Blur Placeholder */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          backgroundImage: `url(${blurPlaceholder})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(10px)',
          transform: 'scale(1.1)',
        }}
      />

      {/* Shimmer loading animation */}
      {!isLoaded && (
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
        </div>
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectFit }}
          loading="lazy"
        />
      )}
    </div>
  );
};

/**
 * Avatar - Lazy loading avatar component
 */
interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  online?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  showBorder = false,
  online,
}) => {
  const [hasError, setHasError] = useState(false);
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate consistent color from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  const bgColor = `hsl(${hue}, 70%, 80%)`;
  const textColor = `hsl(${hue}, 70%, 30%)`;

  if (!src || hasError) {
    return (
      <div className="relative inline-block">
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold ${
            showBorder ? 'ring-2 ring-white dark:ring-gray-800' : ''
          } ${className}`}
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          {initials}
        </div>
        {online !== undefined && (
          <span
            className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-800 ${
              online ? 'bg-green-500' : 'bg-gray-400'
            } ${size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'}`}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <img
        src={src}
        alt={name}
        onError={() => setHasError(true)}
        className={`${sizeClasses[size]} rounded-full object-cover ${
          showBorder ? 'ring-2 ring-white dark:ring-gray-800' : ''
        } ${className}`}
      />
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-800 ${
            online ? 'bg-green-500' : 'bg-gray-400'
          } ${size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'}`}
        />
      )}
    </div>
  );
};

/**
 * ImageGallery - Lazy loading image gallery with lightbox
 */
interface ImageGalleryProps {
  images: string[];
  columns?: 2 | 3 | 4;
  gap?: number;
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  columns = 3,
  gap = 4,
  className = '',
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <>
      <div className={`grid ${gridCols[columns]} gap-${gap} ${className}`}>
        {images.map((src, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className="relative overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-oaxaca-pink"
          >
            <LazyImage
              src={src}
              alt={`Image ${index + 1}`}
              aspectRatio="1"
              className="w-full"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
            onClick={() => setSelectedIndex(null)}
          >
            ✕
          </button>

          <img
            src={images[selectedIndex]}
            alt={`Image ${selectedIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 hover:bg-white/10 rounded-full disabled:opacity-30"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) => (prev! > 0 ? prev! - 1 : images.length - 1));
                }}
              >
                ‹
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 hover:bg-white/10 rounded-full disabled:opacity-30"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) => (prev! < images.length - 1 ? prev! + 1 : 0));
                }}
              >
                ›
              </button>
            </>
          )}

          {/* Dots indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === selectedIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default LazyImage;
