import React, { useRef, useCallback, useEffect, useState } from 'react';
import { triggerHaptic } from '../../utils/haptics';

// ============================================
// Types
// ============================================

interface Point {
  x: number;
  y: number;
}

interface GestureState {
  startPoint: Point;
  currentPoint: Point;
  deltaX: number;
  deltaY: number;
  velocityX: number;
  velocityY: number;
  scale: number;
  rotation: number;
  isActive: boolean;
}

type GestureType = 'swipe' | 'pinch' | 'rotate' | 'pan' | 'longPress';

interface GestureCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchStart?: (scale: number) => void;
  onPinchMove?: (scale: number) => void;
  onPinchEnd?: (scale: number) => void;
  onPanStart?: (point: Point) => void;
  onPanMove?: (delta: Point, point: Point) => void;
  onPanEnd?: (velocity: Point) => void;
  onLongPress?: (point: Point) => void;
  onDoubleTap?: (point: Point) => void;
}

interface GestureHandlerProps extends GestureCallbacks {
  children: React.ReactNode;
  enabled?: boolean;
  swipeThreshold?: number;
  longPressDelay?: number;
  className?: string;
  style?: React.CSSProperties;
}

// ============================================
// Utility Functions
// ============================================

const getDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const getMidpoint = (p1: Point, p2: Point): Point => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
};

const getAngle = (p1: Point, p2: Point): number => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
};

// ============================================
// GestureHandler Component
// ============================================

/**
 * GestureHandler - Advanced touch gesture recognition
 *
 * Features:
 * - Swipe detection (4 directions)
 * - Pinch to zoom
 * - Pan/drag
 * - Long press
 * - Double tap
 *
 * Usage:
 * <GestureHandler
 *   onSwipeLeft={() => goBack()}
 *   onPinchMove={(scale) => setZoom(scale)}
 *   onLongPress={() => showMenu()}
 * >
 *   <YourContent />
 * </GestureHandler>
 */
const GestureHandler: React.FC<GestureHandlerProps> = ({
  children,
  enabled = true,
  swipeThreshold = 50,
  longPressDelay = 500,
  className = '',
  style,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinchStart,
  onPinchMove,
  onPinchEnd,
  onPanStart,
  onPanMove,
  onPanEnd,
  onLongPress,
  onDoubleTap,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<GestureState>({
    startPoint: { x: 0, y: 0 },
    currentPoint: { x: 0, y: 0 },
    deltaX: 0,
    deltaY: 0,
    velocityX: 0,
    velocityY: 0,
    scale: 1,
    rotation: 0,
    isActive: false,
  });

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const initialDistanceRef = useRef<number>(0);
  const initialScaleRef = useRef<number>(1);
  const lastMoveTimeRef = useRef<number>(0);
  const lastPointRef = useRef<Point>({ x: 0, y: 0 });

  // Clear long press timer
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;

      const touches = e.touches;
      const now = Date.now();

      // Double tap detection
      if (touches.length === 1) {
        const timeSinceLastTap = now - lastTapRef.current;
        if (timeSinceLastTap < 300 && onDoubleTap) {
          const touch = touches[0];
          onDoubleTap({ x: touch.clientX, y: touch.clientY });
          triggerHaptic('impact');
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;
      }

      // Single touch - pan/swipe
      if (touches.length === 1) {
        const touch = touches[0];
        const point = { x: touch.clientX, y: touch.clientY };

        gestureRef.current = {
          ...gestureRef.current,
          startPoint: point,
          currentPoint: point,
          deltaX: 0,
          deltaY: 0,
          isActive: true,
        };

        lastPointRef.current = point;
        lastMoveTimeRef.current = now;

        onPanStart?.(point);

        // Start long press timer
        if (onLongPress) {
          longPressTimerRef.current = setTimeout(() => {
            triggerHaptic('medium');
            onLongPress(point);
            gestureRef.current.isActive = false;
          }, longPressDelay);
        }
      }

      // Two touches - pinch
      if (touches.length === 2) {
        clearLongPressTimer();

        const p1 = { x: touches[0].clientX, y: touches[0].clientY };
        const p2 = { x: touches[1].clientX, y: touches[1].clientY };

        initialDistanceRef.current = getDistance(p1, p2);
        initialScaleRef.current = gestureRef.current.scale;

        onPinchStart?.(gestureRef.current.scale);
      }
    },
    [enabled, longPressDelay, onDoubleTap, onLongPress, onPanStart, onPinchStart, clearLongPressTimer]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !gestureRef.current.isActive) return;

      const touches = e.touches;
      const now = Date.now();

      // Cancel long press if moved
      clearLongPressTimer();

      // Single touch - pan
      if (touches.length === 1) {
        const touch = touches[0];
        const currentPoint = { x: touch.clientX, y: touch.clientY };
        const deltaTime = now - lastMoveTimeRef.current;

        const deltaX = currentPoint.x - gestureRef.current.startPoint.x;
        const deltaY = currentPoint.y - gestureRef.current.startPoint.y;

        // Calculate velocity
        const velocityX = deltaTime > 0 ? (currentPoint.x - lastPointRef.current.x) / deltaTime : 0;
        const velocityY = deltaTime > 0 ? (currentPoint.y - lastPointRef.current.y) / deltaTime : 0;

        gestureRef.current = {
          ...gestureRef.current,
          currentPoint,
          deltaX,
          deltaY,
          velocityX,
          velocityY,
        };

        lastPointRef.current = currentPoint;
        lastMoveTimeRef.current = now;

        onPanMove?.({ x: deltaX, y: deltaY }, currentPoint);
      }

      // Two touches - pinch
      if (touches.length === 2) {
        const p1 = { x: touches[0].clientX, y: touches[0].clientY };
        const p2 = { x: touches[1].clientX, y: touches[1].clientY };

        const currentDistance = getDistance(p1, p2);
        const scale = (currentDistance / initialDistanceRef.current) * initialScaleRef.current;

        gestureRef.current.scale = scale;
        onPinchMove?.(scale);
      }
    },
    [enabled, onPanMove, onPinchMove, clearLongPressTimer]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;

      clearLongPressTimer();

      const { deltaX, deltaY, velocityX, velocityY, isActive } = gestureRef.current;

      if (!isActive) return;

      // Check for swipe
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

      if (absX > swipeThreshold || absY > swipeThreshold || velocity > 0.5) {
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > swipeThreshold) {
            triggerHaptic('light');
            onSwipeRight?.();
          } else if (deltaX < -swipeThreshold) {
            triggerHaptic('light');
            onSwipeLeft?.();
          }
        } else {
          // Vertical swipe
          if (deltaY > swipeThreshold) {
            triggerHaptic('light');
            onSwipeDown?.();
          } else if (deltaY < -swipeThreshold) {
            triggerHaptic('light');
            onSwipeUp?.();
          }
        }
      }

      // End pan
      onPanEnd?.({ x: velocityX, y: velocityY });

      // End pinch if was pinching
      if (e.touches.length === 0 && initialDistanceRef.current > 0) {
        onPinchEnd?.(gestureRef.current.scale);
        initialDistanceRef.current = 0;
      }

      // Reset gesture state
      gestureRef.current = {
        ...gestureRef.current,
        isActive: false,
        deltaX: 0,
        deltaY: 0,
        velocityX: 0,
        velocityY: 0,
      };
    },
    [enabled, swipeThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onPanEnd, onPinchEnd, clearLongPressTimer]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, [clearLongPressTimer]);

  return (
    <div
      ref={containerRef}
      className={`touch-none ${className}`}
      style={style}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {children}
    </div>
  );
};

// ============================================
// SwipeBackNavigation - iOS-style swipe to go back
// ============================================

interface SwipeBackNavigationProps {
  children: React.ReactNode;
  onBack: () => void;
  enabled?: boolean;
  threshold?: number;
  edgeWidth?: number;
}

export const SwipeBackNavigation: React.FC<SwipeBackNavigationProps> = ({
  children,
  onBack,
  enabled = true,
  threshold = 100,
  edgeWidth = 20,
}) => {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isFromEdge, setIsFromEdge] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePanStart = useCallback(
    (point: Point) => {
      if (point.x <= edgeWidth) {
        setIsFromEdge(true);
      }
    },
    [edgeWidth]
  );

  const handlePanMove = useCallback(
    (delta: Point) => {
      if (!isFromEdge) return;

      const progress = Math.max(0, Math.min(1, delta.x / threshold));
      setSwipeProgress(progress);
    },
    [isFromEdge, threshold]
  );

  const handlePanEnd = useCallback(() => {
    if (swipeProgress > 0.5) {
      triggerHaptic('medium');
      onBack();
    }
    setSwipeProgress(0);
    setIsFromEdge(false);
  }, [swipeProgress, onBack]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <GestureHandler
      onPanStart={handlePanStart}
      onPanMove={handlePanMove}
      onPanEnd={handlePanEnd}
      className="relative overflow-hidden"
    >
      {/* Edge indicator */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-oaxaca-pink/50 to-transparent transition-opacity"
        style={{ opacity: swipeProgress }}
      />

      {/* Content with transform */}
      <div
        ref={containerRef}
        style={{
          transform: `translateX(${swipeProgress * 50}px)`,
          transition: swipeProgress === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>

      {/* Shadow overlay */}
      <div
        className="absolute inset-0 bg-black pointer-events-none transition-opacity"
        style={{ opacity: swipeProgress * 0.3 }}
      />
    </GestureHandler>
  );
};

// ============================================
// PinchZoomView - Pinch to zoom container
// ============================================

interface PinchZoomViewProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  onScaleChange?: (scale: number) => void;
  className?: string;
  doubleTapScale?: number;
}

export const PinchZoomView: React.FC<PinchZoomViewProps> = ({
  children,
  minScale = 1,
  maxScale = 4,
  initialScale = 1,
  onScaleChange,
  className = '',
  doubleTapScale = 2,
}) => {
  const [scale, setScale] = useState(initialScale);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);

  const handlePinchStart = useCallback(() => {
    setIsPinching(true);
  }, []);

  const handlePinchMove = useCallback(
    (newScale: number) => {
      const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
      setScale(clampedScale);
      onScaleChange?.(clampedScale);
    },
    [minScale, maxScale, onScaleChange]
  );

  const handlePinchEnd = useCallback(() => {
    setIsPinching(false);

    // Snap to min scale if close
    if (scale < minScale + 0.1) {
      setScale(minScale);
      setPosition({ x: 0, y: 0 });
      onScaleChange?.(minScale);
    }
  }, [scale, minScale, onScaleChange]);

  const handlePanMove = useCallback(
    (delta: Point) => {
      if (scale <= minScale) return;

      setPosition((prev) => ({
        x: prev.x + delta.x * 0.5,
        y: prev.y + delta.y * 0.5,
      }));
    },
    [scale, minScale]
  );

  const handleDoubleTap = useCallback(() => {
    if (scale > minScale) {
      // Reset zoom
      setScale(minScale);
      setPosition({ x: 0, y: 0 });
      onScaleChange?.(minScale);
    } else {
      // Zoom in
      setScale(doubleTapScale);
      onScaleChange?.(doubleTapScale);
    }
  }, [scale, minScale, doubleTapScale, onScaleChange]);

  return (
    <GestureHandler
      onPinchStart={handlePinchStart}
      onPinchMove={handlePinchMove}
      onPinchEnd={handlePinchEnd}
      onPanMove={handlePanMove}
      onDoubleTap={handleDoubleTap}
      className={`overflow-hidden ${className}`}
    >
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isPinching ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </GestureHandler>
  );
};

// ============================================
// useGesture Hook
// ============================================

export const useGesture = (callbacks: GestureCallbacks, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {};

  const bind = useCallback(() => {
    if (!enabled) return {};

    return {
      onTouchStart: (e: React.TouchEvent) => {
        // Implementation similar to GestureHandler
      },
      onTouchMove: (e: React.TouchEvent) => {
        // Implementation similar to GestureHandler
      },
      onTouchEnd: (e: React.TouchEvent) => {
        // Implementation similar to GestureHandler
      },
    };
  }, [enabled]);

  return bind;
};

export default GestureHandler;
