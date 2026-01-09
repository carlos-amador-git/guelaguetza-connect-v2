import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

// ============================================
// Types
// ============================================

interface InfiniteScrollProps {
  children: React.ReactNode;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loading?: boolean;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  LoadingComponent?: React.ReactNode;
  EndComponent?: React.ReactNode;
  ErrorComponent?: React.ReactNode;
  error?: Error | null;
  onRetry?: () => void;
  direction?: 'down' | 'up';
  initialLoad?: boolean;
}

// ============================================
// InfiniteScroll Component
// ============================================

/**
 * InfiniteScroll - Optimized infinite scroll with Intersection Observer
 *
 * Features:
 * - Uses Intersection Observer for performance
 * - Bidirectional scrolling support
 * - Loading and error states
 * - Custom components for loading/end/error
 * - Threshold control
 *
 * Usage:
 * <InfiniteScroll
 *   loadMore={fetchMore}
 *   hasMore={hasMoreData}
 *   loading={isLoading}
 * >
 *   {items.map(item => <Item key={item.id} {...item} />)}
 * </InfiniteScroll>
 */
const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  children,
  loadMore,
  hasMore,
  loading = false,
  threshold = 0.1,
  rootMargin = '100px',
  className = '',
  LoadingComponent,
  EndComponent,
  ErrorComponent,
  error,
  onRetry,
  direction = 'down',
  initialLoad = true,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const [initialLoaded, setInitialLoaded] = useState(!initialLoad);

  // Handle initial load
  useEffect(() => {
    if (initialLoad && !initialLoaded && hasMore && !loading) {
      loadMore().then(() => setInitialLoaded(true));
    }
  }, [initialLoad, initialLoaded, hasMore, loading, loadMore]);

  // Set up Intersection Observer
  useEffect(() => {
    if (!hasMore || loading || !initialLoaded) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loadingRef.current) {
          loadingRef.current = true;
          loadMore().finally(() => {
            loadingRef.current = false;
          });
        }
      },
      {
        root: null,
        rootMargin,
        threshold,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, loadMore, rootMargin, threshold, initialLoaded]);

  const defaultLoadingComponent = (
    <div className="flex items-center justify-center py-4">
      <Loader2 size={24} className="animate-spin text-oaxaca-pink" />
      <span className="ml-2 text-gray-500 dark:text-gray-400">Cargando...</span>
    </div>
  );

  const defaultEndComponent = (
    <div className="flex items-center justify-center py-4 text-gray-400 dark:text-gray-500 text-sm">
      No hay más contenido
    </div>
  );

  const defaultErrorComponent = (
    <div className="flex flex-col items-center justify-center py-4 gap-2">
      <p className="text-red-500">Error al cargar más contenido</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-oaxaca-pink text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Reintentar
        </button>
      )}
    </div>
  );

  const topSentinel = direction === 'up' && (
    <div ref={sentinelRef} className="h-1" aria-hidden="true" />
  );

  const bottomSentinel = direction === 'down' && (
    <div ref={sentinelRef} className="h-1" aria-hidden="true" />
  );

  return (
    <div className={className}>
      {topSentinel}

      {direction === 'up' && loading && (LoadingComponent || defaultLoadingComponent)}

      {children}

      {direction === 'down' && loading && (LoadingComponent || defaultLoadingComponent)}

      {bottomSentinel}

      {error && (ErrorComponent || defaultErrorComponent)}

      {!hasMore && !loading && !error && (EndComponent || defaultEndComponent)}
    </div>
  );
};

// ============================================
// useInfiniteScroll Hook
// ============================================

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>;
  initialPage?: number;
  pageSize?: number;
}

export function useInfiniteScroll<T>({
  fetchFn,
  initialPage = 1,
  pageSize = 20,
}: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page);
      setItems((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load'));
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [fetchFn, page, loading, hasMore]);

  const refresh = useCallback(async () => {
    setPage(initialPage);
    setItems([]);
    setHasMore(true);
    setError(null);
    setInitialLoading(true);

    setLoading(true);
    try {
      const result = await fetchFn(initialPage);
      setItems(result.data);
      setHasMore(result.hasMore);
      setPage(initialPage + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load'));
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [fetchFn, initialPage]);

  const retry = useCallback(() => {
    setError(null);
    loadMore();
  }, [loadMore]);

  // Prepend item (for optimistic updates)
  const prepend = useCallback((item: T) => {
    setItems((prev) => [item, ...prev]);
  }, []);

  // Append item
  const append = useCallback((item: T) => {
    setItems((prev) => [...prev, item]);
  }, []);

  // Update item
  const update = useCallback((predicate: (item: T) => boolean, updater: (item: T) => T) => {
    setItems((prev) => prev.map((item) => (predicate(item) ? updater(item) : item)));
  }, []);

  // Remove item
  const remove = useCallback((predicate: (item: T) => boolean) => {
    setItems((prev) => prev.filter((item) => !predicate(item)));
  }, []);

  return {
    items,
    loading,
    initialLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    retry,
    prepend,
    append,
    update,
    remove,
  };
}

// ============================================
// InfiniteList - Combined infinite scroll + list
// ============================================

interface InfiniteListProps<T> {
  fetchFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  itemClassName?: string;
  EmptyComponent?: React.ReactNode;
  HeaderComponent?: React.ReactNode;
  gap?: number;
}

export function InfiniteList<T>({
  fetchFn,
  renderItem,
  keyExtractor,
  className = '',
  itemClassName = '',
  EmptyComponent,
  HeaderComponent,
  gap = 0,
}: InfiniteListProps<T>) {
  const {
    items,
    loading,
    initialLoading,
    error,
    hasMore,
    loadMore,
    retry,
  } = useInfiniteScroll({ fetchFn });

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-oaxaca-pink" />
      </div>
    );
  }

  if (items.length === 0 && !loading) {
    return EmptyComponent ? (
      <>{EmptyComponent}</>
    ) : (
      <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        No hay contenido disponible
      </div>
    );
  }

  return (
    <InfiniteScroll
      loadMore={loadMore}
      hasMore={hasMore}
      loading={loading}
      error={error}
      onRetry={retry}
      className={className}
      initialLoad={false}
    >
      {HeaderComponent}
      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        {items.map((item, index) => (
          <div key={keyExtractor(item, index)} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </InfiniteScroll>
  );
}

// ============================================
// Scroll Position Restoration
// ============================================

export const useScrollRestoration = (key: string) => {
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    // Restore scroll position
    const savedPosition = sessionStorage.getItem(`scroll_${key}`);
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition, 10));
    }

    // Save scroll position on unmount
    return () => {
      sessionStorage.setItem(`scroll_${key}`, String(scrollPositionRef.current));
    };
  }, [key]);

  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
};

// ============================================
// Load More Button Alternative
// ============================================

interface LoadMoreButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  onClick,
  loading = false,
  disabled = false,
  className = '',
  label = 'Cargar más',
}) => (
  <div className="flex justify-center py-4">
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-medium transition-all hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          Cargando...
        </span>
      ) : (
        label
      )}
    </button>
  </div>
);

export default InfiniteScroll;
