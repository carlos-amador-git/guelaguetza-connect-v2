import React, { useState, useRef, useCallback, useEffect } from 'react';
import { triggerHaptic } from '../../utils/haptics';

// ============================================
// Types
// ============================================

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface MenuPosition {
  x: number;
  y: number;
}

interface ContextMenuProps {
  children: React.ReactNode;
  items: MenuItem[];
  disabled?: boolean;
  longPressDelay?: number;
  className?: string;
  menuClassName?: string;
  onOpen?: () => void;
  onClose?: () => void;
}

// ============================================
// ContextMenu Component
// ============================================

/**
 * ContextMenu - Long press context menu (iOS/Android style)
 *
 * Features:
 * - Long press to open
 * - Right-click support on desktop
 * - Haptic feedback
 * - Backdrop blur
 * - Auto-positioning
 *
 * Usage:
 * <ContextMenu
 *   items={[
 *     { id: 'edit', label: 'Editar', icon: <Edit />, onClick: handleEdit },
 *     { id: 'delete', label: 'Eliminar', icon: <Trash />, onClick: handleDelete, destructive: true },
 *   ]}
 * >
 *   <div>Long press me</div>
 * </ContextMenu>
 */
const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  items,
  disabled = false,
  longPressDelay = 500,
  className = '',
  menuClassName = '',
  onOpen,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Close menu
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  // Open menu at position
  const openMenu = useCallback(
    (x: number, y: number) => {
      if (disabled) return;

      // Adjust position to keep menu in viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const menuWidth = 200; // Approximate menu width
      const menuHeight = items.length * 48 + 16; // Approximate menu height

      let adjustedX = x;
      let adjustedY = y;

      if (x + menuWidth > viewportWidth) {
        adjustedX = viewportWidth - menuWidth - 16;
      }
      if (y + menuHeight > viewportHeight) {
        adjustedY = viewportHeight - menuHeight - 16;
      }

      setPosition({ x: Math.max(16, adjustedX), y: Math.max(16, adjustedY) });
      setIsOpen(true);
      triggerHaptic('medium');
      onOpen?.();
    },
    [disabled, items.length, onOpen]
  );

  // Cancel long press
  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartRef.current = null;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };

      longPressTimerRef.current = setTimeout(() => {
        openMenu(touch.clientX, touch.clientY);
      }, longPressDelay);
    },
    [disabled, longPressDelay, openMenu]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const moveThreshold = 10;

      const dx = Math.abs(touch.clientX - touchStartRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);

      if (dx > moveThreshold || dy > moveThreshold) {
        cancelLongPress();
      }
    },
    [cancelLongPress]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    cancelLongPress();
  }, [cancelLongPress]);

  // Handle context menu (right-click)
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      openMenu(e.clientX, e.clientY);
    },
    [openMenu]
  );

  // Handle menu item click
  const handleItemClick = useCallback(
    (item: MenuItem) => {
      if (item.disabled) return;

      triggerHaptic('impact');
      item.onClick();
      closeMenu();
    },
    [closeMenu]
  );

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeMenu]);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelLongPress();
    };
  }, [cancelLongPress]);

  return (
    <>
      <div
        ref={containerRef}
        className={`touch-none select-none ${className}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onContextMenu={handleContextMenu}
      >
        {children}
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={closeMenu}
          />

          {/* Menu */}
          <div
            ref={menuRef}
            className={`fixed z-50 min-w-[200px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 fade-in duration-200 ${menuClassName}`}
            style={{
              left: position.x,
              top: position.y,
            }}
          >
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                {item.divider && index > 0 && (
                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                )}
                <button
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    item.destructive
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {item.icon && (
                    <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
                  )}
                  <span className="font-medium">{item.label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </>
  );
};

// ============================================
// QuickActions - Floating action buttons on long press
// ============================================

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface QuickActionsProps {
  children: React.ReactNode;
  actions: QuickAction[];
  disabled?: boolean;
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  children,
  actions,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const openActions = useCallback(
    (x: number, y: number) => {
      if (disabled) return;

      setCenter({ x, y });
      setIsOpen(true);
      triggerHaptic('medium');
    },
    [disabled]
  );

  const closeActions = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const rect = containerRef.current?.getBoundingClientRect();

      if (!rect) return;

      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      longPressTimerRef.current = setTimeout(() => {
        openActions(x, y);
      }, 400);
    },
    [openActions]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  }, []);

  const handleActionClick = useCallback(
    (action: QuickAction) => {
      triggerHaptic('impact');
      action.onClick();
      closeActions();
    },
    [closeActions]
  );

  // Calculate action positions in a circle
  const getActionStyle = (index: number): React.CSSProperties => {
    const radius = 70;
    const totalActions = actions.length;
    const startAngle = -90; // Start from top
    const angleStep = 360 / totalActions;
    const angle = (startAngle + index * angleStep) * (Math.PI / 180);

    return {
      left: center.x + radius * Math.cos(angle) - 24,
      top: center.y + radius * Math.sin(angle) - 24,
      transform: isOpen ? 'scale(1)' : 'scale(0)',
      transition: `transform 0.2s ease-out ${index * 50}ms`,
    };
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {children}

      {isOpen && (
        <>
          <div
            className="absolute inset-0 z-40"
            onClick={closeActions}
          />
          {actions.map((action, index) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={`absolute z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white ${
                action.color || 'bg-oaxaca-pink'
              }`}
              style={getActionStyle(index)}
              title={action.label}
            >
              {action.icon}
            </button>
          ))}
        </>
      )}
    </div>
  );
};

// ============================================
// ActionSheet - iOS-style action sheet
// ============================================

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: MenuItem[];
  cancelLabel?: string;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  isOpen,
  onClose,
  title,
  message,
  actions,
  cancelLabel = 'Cancelar',
}) => {
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

  if (!isOpen) return null;

  const handleActionClick = (action: MenuItem) => {
    if (action.disabled) return;
    triggerHaptic('impact');
    action.onClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-lg animate-in slide-in-from-bottom duration-300">
        {/* Actions group */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden mb-2">
          {/* Header */}
          {(title || message) && (
            <div className="px-4 py-3 text-center border-b border-gray-100 dark:border-gray-700">
              {title && (
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {title}
                </div>
              )}
              {message && (
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {message}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {actions.map((action, index) => (
            <React.Fragment key={action.id}>
              {index > 0 && (
                <div className="h-px bg-gray-100 dark:bg-gray-700" />
              )}
              <button
                onClick={() => handleActionClick(action)}
                disabled={action.disabled}
                className={`w-full px-4 py-4 text-center text-lg transition-colors ${
                  action.destructive
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-oaxaca-pink'
                } ${
                  action.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'active:bg-gray-100 dark:active:bg-gray-700'
                }`}
              >
                {action.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Cancel button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="w-full bg-white dark:bg-gray-800 rounded-2xl px-4 py-4 text-center text-lg font-semibold text-oaxaca-pink active:bg-gray-100 dark:active:bg-gray-700"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
};

// ============================================
// useContextMenu Hook
// ============================================

export const useContextMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });

  const open = useCallback((x: number, y: number) => {
    setPosition({ x, y });
    setIsOpen(true);
    triggerHaptic('medium');
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    position,
    open,
    close,
  };
};

// ============================================
// useActionSheet Hook
// ============================================

export const useActionSheet = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
    triggerHaptic('light');
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    open,
    close,
    props: {
      isOpen,
      onClose: close,
    },
  };
};

export default ContextMenu;
