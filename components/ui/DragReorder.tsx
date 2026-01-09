import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface DragReorderProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, dragHandleProps: DragHandleProps) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  itemClassName?: string;
  activeItemClassName?: string;
  disabled?: boolean;
  direction?: 'vertical' | 'horizontal';
  gap?: number;
}

interface DragHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  className?: string;
  'aria-label': string;
  role: string;
  tabIndex: number;
}

interface DragState {
  isDragging: boolean;
  dragIndex: number | null;
  dragOverIndex: number | null;
  startY: number;
  startX: number;
  currentY: number;
  currentX: number;
}

// Haptic feedback
const triggerHaptic = (type: 'light' | 'medium' = 'light') => {
  if ('vibrate' in navigator) {
    navigator.vibrate(type === 'light' ? 10 : 25);
  }
};

/**
 * DragReorder - Drag-and-drop reorderable list
 *
 * Usage:
 * <DragReorder
 *   items={items}
 *   onReorder={setItems}
 *   keyExtractor={(item) => item.id}
 *   renderItem={(item, index, dragHandleProps) => (
 *     <div className="flex items-center">
 *       <button {...dragHandleProps}><GripVertical /></button>
 *       <span>{item.name}</span>
 *     </div>
 *   )}
 * />
 */
function DragReorder<T>({
  items,
  onReorder,
  renderItem,
  keyExtractor,
  className = '',
  itemClassName = '',
  activeItemClassName = 'opacity-50 scale-105 shadow-lg z-10',
  disabled = false,
  direction = 'vertical',
  gap = 8,
}: DragReorderProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragIndex: null,
    dragOverIndex: null,
    startY: 0,
    startX: 0,
    currentY: 0,
    currentX: 0,
  });

  const [previewOrder, setPreviewOrder] = useState<T[]>(items);

  // Update preview when items change
  useEffect(() => {
    if (!dragState.isDragging) {
      setPreviewOrder(items);
    }
  }, [items, dragState.isDragging]);

  const getItemPosition = useCallback((index: number) => {
    const itemKeys = Array.from(itemRefs.current.keys());
    const key = itemKeys[index];
    const element = itemRefs.current.get(key);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
      height: rect.height,
      width: rect.width,
      centerY: rect.top + rect.height / 2,
      centerX: rect.left + rect.width / 2,
    };
  }, []);

  const findDropIndex = useCallback(
    (clientX: number, clientY: number, dragIndex: number): number => {
      const isVertical = direction === 'vertical';
      const position = isVertical ? clientY : clientX;

      for (let i = 0; i < items.length; i++) {
        const itemPos = getItemPosition(i);
        if (!itemPos) continue;

        const center = isVertical ? itemPos.centerY : itemPos.centerX;

        if (i < dragIndex) {
          if (position < center) return i;
        } else if (i > dragIndex) {
          if (position > center) return i;
        }
      }

      return dragIndex;
    },
    [direction, items.length, getItemPosition]
  );

  const reorderItems = useCallback(
    (fromIndex: number, toIndex: number): T[] => {
      const newItems = [...items];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      return newItems;
    },
    [items]
  );

  const handleDragStart = useCallback(
    (index: number, clientX: number, clientY: number) => {
      if (disabled) return;

      triggerHaptic('medium');

      setDragState({
        isDragging: true,
        dragIndex: index,
        dragOverIndex: index,
        startY: clientY,
        startX: clientX,
        currentY: clientY,
        currentX: clientX,
      });
    },
    [disabled]
  );

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragState.isDragging || dragState.dragIndex === null) return;

      const dropIndex = findDropIndex(clientX, clientY, dragState.dragIndex);

      setDragState((prev) => ({
        ...prev,
        currentY: clientY,
        currentX: clientX,
        dragOverIndex: dropIndex,
      }));

      // Update preview order
      if (dropIndex !== dragState.dragOverIndex) {
        triggerHaptic('light');
        setPreviewOrder(reorderItems(dragState.dragIndex, dropIndex));
      }
    },
    [dragState.isDragging, dragState.dragIndex, dragState.dragOverIndex, findDropIndex, reorderItems]
  );

  const handleDragEnd = useCallback(() => {
    if (!dragState.isDragging || dragState.dragIndex === null) return;

    const finalOrder = previewOrder;

    setDragState({
      isDragging: false,
      dragIndex: null,
      dragOverIndex: null,
      startY: 0,
      startX: 0,
      currentY: 0,
      currentX: 0,
    });

    triggerHaptic('medium');
    onReorder(finalOrder);
  }, [dragState.isDragging, dragState.dragIndex, previewOrder, onReorder]);

  // Mouse events
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleDragMove(e.clientX, e.clientY);
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
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  // Touch events
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      handleDragEnd();
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  const createDragHandleProps = useCallback(
    (index: number): DragHandleProps => ({
      onMouseDown: (e: React.MouseEvent) => {
        e.preventDefault();
        handleDragStart(index, e.clientX, e.clientY);
      },
      onTouchStart: (e: React.TouchEvent) => {
        const touch = e.touches[0];
        handleDragStart(index, touch.clientX, touch.clientY);
      },
      className: 'cursor-grab active:cursor-grabbing touch-none select-none',
      'aria-label': 'Arrastrar para reordenar',
      role: 'button',
      tabIndex: 0,
    }),
    [handleDragStart]
  );

  const getDragTransform = useCallback(
    (index: number): React.CSSProperties => {
      if (!dragState.isDragging || dragState.dragIndex === null) {
        return {};
      }

      if (index === dragState.dragIndex) {
        const deltaY = dragState.currentY - dragState.startY;
        const deltaX = dragState.currentX - dragState.startX;
        const translate = direction === 'vertical' ? `translateY(${deltaY}px)` : `translateX(${deltaX}px)`;
        return {
          transform: translate,
          transition: 'none',
          zIndex: 10,
        };
      }

      return {
        transition: 'transform 0.2s ease',
      };
    },
    [dragState, direction]
  );

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        display: 'flex',
        flexDirection: direction === 'vertical' ? 'column' : 'row',
        gap,
      }}
    >
      {previewOrder.map((item, index) => {
        const key = keyExtractor(item, index);
        const originalIndex = items.findIndex((i) => keyExtractor(i, items.indexOf(i)) === key);
        const isDragging = dragState.dragIndex === originalIndex;

        return (
          <div
            key={key}
            ref={(el) => {
              if (el) {
                itemRefs.current.set(key, el);
              } else {
                itemRefs.current.delete(key);
              }
            }}
            className={`${itemClassName} ${isDragging ? activeItemClassName : ''}`}
            style={getDragTransform(originalIndex)}
          >
            {renderItem(item, index, createDragHandleProps(originalIndex))}
          </div>
        );
      })}
    </div>
  );
}

/**
 * DragHandle - Pre-styled drag handle component
 */
interface DragHandleComponentProps extends DragHandleProps {
  size?: number;
}

export const DragHandle: React.FC<DragHandleComponentProps> = ({
  size = 20,
  className = '',
  ...props
}) => (
  <button
    {...props}
    className={`p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ${className}`}
  >
    <GripVertical size={size} />
  </button>
);

/**
 * SortableList - Pre-configured sortable list with drag handles
 */
interface SortableListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  keyExtractor: (item: T) => string;
  renderContent: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function SortableList<T>({
  items,
  onReorder,
  keyExtractor,
  renderContent,
  className = '',
}: SortableListProps<T>) {
  return (
    <DragReorder
      items={items}
      onReorder={onReorder}
      keyExtractor={(item) => keyExtractor(item)}
      className={className}
      itemClassName="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
      renderItem={(item, index, dragHandleProps) => (
        <div className="flex items-center p-3">
          <DragHandle {...dragHandleProps} />
          <div className="flex-1 ml-2">{renderContent(item, index)}</div>
        </div>
      )}
    />
  );
}

export default DragReorder;
