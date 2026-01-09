import React from 'react';
import { createPortal } from 'react-dom';

// ============================================
// Tooltip
// ============================================

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 200,
  disabled = false,
  className = '',
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const calculatePosition = React.useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const spacing = 8;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - spacing;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + spacing;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - spacing;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + spacing;
        break;
    }

    // Keep within viewport
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));

    setCoords({ top, left });
  }, [position]);

  React.useEffect(() => {
    if (isVisible) {
      calculatePosition();
      window.addEventListener('scroll', calculatePosition, true);
      window.addEventListener('resize', calculatePosition);
    }

    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isVisible, calculatePosition]);

  const handleMouseEnter = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const arrowClasses = {
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent',
    left: 'right-0 top-1/2 -translate-y-1/2 translate-x-full border-t-transparent border-b-transparent border-r-transparent',
    right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            zIndex: 9999,
          }}
          className={`
            px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg
            shadow-lg pointer-events-none
            animate-in fade-in zoom-in-95 duration-150
            ${className}
          `}
        >
          {content}
          <div
            className={`absolute w-0 h-0 border-4 border-gray-900 dark:border-gray-700 ${arrowClasses[position]}`}
          />
        </div>,
        document.body
      )}
    </>
  );
};

// ============================================
// Popover
// ============================================

interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  triggerOn?: 'click' | 'hover';
  closeOnClickOutside?: boolean;
  showArrow?: boolean;
  width?: number | 'auto' | 'trigger';
  className?: string;
  contentClassName?: string;
}

export const Popover: React.FC<PopoverProps> = ({
  trigger,
  content,
  position = 'bottom',
  align = 'center',
  triggerOn = 'click',
  closeOnClickOutside = true,
  showArrow = true,
  width = 'auto',
  className = '',
  contentClassName = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const calculatePosition = React.useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const spacing = showArrow ? 12 : 8;

    let top = 0;
    let left = 0;

    // Position
    switch (position) {
      case 'top':
        top = triggerRect.top - contentRect.height - spacing;
        break;
      case 'bottom':
        top = triggerRect.bottom + spacing;
        break;
      case 'left':
        left = triggerRect.left - contentRect.width - spacing;
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
        break;
      case 'right':
        left = triggerRect.right + spacing;
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
        break;
    }

    // Alignment for top/bottom
    if (position === 'top' || position === 'bottom') {
      switch (align) {
        case 'start':
          left = triggerRect.left;
          break;
        case 'center':
          left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
          break;
        case 'end':
          left = triggerRect.right - contentRect.width;
          break;
      }
    }

    // Keep within viewport
    left = Math.max(8, Math.min(left, window.innerWidth - contentRect.width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - contentRect.height - 8));

    setCoords({ top, left });
  }, [position, align, showArrow]);

  React.useEffect(() => {
    if (isOpen) {
      calculatePosition();
      window.addEventListener('scroll', calculatePosition, true);
      window.addEventListener('resize', calculatePosition);
    }

    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isOpen, calculatePosition]);

  React.useEffect(() => {
    if (!closeOnClickOutside || !isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeOnClickOutside]);

  const handleTriggerClick = () => {
    if (triggerOn === 'click') {
      setIsOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (triggerOn === 'hover') {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (triggerOn === 'hover') {
      setIsOpen(false);
    }
  };

  const triggerWidth = triggerRef.current?.offsetWidth;
  const contentWidth = width === 'trigger' ? triggerWidth : width === 'auto' ? undefined : width;

  const arrowClasses = {
    top: 'bottom-0 translate-y-full border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800',
    bottom: 'top-0 -translate-y-full border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white dark:border-b-gray-800',
    left: 'right-0 translate-x-full border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-white dark:border-l-gray-800',
    right: 'left-0 -translate-x-full border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white dark:border-r-gray-800',
  };

  const arrowAlign = {
    start: 'left-4',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-4',
  };

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`inline-block ${className}`}
      >
        {trigger}
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={contentRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: contentWidth,
            zIndex: 9999,
          }}
          className={`
            bg-white dark:bg-gray-800 rounded-xl shadow-xl
            border border-gray-200 dark:border-gray-700
            animate-in fade-in zoom-in-95 duration-200
            ${contentClassName}
          `}
        >
          {content}
          {showArrow && (
            <div
              className={`
                absolute w-0 h-0
                ${arrowClasses[position]}
                ${(position === 'top' || position === 'bottom') ? arrowAlign[align] : 'top-1/2 -translate-y-1/2'}
              `}
            />
          )}
        </div>,
        document.body
      )}
    </>
  );
};

// ============================================
// Dropdown Menu
// ============================================

interface DropdownItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

interface DropdownSection {
  title?: string;
  items: DropdownItem[];
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items?: DropdownItem[];
  sections?: DropdownSection[];
  align?: 'start' | 'end';
  width?: number | 'auto' | 'trigger';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  sections,
  align = 'start',
  width = 200,
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const allItems = React.useMemo(() => {
    if (items) return items;
    if (sections) return sections.flatMap(s => s.items);
    return [];
  }, [items, sections]);

  React.useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(i => {
            const next = i + 1;
            if (next >= allItems.length) return 0;
            if (allItems[next].disabled) return i;
            return next;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(i => {
            const prev = i - 1;
            if (prev < 0) return allItems.length - 1;
            if (allItems[prev].disabled) return i;
            return prev;
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && !allItems[highlightedIndex].disabled) {
            allItems[highlightedIndex].onClick?.();
            setIsOpen(false);
          }
          break;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, highlightedIndex, allItems]);

  const renderItem = (item: DropdownItem, globalIndex: number) => (
    <button
      key={item.key}
      onClick={() => {
        if (!item.disabled) {
          item.onClick?.();
          setIsOpen(false);
        }
      }}
      onMouseEnter={() => setHighlightedIndex(globalIndex)}
      disabled={item.disabled}
      className={`
        w-full px-3 py-2 text-left flex items-center gap-3 text-sm
        ${highlightedIndex === globalIndex ? 'bg-gray-100 dark:bg-gray-700' : ''}
        ${item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
        ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-colors
      `}
    >
      {item.icon && <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>}
      <span className="flex-1">{item.label}</span>
      {item.shortcut && (
        <span className="text-xs text-gray-400 dark:text-gray-500">{item.shortcut}</span>
      )}
    </button>
  );

  let globalIndex = 0;

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          role="menu"
          style={{ width: width === 'auto' ? undefined : width }}
          className={`
            absolute top-full mt-2
            ${align === 'start' ? 'left-0' : 'right-0'}
            bg-white dark:bg-gray-800 rounded-xl shadow-xl
            border border-gray-200 dark:border-gray-700
            py-1 z-50
            animate-in fade-in slide-in-from-top-2 duration-200
          `}
        >
          {items && items.map((item) => renderItem(item, globalIndex++))}

          {sections && sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {sectionIndex > 0 && (
                <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
              )}
              {section.title && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => renderItem(item, globalIndex++))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// Context Menu
// ============================================

interface ContextMenuProps {
  children: React.ReactNode;
  items?: DropdownItem[];
  sections?: DropdownSection[];
  disabled?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  items,
  sections,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleClick = () => setIsOpen(false);
    const handleScroll = () => setIsOpen(false);

    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return;

    e.preventDefault();

    let x = e.clientX;
    let y = e.clientY;

    // Ensure menu stays within viewport
    const menuWidth = 200;
    const menuHeight = 300;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 8;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 8;
    }

    setPosition({ x, y });
    setIsOpen(true);
  };

  const allItems = items || sections?.flatMap(s => s.items) || [];

  const renderItem = (item: DropdownItem) => (
    <button
      key={item.key}
      onClick={(e) => {
        e.stopPropagation();
        if (!item.disabled) {
          item.onClick?.();
          setIsOpen(false);
        }
      }}
      disabled={item.disabled}
      className={`
        w-full px-3 py-2 text-left flex items-center gap-3 text-sm
        hover:bg-gray-100 dark:hover:bg-gray-700
        ${item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
        ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-colors
      `}
    >
      {item.icon && <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>}
      <span className="flex-1">{item.label}</span>
      {item.shortcut && (
        <span className="text-xs text-gray-400 dark:text-gray-500">{item.shortcut}</span>
      )}
    </button>
  );

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        {children}
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: position.y,
            left: position.x,
            zIndex: 9999,
          }}
          className="min-w-[180px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 animate-in fade-in zoom-in-95 duration-150"
        >
          {items && items.map(renderItem)}

          {sections && sections.map((section, index) => (
            <div key={index}>
              {index > 0 && (
                <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
              )}
              {section.title && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {section.title}
                </div>
              )}
              {section.items.map(renderItem)}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

// ============================================
// Menu (Simple)
// ============================================

interface MenuProps {
  children: React.ReactNode;
  className?: string;
}

export const Menu: React.FC<MenuProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 ${className}`}>
      {children}
    </div>
  );
};

interface MenuItemProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  children,
  icon,
  shortcut,
  disabled = false,
  danger = false,
  active = false,
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm
        ${active ? 'bg-oaxaca-pink/10 text-oaxaca-pink' : ''}
        ${danger ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' : ''}
        ${!active && !danger ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-colors
        ${className}
      `}
    >
      {icon && <span className="w-5 h-5 flex-shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="text-xs text-gray-400 dark:text-gray-500">{shortcut}</span>
      )}
    </button>
  );
};

export const MenuDivider: React.FC = () => (
  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
);

interface MenuLabelProps {
  children: React.ReactNode;
}

export const MenuLabel: React.FC<MenuLabelProps> = ({ children }) => (
  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
    {children}
  </div>
);

// ============================================
// Info Tooltip (Icon + Tooltip)
// ============================================

interface InfoTooltipProps {
  content: React.ReactNode;
  iconSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  iconSize = 'md',
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <Tooltip content={content} className={className}>
      <button
        type="button"
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label="Más información"
      >
        <svg className={sizes[iconSize]} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </svg>
      </button>
    </Tooltip>
  );
};
