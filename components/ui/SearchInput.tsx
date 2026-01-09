import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Clock, TrendingUp, ArrowUpRight } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

// ============================================
// Debounce Hook
// ============================================

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// Search History Hook
// ============================================

const HISTORY_KEY = 'guelaguetza_search_history';
const MAX_HISTORY = 10;

export const useSearchHistory = () => {
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;

    setHistory((prev) => {
      const filtered = prev.filter((item) => item !== query);
      const updated = [query, ...filtered].slice(0, MAX_HISTORY);

      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }

      return updated;
    });
  }, []);

  const removeFromHistory = useCallback((query: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item !== query);

      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }

      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  return { history, addToHistory, removeFromHistory, clearHistory };
};

// ============================================
// Types
// ============================================

interface Suggestion {
  id: string;
  text: string;
  type: 'recent' | 'trending' | 'suggestion';
  metadata?: Record<string, unknown>;
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  suggestions?: Suggestion[];
  onSuggestionSelect?: (suggestion: Suggestion) => void;
  showHistory?: boolean;
  trendingSearches?: string[];
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  loading?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

// ============================================
// SearchInput Component
// ============================================

/**
 * SearchInput - Advanced search input with debounce and suggestions
 *
 * Features:
 * - Debounced search
 * - Recent search history
 * - Trending searches
 * - Autocomplete suggestions
 * - Keyboard navigation
 *
 * Usage:
 * <SearchInput
 *   value={query}
 *   onChange={setQuery}
 *   onSearch={handleSearch}
 *   suggestions={suggestions}
 * />
 */
const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Buscar...',
  debounceMs = 300,
  suggestions = [],
  onSuggestionSelect,
  showHistory = true,
  trendingSearches = [],
  className = '',
  inputClassName = '',
  autoFocus = false,
  loading = false,
  onFocus,
  onBlur,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedValue = useDebounce(value, debounceMs);

  const { history, addToHistory, removeFromHistory } = useSearchHistory();

  // Trigger search on debounced value change
  useEffect(() => {
    if (debouncedValue.trim()) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);

  // Build combined suggestions list
  const allSuggestions = useMemo((): Suggestion[] => {
    if (value.trim()) {
      return suggestions;
    }

    const items: Suggestion[] = [];

    // Add recent searches
    if (showHistory) {
      history.slice(0, 5).forEach((text, i) => {
        items.push({
          id: `recent-${i}`,
          text,
          type: 'recent',
        });
      });
    }

    // Add trending searches
    trendingSearches.slice(0, 5).forEach((text, i) => {
      if (!history.includes(text)) {
        items.push({
          id: `trending-${i}`,
          text,
          type: 'trending',
        });
      }
    });

    return items;
  }, [value, suggestions, history, trendingSearches, showHistory]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < allSuggestions.length - 1 ? prev + 1 : prev
          );
          triggerHaptic('selection');
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          triggerHaptic('selection');
          break;

        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
            const suggestion = allSuggestions[selectedIndex];
            handleSuggestionSelect(suggestion);
          } else if (value.trim()) {
            addToHistory(value.trim());
            onSearch(value.trim());
          }
          triggerHaptic('impact');
          break;

        case 'Escape':
          e.preventDefault();
          inputRef.current?.blur();
          setIsFocused(false);
          break;
      }
    },
    [allSuggestions, selectedIndex, value, addToHistory, onSearch]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: Suggestion) => {
      onChange(suggestion.text);
      addToHistory(suggestion.text);
      onSuggestionSelect?.(suggestion);
      onSearch(suggestion.text);
      setIsFocused(false);
      triggerHaptic('impact');
    },
    [onChange, addToHistory, onSuggestionSelect, onSearch]
  );

  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
    triggerHaptic('light');
  }, [onChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setSelectedIndex(-1);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    // Delay to allow click on suggestions
    setTimeout(() => {
      setIsFocused(false);
      onBlur?.();
    }, 150);
  }, [onBlur]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = isFocused && allSuggestions.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Container */}
      <div className="relative">
        <Search
          size={20}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full pl-10 pr-10 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-oaxaca-pink ${inputClassName}`}
        />

        {/* Loading indicator or clear button */}
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            tabIndex={-1}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-oaxaca-pink rounded-full animate-spin" />
            ) : (
              <X size={20} />
            )}
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
          {/* Section headers */}
          {!value.trim() && history.length > 0 && (
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">
              Búsquedas recientes
            </div>
          )}

          {/* Suggestions list */}
          <div className="max-h-80 overflow-auto">
            {allSuggestions.map((suggestion, index) => {
              const isRecent = suggestion.type === 'recent';
              const isTrending = suggestion.type === 'trending';
              const isSelected = index === selectedIndex;

              // Show section header for trending
              const showTrendingHeader =
                isTrending &&
                (index === 0 || allSuggestions[index - 1]?.type !== 'trending');

              return (
                <React.Fragment key={suggestion.id}>
                  {showTrendingHeader && !value.trim() && (
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">
                      Tendencias
                    </div>
                  )}
                  <button
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {/* Icon */}
                    {isRecent && (
                      <Clock size={18} className="text-gray-400 flex-shrink-0" />
                    )}
                    {isTrending && (
                      <TrendingUp size={18} className="text-oaxaca-pink flex-shrink-0" />
                    )}
                    {suggestion.type === 'suggestion' && (
                      <ArrowUpRight size={18} className="text-gray-400 flex-shrink-0" />
                    )}

                    {/* Text */}
                    <span className="flex-1 text-gray-900 dark:text-white truncate">
                      {suggestion.text}
                    </span>

                    {/* Remove button for recent */}
                    {isRecent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(suggestion.text);
                          triggerHaptic('light');
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// SearchOverlay - Full screen search
// ============================================

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  suggestions?: Suggestion[];
  trendingSearches?: string[];
  loading?: boolean;
  children?: React.ReactNode;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  onSearch,
  suggestions = [],
  trendingSearches = [],
  loading = false,
  children,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="safe-area-inset-top px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            onSearch={onSearch}
            suggestions={suggestions}
            trendingSearches={trendingSearches}
            loading={loading}
            autoFocus
            className="flex-1"
          />
          <button
            onClick={onClose}
            className="text-oaxaca-pink font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

// ============================================
// useSearch Hook
// ============================================

interface UseSearchOptions<T> {
  searchFn: (query: string) => Promise<T[]>;
  debounceMs?: number;
  minLength?: number;
}

export function useSearch<T>({
  searchFn,
  debounceMs = 300,
  minLength = 2,
}: UseSearchOptions<T>) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    if (debouncedQuery.length < minLength) {
      setResults([]);
      return;
    }

    let cancelled = false;

    const search = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await searchFn(debouncedQuery);
        if (!cancelled) {
          setResults(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Search failed'));
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    search();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, minLength, searchFn]);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clear,
  };
}

export default SearchInput;
