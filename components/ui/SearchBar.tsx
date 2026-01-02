import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { getSuggestions, debounce } from '../../services/search';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  showSuggestions?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Buscar...',
  autoFocus = false,
  showSuggestions = true,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced fetch suggestions
  const fetchSuggestions = useRef(
    debounce(async (query: string) => {
      if (!query || query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const results = await getSuggestions(query);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300)
  ).current;

  useEffect(() => {
    if (showSuggestions && value) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
    }
  }, [value, showSuggestions]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
      setShowDropdown(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    onSearch(suggestion);
    setShowDropdown(false);
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full pl-10 pr-10 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-oaxaca-pink transition-all"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
            </button>
          )}
        </div>
      </form>

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Search size={16} className="text-gray-400" />
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
