import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((item: T, index: number) => number);
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  keyExtractor?: (item: T, index: number) => string;
  ListEmptyComponent?: React.ReactNode;
  ListHeaderComponent?: React.ReactNode;
  ListFooterComponent?: React.ReactNode;
  estimatedItemSize?: number;
}

/**
 * VirtualList - High-performance virtualized list for large datasets
 *
 * Only renders items that are visible in the viewport, plus a small overscan
 * buffer for smooth scrolling.
 *
 * Usage:
 * <VirtualList
 *   items={data}
 *   itemHeight={60}
 *   renderItem={(item, index, style) => (
 *     <div style={style}>{item.name}</div>
 *   )}
 * />
 */
function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 5,
  className = '',
  onEndReached,
  endReachedThreshold = 0.8,
  keyExtractor,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  estimatedItemSize = 50,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const endReachedCalledRef = useRef(false);

  // Calculate item heights
  const getItemHeight = useCallback(
    (index: number): number => {
      if (typeof itemHeight === 'function') {
        return itemHeight(items[index], index);
      }
      return itemHeight;
    },
    [itemHeight, items]
  );

  // Calculate total height and item positions
  const { totalHeight, itemPositions } = useMemo(() => {
    const positions: number[] = [];
    let total = 0;

    for (let i = 0; i < items.length; i++) {
      positions.push(total);
      total += getItemHeight(i);
    }

    return { totalHeight: total, itemPositions: positions };
  }, [items, getItemHeight]);

  // Find visible range using binary search for variable heights
  const { startIndex, endIndex } = useMemo(() => {
    if (items.length === 0) {
      return { startIndex: 0, endIndex: 0 };
    }

    // Binary search for start index
    let start = 0;
    let end = items.length - 1;

    while (start < end) {
      const mid = Math.floor((start + end) / 2);
      if (itemPositions[mid] + getItemHeight(mid) < scrollTop) {
        start = mid + 1;
      } else {
        end = mid;
      }
    }

    const startIdx = Math.max(0, start - overscan);

    // Find end index
    let endIdx = start;
    let currentTop = itemPositions[start];

    while (endIdx < items.length && currentTop < scrollTop + containerHeight) {
      currentTop += getItemHeight(endIdx);
      endIdx++;
    }

    endIdx = Math.min(items.length, endIdx + overscan);

    return { startIndex: startIdx, endIndex: endIdx };
  }, [items.length, itemPositions, scrollTop, containerHeight, overscan, getItemHeight]);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop: newScrollTop, scrollHeight, clientHeight } = containerRef.current;
    setScrollTop(newScrollTop);

    // Check if end reached
    const scrollPercentage = (newScrollTop + clientHeight) / scrollHeight;
    if (scrollPercentage >= endReachedThreshold && !endReachedCalledRef.current) {
      endReachedCalledRef.current = true;
      onEndReached?.();
    } else if (scrollPercentage < endReachedThreshold - 0.1) {
      endReachedCalledRef.current = false;
    }
  }, [endReachedThreshold, onEndReached]);

  // Set up resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  // Reset end reached flag when items change
  useEffect(() => {
    endReachedCalledRef.current = false;
  }, [items.length]);

  // Generate visible items
  const visibleItems = useMemo(() => {
    const visible: React.ReactNode[] = [];

    for (let i = startIndex; i < endIndex; i++) {
      const item = items[i];
      const top = itemPositions[i];
      const height = getItemHeight(i);

      const style: React.CSSProperties = {
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        height,
      };

      const key = keyExtractor ? keyExtractor(item, i) : i;
      visible.push(
        <div key={key} style={style}>
          {renderItem(item, i, style)}
        </div>
      );
    }

    return visible;
  }, [startIndex, endIndex, items, itemPositions, getItemHeight, keyExtractor, renderItem]);

  if (items.length === 0 && ListEmptyComponent) {
    return (
      <div className={className}>
        {ListHeaderComponent}
        {ListEmptyComponent}
        {ListFooterComponent}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      onScroll={handleScroll}
    >
      {ListHeaderComponent}
      <div
        style={{
          position: 'relative',
          height: totalHeight,
          width: '100%',
        }}
      >
        {visibleItems}
      </div>
      {ListFooterComponent}
    </div>
  );
}

/**
 * SimpleVirtualList - Simplified virtual list for fixed-height items
 */
interface SimpleVirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  gap?: number;
}

export function SimpleVirtualList<T>({
  items,
  itemHeight,
  renderItem,
  className = '',
  gap = 0,
}: SimpleVirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  const totalHeight = items.length * (itemHeight + gap) - gap;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateVisibleRange = () => {
      const { scrollTop, clientHeight } = container;
      const start = Math.floor(scrollTop / (itemHeight + gap));
      const visibleCount = Math.ceil(clientHeight / (itemHeight + gap));
      const overscan = 5;

      setVisibleRange({
        start: Math.max(0, start - overscan),
        end: Math.min(items.length, start + visibleCount + overscan * 2),
      });
    };

    updateVisibleRange();
    container.addEventListener('scroll', updateVisibleRange);
    window.addEventListener('resize', updateVisibleRange);

    return () => {
      container.removeEventListener('scroll', updateVisibleRange);
      window.removeEventListener('resize', updateVisibleRange);
    };
  }, [items.length, itemHeight, gap]);

  return (
    <div ref={containerRef} className={`overflow-auto ${className}`}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        {items.slice(visibleRange.start, visibleRange.end).map((item, i) => {
          const actualIndex = visibleRange.start + i;
          return (
            <div
              key={actualIndex}
              style={{
                position: 'absolute',
                top: actualIndex * (itemHeight + gap),
                left: 0,
                right: 0,
                height: itemHeight,
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * useVirtualScroll - Hook for custom virtual scroll implementations
 */
export function useVirtualScroll<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
  }
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    handleScroll,
    setScrollTop,
  };
}

export default VirtualList;
