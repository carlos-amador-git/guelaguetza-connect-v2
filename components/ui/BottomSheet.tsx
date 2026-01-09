import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  defaultSnapPoint?: number;
  enableDrag?: boolean;
  showHandle?: boolean;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
  onSnapPointChange?: (index: number) => void;
}

/**
 * BottomSheet - Native-like bottom sheet modal
 *
 * Features:
 * - Drag to dismiss
 * - Snap points for different heights
 * - Smooth spring animations
 * - Touch and mouse support
 * - Backdrop click to close
 *
 * Usage:
 * <BottomSheet isOpen={isOpen} onClose={() => setOpen(false)}>
 *   <div>Content here</div>
 * </BottomSheet>
 */
const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.5, 0.9],
  defaultSnapPoint = 0,
  enableDrag = true,
  showHandle = true,
  showCloseButton = true,
  className = '',
  overlayClassName = '',
  onSnapPointChange,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Calculate sheet height based on snap point
  const getSnapHeight = useCallback(
    (index: number) => {
      const viewportHeight = window.innerHeight;
      return viewportHeight * snapPoints[Math.min(index, snapPoints.length - 1)];
    },
    [snapPoints]
  );

  // Open/close animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCurrentSnapIndex(defaultSnapPoint);
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      triggerHaptic('light');
    } else {
      setIsAnimating(false);
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, defaultSnapPoint]);

  // Handle drag start
  const handleDragStart = useCallback(
    (clientY: number) => {
      if (!enableDrag) return;

      setIsDragging(true);
      setStartY(clientY);
      setStartHeight(getSnapHeight(currentSnapIndex));
      triggerHaptic('light');
    },
    [enableDrag, currentSnapIndex, getSnapHeight]
  );

  // Handle drag move
  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging) return;

      const delta = clientY - startY;
      setDragY(delta);
    },
    [isDragging, startY]
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    const velocity = dragY > 0 ? 1 : -1;
    const threshold = 50;

    // Determine new snap point
    if (dragY > threshold) {
      // Dragging down
      if (currentSnapIndex === 0) {
        // Close the sheet
        triggerHaptic('medium');
        onClose();
      } else {
        // Go to lower snap point
        const newIndex = Math.max(0, currentSnapIndex - 1);
        setCurrentSnapIndex(newIndex);
        onSnapPointChange?.(newIndex);
        triggerHaptic('selection');
      }
    } else if (dragY < -threshold) {
      // Dragging up - go to higher snap point
      const newIndex = Math.min(snapPoints.length - 1, currentSnapIndex + 1);
      setCurrentSnapIndex(newIndex);
      onSnapPointChange?.(newIndex);
      triggerHaptic('selection');
    }

    setDragY(0);
  }, [isDragging, dragY, currentSnapIndex, snapPoints.length, onClose, onSnapPointChange]);

  // Mouse events
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Touch events
  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      handleDragMove(e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
      handleDragEnd();
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isVisible) return null;

  const currentHeight = getSnapHeight(currentSnapIndex);
  const translateY = isDragging
    ? Math.max(0, dragY)
    : isAnimating
    ? 0
    : currentHeight;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isAnimating ? 'opacity-50' : 'opacity-0'
        } ${overlayClassName}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl ${className}`}
        style={{
          height: currentHeight,
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Handle */}
        {showHandle && (
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
            onMouseDown={(e) => handleDragStart(e.clientY)}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          >
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title || ''}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          className="overflow-auto"
          style={{
            height: `calc(100% - ${showHandle ? '24px' : '0px'} - ${
              title || showCloseButton ? '52px' : '0px'
            })`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * BottomSheetActions - Pre-styled action buttons for bottom sheet
 */
interface ActionItem {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface BottomSheetActionsProps {
  actions: ActionItem[];
  onClose?: () => void;
}

export const BottomSheetActions: React.FC<BottomSheetActionsProps> = ({
  actions,
  onClose,
}) => (
  <div className="p-2 space-y-1">
    {actions.map((action, index) => (
      <button
        key={index}
        onClick={() => {
          triggerHaptic('impact');
          action.onClick();
          onClose?.();
        }}
        disabled={action.disabled}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
          action.destructive
            ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
            : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
        } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
        <span className="font-medium">{action.label}</span>
      </button>
    ))}
  </div>
);

/**
 * BottomSheetMenu - iOS-style action sheet menu
 */
interface BottomSheetMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: ActionItem[];
  cancelLabel?: string;
}

export const BottomSheetMenu: React.FC<BottomSheetMenuProps> = ({
  isOpen,
  onClose,
  title,
  message,
  actions,
  cancelLabel = 'Cancelar',
}) => (
  <BottomSheet
    isOpen={isOpen}
    onClose={onClose}
    snapPoints={[0.4]}
    showHandle={true}
    showCloseButton={false}
  >
    <div className="p-4">
      {/* Header */}
      {(title || message) && (
        <div className="text-center pb-4 border-b border-gray-100 dark:border-gray-700 mb-2">
          {title && (
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {title}
            </h3>
          )}
          {message && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {message}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <BottomSheetActions actions={actions} onClose={onClose} />

      {/* Cancel */}
      <button
        onClick={() => {
          triggerHaptic('light');
          onClose();
        }}
        className="w-full mt-2 py-3 text-center text-oaxaca-pink font-semibold rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {cancelLabel}
      </button>
    </div>
  </BottomSheet>
);

/**
 * useBottomSheet - Hook for managing bottom sheet state
 */
export const useBottomSheet = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
    props: {
      isOpen,
      onClose: close,
    },
  };
};

export default BottomSheet;
