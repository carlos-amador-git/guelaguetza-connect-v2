import React, { useState, useCallback, forwardRef } from 'react';
import { ChevronRight, ChevronDown, Check, GripVertical, MoreVertical, Trash2, Edit, Copy } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

// ============================================
// Types
// ============================================

type ListVariant = 'default' | 'separated' | 'inset' | 'grouped';
type ListItemSize = 'sm' | 'md' | 'lg';

// ============================================
// List Component
// ============================================

interface ListProps {
  children: React.ReactNode;
  variant?: ListVariant;
  dividers?: boolean;
  className?: string;
}

/**
 * List - Contenedor de lista
 *
 * Features:
 * - Múltiples variantes
 * - Separadores opcionales
 * - Secciones agrupables
 *
 * Usage:
 * <List variant="separated">
 *   <ListItem title="Item 1" />
 *   <ListItem title="Item 2" />
 * </List>
 */
const List: React.FC<ListProps> = ({
  children,
  variant = 'default',
  dividers = true,
  className = '',
}) => {
  const variants = {
    default: '',
    separated: 'space-y-2',
    inset: 'px-4',
    grouped: '',
  };

  return (
    <div
      className={`${variants[variant]} ${
        dividers && variant !== 'separated' ? 'divide-y divide-gray-100 dark:divide-gray-800' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

// ============================================
// List Item Component
// ============================================

interface ListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  size?: ListItemSize;
  selected?: boolean;
  disabled?: boolean;
  chevron?: boolean;
  onClick?: () => void;
  onLongPress?: () => void;
  className?: string;
}

export const ListItem = forwardRef<HTMLDivElement, ListItemProps>(
  (
    {
      title,
      subtitle,
      description,
      leading,
      trailing,
      size = 'md',
      selected = false,
      disabled = false,
      chevron = false,
      onClick,
      onLongPress,
      className = '',
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = useState(false);
    const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

    const sizes = {
      sm: { container: 'py-2 px-3', title: 'text-sm', subtitle: 'text-xs' },
      md: { container: 'py-3 px-4', title: 'text-base', subtitle: 'text-sm' },
      lg: { container: 'py-4 px-4', title: 'text-lg', subtitle: 'text-base' },
    };

    const sizeConfig = sizes[size];

    const handleMouseDown = () => {
      if (onLongPress) {
        setIsPressed(true);
        longPressTimer.current = setTimeout(() => {
          onLongPress();
          triggerHaptic('impact');
        }, 500);
      }
    };

    const handleMouseUp = () => {
      setIsPressed(false);
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };

    const handleClick = () => {
      if (onClick && !disabled) {
        onClick();
        triggerHaptic('selection');
      }
    };

    return (
      <div
        ref={ref}
        className={`flex items-center gap-3 ${sizeConfig.container} ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : onClick
            ? 'cursor-pointer active:bg-gray-50 dark:active:bg-gray-800'
            : ''
        } ${selected ? 'bg-oaxaca-pink/5' : ''} ${
          isPressed ? 'bg-gray-100 dark:bg-gray-800' : ''
        } transition-colors ${className}`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        {leading && <div className="flex-shrink-0">{leading}</div>}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-medium text-gray-900 dark:text-white truncate ${sizeConfig.title}`}
            >
              {title}
            </span>
            {selected && <Check size={16} className="text-oaxaca-pink flex-shrink-0" />}
          </div>
          {subtitle && (
            <p
              className={`text-gray-500 dark:text-gray-400 truncate ${sizeConfig.subtitle}`}
            >
              {subtitle}
            </p>
          )}
          {description && (
            <p className="text-sm text-gray-400 line-clamp-2 mt-1">{description}</p>
          )}
        </div>

        {trailing && <div className="flex-shrink-0">{trailing}</div>}

        {chevron && !trailing && (
          <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
        )}
      </div>
    );
  }
);

ListItem.displayName = 'ListItem';

// ============================================
// List Section
// ============================================

interface ListSectionProps {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const ListSection: React.FC<ListSectionProps> = ({
  title,
  children,
  action,
  className = '',
}) => (
  <div className={className}>
    {(title || action) && (
      <div className="flex items-center justify-between px-4 py-2">
        {title && (
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </h3>
        )}
        {action}
      </div>
    )}
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
      {children}
    </div>
  </div>
);

// ============================================
// Expandable List Item
// ============================================

interface ExpandableListItemProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export const ExpandableListItem: React.FC<ExpandableListItemProps> = ({
  title,
  subtitle,
  leading,
  children,
  defaultExpanded = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggle = () => {
    setIsExpanded(!isExpanded);
    triggerHaptic('selection');
  };

  return (
    <div className={className}>
      <div
        className="flex items-center gap-3 py-3 px-4 cursor-pointer"
        onClick={toggle}
      >
        {leading && <div className="flex-shrink-0">{leading}</div>}

        <div className="flex-1 min-w-0">
          <span className="font-medium text-gray-900 dark:text-white">{title}</span>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>

        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>

      {isExpanded && (
        <div className="pl-12 pr-4 pb-3 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================
// Selectable List
// ============================================

interface SelectableListProps<T> {
  items: T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  keyExtractor: (item: T) => string;
  multiSelect?: boolean;
  className?: string;
}

export function SelectableList<T>({
  items,
  selected,
  onChange,
  renderItem,
  keyExtractor,
  multiSelect = true,
  className = '',
}: SelectableListProps<T>) {
  const handleSelect = useCallback(
    (item: T) => {
      const key = keyExtractor(item);
      const isSelected = selected.some((s) => keyExtractor(s) === key);

      if (multiSelect) {
        if (isSelected) {
          onChange(selected.filter((s) => keyExtractor(s) !== key));
        } else {
          onChange([...selected, item]);
        }
      } else {
        onChange(isSelected ? [] : [item]);
      }

      triggerHaptic('selection');
    },
    [selected, onChange, keyExtractor, multiSelect]
  );

  return (
    <List className={className}>
      {items.map((item) => {
        const key = keyExtractor(item);
        const isSelected = selected.some((s) => keyExtractor(s) === key);

        return (
          <div
            key={key}
            className={`flex items-center gap-3 py-3 px-4 cursor-pointer transition-colors ${
              isSelected ? 'bg-oaxaca-pink/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => handleSelect(item)}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-oaxaca-pink border-oaxaca-pink'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {isSelected && <Check size={12} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">{renderItem(item, isSelected)}</div>
          </div>
        );
      })}
    </List>
  );
}

// ============================================
// Swipeable List Item
// ============================================

interface SwipeAction {
  icon: React.ReactNode;
  label?: string;
  color: string;
  onClick: () => void;
}

interface SwipeableListItemProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  className?: string;
}

export const SwipeableListItem: React.FC<SwipeableListItemProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  className = '',
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = React.useRef(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const actionWidth = 80;
  const maxLeft = leftActions.length * actionWidth;
  const maxRight = -rightActions.length * actionWidth;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX - translateX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentX = e.touches[0].clientX - startX.current;
    const bounded = Math.max(maxRight, Math.min(maxLeft, currentX));
    setTranslateX(bounded);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // Snap to action positions or reset
    if (translateX > actionWidth / 2 && leftActions.length > 0) {
      setTranslateX(maxLeft);
    } else if (translateX < -actionWidth / 2 && rightActions.length > 0) {
      setTranslateX(maxRight);
    } else {
      setTranslateX(0);
    }
  };

  const resetPosition = () => setTranslateX(0);

  return (
    <div className={`relative overflow-hidden ${className}`} ref={containerRef}>
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex">
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                resetPosition();
                triggerHaptic('impact');
              }}
              className={`flex items-center justify-center px-4 ${action.color}`}
              style={{ width: actionWidth }}
            >
              <div className="text-center text-white">
                {action.icon}
                {action.label && <span className="text-xs mt-1 block">{action.label}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex">
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                resetPosition();
                triggerHaptic('impact');
              }}
              className={`flex items-center justify-center px-4 ${action.color}`}
              style={{ width: actionWidth }}
            >
              <div className="text-center text-white">
                {action.icon}
                {action.label && <span className="text-xs mt-1 block">{action.label}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        className={`bg-white dark:bg-gray-800 ${isDragging ? '' : 'transition-transform duration-200'}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

// ============================================
// Draggable List
// ============================================

interface DraggableListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
}

export function DraggableList<T>({
  items,
  onReorder,
  renderItem,
  keyExtractor,
  className = '',
}: DraggableListProps<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
    triggerHaptic('impact');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, removed);
    onReorder(newItems);

    setDraggedIndex(null);
    setDragOverIndex(null);
    triggerHaptic('success');
  };

  return (
    <List className={className}>
      {items.map((item, index) => (
        <div
          key={keyExtractor(item)}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={() => handleDrop(index)}
          onDragEnd={() => {
            setDraggedIndex(null);
            setDragOverIndex(null);
          }}
          className={`flex items-center gap-3 py-3 px-4 cursor-grab active:cursor-grabbing transition-all ${
            draggedIndex === index ? 'opacity-50' : ''
          } ${
            dragOverIndex === index && draggedIndex !== index
              ? 'border-t-2 border-oaxaca-pink'
              : ''
          }`}
        >
          <GripVertical size={20} className="text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">{renderItem(item, index)}</div>
        </div>
      ))}
    </List>
  );
}

// ============================================
// Menu List
// ============================================

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

interface MenuListProps {
  items: MenuItem[];
  className?: string;
}

export const MenuList: React.FC<MenuListProps> = ({ items, className = '' }) => (
  <List variant="separated" dividers={false} className={className}>
    {items.map((item) => (
      <ListItem
        key={item.id}
        title={item.label}
        leading={
          item.icon && (
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                item.danger
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {item.icon}
            </div>
          )
        }
        trailing={
          item.badge ? (
            <span className="px-2 py-0.5 text-xs font-medium bg-oaxaca-pink/10 text-oaxaca-pink rounded-full">
              {item.badge}
            </span>
          ) : undefined
        }
        chevron={!item.badge}
        disabled={item.disabled}
        onClick={item.onClick}
        className={`rounded-xl ${
          item.danger ? 'text-red-500' : ''
        }`}
      />
    ))}
  </List>
);

export default List;
