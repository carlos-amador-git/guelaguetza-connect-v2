import React, { useState, useRef, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  pullThreshold?: number;
  maxPull?: number;
  className?: string;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  disabled = false,
  pullThreshold = 80,
  maxPull = 120,
  className = '',
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const canPull = useCallback(() => {
    if (disabled || isRefreshing) return false;
    const container = containerRef.current;
    if (!container) return false;
    return container.scrollTop <= 0;
  }, [disabled, isRefreshing]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!canPull()) return;
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
  }, [canPull]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!canPull() && !isPulling) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      setIsPulling(true);
      // Apply resistance to make it feel natural
      const resistance = 0.5;
      const newPullDistance = Math.min(diff * resistance, maxPull);
      setPullDistance(newPullDistance);

      // Prevent default scroll behavior when pulling
      if (containerRef.current?.scrollTop === 0) {
        e.preventDefault();
      }
    }
  }, [canPull, isPulling, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= pullThreshold) {
      setIsRefreshing(true);
      setPullDistance(50); // Keep a small amount visible during refresh

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, pullThreshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / pullThreshold, 1);
  const rotation = progress * 180;
  const scale = 0.5 + progress * 0.5;

  return (
    <div className={`relative ${className}`}>
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center overflow-hidden transition-all duration-100 ease-out z-10"
        style={{
          height: pullDistance,
          top: 0,
        }}
      >
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg transition-all ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          style={{
            transform: `scale(${scale}) rotate(${isRefreshing ? 0 : rotation}deg)`,
            opacity: progress,
          }}
        >
          <RefreshCw
            className={`w-5 h-5 ${
              pullDistance >= pullThreshold
                ? 'text-oaxaca-pink'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          />
        </div>
      </div>

      {/* Text indicator */}
      {pullDistance > 20 && (
        <div
          className="absolute left-0 right-0 text-center text-xs text-gray-500 dark:text-gray-400 transition-opacity z-10"
          style={{
            top: pullDistance + 4,
            opacity: progress,
          }}
        >
          {isRefreshing
            ? 'Actualizando...'
            : pullDistance >= pullThreshold
            ? 'Suelta para actualizar'
            : 'Desliza para actualizar'}
        </div>
      )}

      {/* Scrollable content */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto overscroll-contain"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Alternative: Refreshable wrapper that can be used with any scrollable container
interface RefreshableProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
}

export const RefreshIndicator: React.FC<{ isRefreshing: boolean }> = ({ isRefreshing }) => {
  if (!isRefreshing) return null;

  return (
    <div className="flex items-center justify-center py-4">
      <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-lg">
        <RefreshCw className="w-4 h-4 text-oaxaca-pink animate-spin" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Actualizando...</span>
      </div>
    </div>
  );
};

// Simple refresh button for desktop/fallback
interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ onRefresh, isRefreshing }) => {
  return (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
      aria-label="Actualizar"
    >
      <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
    </button>
  );
};

export default PullToRefresh;
