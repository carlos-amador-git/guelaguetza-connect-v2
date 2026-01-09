import React, { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Accessibility utilities for Guelaguetza Connect
 *
 * Features:
 * - Focus trap for modals
 * - Keyboard navigation hooks
 * - Screen reader announcements
 * - Skip to content link
 * - Reduced motion detection
 */

// ============================================
// Focus Management
// ============================================

/**
 * useFocusTrap - Traps focus within a container (for modals, dialogs)
 */
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when trap activates
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
};

/**
 * useFocusReturn - Returns focus to the element that triggered a modal
 */
export const useFocusReturn = (isOpen: boolean) => {
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);
};

// ============================================
// Keyboard Navigation
// ============================================

/**
 * useKeyboardNavigation - Arrow key navigation for lists
 */
export const useKeyboardNavigation = <T extends HTMLElement>(
  items: T[],
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
    onSelect?: (index: number) => void;
  } = {}
) => {
  const { orientation = 'vertical', loop = true, onSelect } = options;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isVertical = orientation === 'vertical' || orientation === 'both';
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';

      let nextIndex = activeIndex;

      switch (e.key) {
        case 'ArrowDown':
          if (isVertical) {
            e.preventDefault();
            nextIndex = activeIndex + 1;
          }
          break;
        case 'ArrowUp':
          if (isVertical) {
            e.preventDefault();
            nextIndex = activeIndex - 1;
          }
          break;
        case 'ArrowRight':
          if (isHorizontal) {
            e.preventDefault();
            nextIndex = activeIndex + 1;
          }
          break;
        case 'ArrowLeft':
          if (isHorizontal) {
            e.preventDefault();
            nextIndex = activeIndex - 1;
          }
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = items.length - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect?.(activeIndex);
          return;
        default:
          return;
      }

      // Handle looping
      if (loop) {
        if (nextIndex < 0) nextIndex = items.length - 1;
        if (nextIndex >= items.length) nextIndex = 0;
      } else {
        nextIndex = Math.max(0, Math.min(items.length - 1, nextIndex));
      }

      setActiveIndex(nextIndex);
      items[nextIndex]?.focus();
    },
    [activeIndex, items, loop, onSelect, orientation]
  );

  return { activeIndex, setActiveIndex, handleKeyDown };
};

/**
 * useEscapeKey - Handle escape key press
 */
export const useEscapeKey = (handler: () => void, isActive: boolean = true) => {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handler, isActive]);
};

// ============================================
// Screen Reader Utilities
// ============================================

/**
 * VisuallyHidden - Hides content visually but keeps it accessible to screen readers
 */
export const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: 0,
    }}
  >
    {children}
  </span>
);

/**
 * useAnnounce - Announce messages to screen readers
 */
export const useAnnounce = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;

    document.body.appendChild(announcement);

    // Small delay to ensure screen reader catches the change
    setTimeout(() => {
      announcement.textContent = message;
    }, 100);

    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return announce;
};

// ============================================
// Skip Links
// ============================================

/**
 * SkipToContent - Skip link for keyboard users
 */
export const SkipToContent: React.FC<{ targetId?: string }> = ({ targetId = 'main-content' }) => (
  <a
    href={`#${targetId}`}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-oaxaca-pink focus:text-white focus:rounded-lg focus:outline-none"
    onClick={(e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }}
  >
    Saltar al contenido principal
  </a>
);

// ============================================
// Motion Preferences
// ============================================

/**
 * usePrefersReducedMotion - Detect user's motion preference
 */
export const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// ============================================
// Focus Visible
// ============================================

/**
 * FocusRing - Wrapper that shows focus ring only for keyboard navigation
 */
interface FocusRingProps {
  children: React.ReactElement;
  ringColor?: string;
  ringOffset?: number;
}

export const FocusRing: React.FC<FocusRingProps> = ({
  children,
  ringColor = 'ring-oaxaca-pink',
  ringOffset = 2,
}) => {
  return React.cloneElement(children, {
    className: `${children.props.className || ''} focus:outline-none focus-visible:ring-2 focus-visible:${ringColor} focus-visible:ring-offset-${ringOffset}`,
  });
};

// ============================================
// ARIA Live Region Component
// ============================================

interface LiveRegionProps {
  children: React.ReactNode;
  mode?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  mode = 'polite',
  atomic = true,
  relevant = 'additions text',
}) => (
  <div
    role="status"
    aria-live={mode}
    aria-atomic={atomic}
    aria-relevant={relevant}
  >
    {children}
  </div>
);

// ============================================
// Accessible Dialog/Modal
// ============================================

interface AccessibleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = '',
}) => {
  const dialogRef = useFocusTrap(isOpen);

  useFocusReturn(isOpen);
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto ${className}`}
      >
        <h2 id="dialog-title" className="sr-only">
          {title}
        </h2>
        {description && (
          <p id="dialog-description" className="sr-only">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
};

// ============================================
// Accessible Tabs
// ============================================

interface TabsProps {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  defaultTab?: string;
  className?: string;
  onChange?: (tabId: string) => void;
}

export const AccessibleTabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  className = '',
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        newIndex = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    tabRefs.current[newIndex]?.focus();
    setActiveTab(tabs[newIndex].id);
    onChange?.(tabs[newIndex].id);
  };

  return (
    <div className={className}>
      {/* Tab List */}
      <div role="tablist" aria-label="Tabs" className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => (tabRefs.current[index] = el)}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => {
              setActiveTab(tab.id);
              onChange?.(tab.id);
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-oaxaca-pink ${
              activeTab === tab.id
                ? 'text-oaxaca-pink border-b-2 border-oaxaca-pink'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={0}
          className="focus:outline-none"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};

export default {
  useFocusTrap,
  useFocusReturn,
  useKeyboardNavigation,
  useEscapeKey,
  useAnnounce,
  usePrefersReducedMotion,
  VisuallyHidden,
  SkipToContent,
  FocusRing,
  LiveRegion,
  AccessibleDialog,
  AccessibleTabs,
};
