import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Filter,
  SortAsc,
  SortDesc,
  X,
  ChevronDown,
  Check,
  Search,
  Sliders,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { useBottomSheet } from './BottomSheet';

// ============================================
// Types
// ============================================

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'range' | 'search' | 'toggle';
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
}

interface ActiveFilter {
  id: string;
  value: unknown;
}

interface SortOption {
  value: string;
  label: string;
  direction?: 'asc' | 'desc';
}

interface FiltersProps {
  filters: FilterConfig[];
  activeFilters: ActiveFilter[];
  onFilterChange: (filters: ActiveFilter[]) => void;
  sortOptions?: SortOption[];
  activeSort?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (sort: string, direction: 'asc' | 'desc') => void;
  onClear?: () => void;
  className?: string;
  variant?: 'inline' | 'sheet' | 'sidebar';
}

// ============================================
// FilterChip Component
// ============================================

interface FilterChipProps {
  label: string;
  value?: string;
  onRemove: () => void;
  onClick?: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  value,
  onRemove,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-oaxaca-pink/10 text-oaxaca-pink rounded-full text-sm ${
      onClick ? 'cursor-pointer hover:bg-oaxaca-pink/20' : ''
    }`}
  >
    <span className="font-medium">{label}</span>
    {value && <span className="text-oaxaca-pink/70">: {value}</span>}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
        triggerHaptic('light');
      }}
      className="p-0.5 hover:bg-oaxaca-pink/20 rounded-full"
    >
      <X size={14} />
    </button>
  </div>
);

// ============================================
// SelectFilter Component
// ============================================

interface SelectFilterProps {
  config: FilterConfig;
  value?: string;
  onChange: (value: string | null) => void;
  className?: string;
}

export const SelectFilter: React.FC<SelectFilterProps> = ({
  config,
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = config.options?.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl transition-colors ${
          value
            ? 'border-oaxaca-pink bg-oaxaca-pink/5 text-oaxaca-pink'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
        }`}
      >
        <span>{selectedOption?.label || config.label}</span>
        <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 mt-2 left-0 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            {value && (
              <button
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                  triggerHaptic('light');
                }}
                className="w-full px-4 py-2.5 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
              >
                Limpiar filtro
              </button>
            )}
            {config.options?.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  triggerHaptic('selection');
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  value === option.value ? 'text-oaxaca-pink' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{option.label}</span>
                <div className="flex items-center gap-2">
                  {option.count !== undefined && (
                    <span className="text-xs text-gray-400">{option.count}</span>
                  )}
                  {value === option.value && <Check size={16} />}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// MultiSelectFilter Component
// ============================================

interface MultiSelectFilterProps {
  config: FilterConfig;
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  config,
  values = [],
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleValue = (value: string) => {
    const newValues = values.includes(value)
      ? values.filter((v) => v !== value)
      : [...values, value];
    onChange(newValues);
    triggerHaptic('selection');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl transition-colors ${
          values.length > 0
            ? 'border-oaxaca-pink bg-oaxaca-pink/5 text-oaxaca-pink'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
        }`}
      >
        <span>
          {values.length > 0 ? `${config.label} (${values.length})` : config.label}
        </span>
        <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 mt-2 left-0 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden max-h-64 overflow-y-auto">
            {values.length > 0 && (
              <button
                onClick={() => {
                  onChange([]);
                  triggerHaptic('light');
                }}
                className="w-full px-4 py-2.5 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm border-b border-gray-100 dark:border-gray-700"
              >
                Limpiar selección
              </button>
            )}
            {config.options?.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleValue(option.value)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    values.includes(option.value)
                      ? 'bg-oaxaca-pink border-oaxaca-pink'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {values.includes(option.value) && (
                    <Check size={14} className="text-white" />
                  )}
                </div>
                <span className="flex-1 text-gray-700 dark:text-gray-300">{option.label}</span>
                {option.count !== undefined && (
                  <span className="text-xs text-gray-400">{option.count}</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// RangeFilter Component
// ============================================

interface RangeFilterProps {
  config: FilterConfig;
  value?: { min: number; max: number };
  onChange: (value: { min: number; max: number } | null) => void;
  className?: string;
}

export const RangeFilter: React.FC<RangeFilterProps> = ({
  config,
  value,
  onChange,
  className = '',
}) => {
  const [localValue, setLocalValue] = useState({
    min: value?.min ?? config.min ?? 0,
    max: value?.max ?? config.max ?? 100,
  });

  const handleChange = (type: 'min' | 'max', newValue: number) => {
    const updated = { ...localValue, [type]: newValue };
    setLocalValue(updated);
    onChange(updated);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {config.label}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={localValue.min}
          onChange={(e) => handleChange('min', parseInt(e.target.value) || 0)}
          min={config.min}
          max={localValue.max}
          step={config.step}
          className="w-24 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        />
        <span className="text-gray-400">-</span>
        <input
          type="number"
          value={localValue.max}
          onChange={(e) => handleChange('max', parseInt(e.target.value) || 0)}
          min={localValue.min}
          max={config.max}
          step={config.step}
          className="w-24 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        />
      </div>
    </div>
  );
};

// ============================================
// SortButton Component
// ============================================

interface SortButtonProps {
  options: SortOption[];
  activeSort?: string;
  direction?: 'asc' | 'desc';
  onChange: (sort: string, direction: 'asc' | 'desc') => void;
  className?: string;
}

export const SortButton: React.FC<SortButtonProps> = ({
  options,
  activeSort,
  direction = 'desc',
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeOption = options.find((opt) => opt.value === activeSort);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-oaxaca-pink transition-colors"
      >
        {direction === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
        <span>{activeOption?.label || 'Ordenar'}</span>
        <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 mt-2 right-0 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  const newDirection = activeSort === option.value
                    ? direction === 'asc' ? 'desc' : 'asc'
                    : option.direction || 'desc';
                  onChange(option.value, newDirection);
                  setIsOpen(false);
                  triggerHaptic('selection');
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  activeSort === option.value ? 'text-oaxaca-pink' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{option.label}</span>
                {activeSort === option.value && (
                  direction === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// Filters Component
// ============================================

const Filters: React.FC<FiltersProps> = ({
  filters,
  activeFilters,
  onFilterChange,
  sortOptions,
  activeSort,
  sortDirection = 'desc',
  onSortChange,
  onClear,
  className = '',
  variant = 'inline',
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const getFilterValue = (filterId: string) =>
    activeFilters.find((f) => f.id === filterId)?.value;

  const setFilterValue = (filterId: string, value: unknown) => {
    const newFilters = activeFilters.filter((f) => f.id !== filterId);
    if (value !== null && value !== undefined && (Array.isArray(value) ? value.length > 0 : true)) {
      newFilters.push({ id: filterId, value });
    }
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange([]);
    onClear?.();
    triggerHaptic('light');
  };

  const renderFilterInput = (config: FilterConfig) => {
    switch (config.type) {
      case 'select':
        return (
          <SelectFilter
            key={config.id}
            config={config}
            value={getFilterValue(config.id) as string}
            onChange={(v) => setFilterValue(config.id, v)}
          />
        );
      case 'multiselect':
        return (
          <MultiSelectFilter
            key={config.id}
            config={config}
            values={(getFilterValue(config.id) as string[]) || []}
            onChange={(v) => setFilterValue(config.id, v)}
          />
        );
      case 'range':
        return (
          <RangeFilter
            key={config.id}
            config={config}
            value={getFilterValue(config.id) as { min: number; max: number }}
            onChange={(v) => setFilterValue(config.id, v)}
          />
        );
      default:
        return null;
    }
  };

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={className}>
        <div className="flex flex-wrap items-center gap-3">
          {filters.map(renderFilterInput)}

          {sortOptions && onSortChange && (
            <SortButton
              options={sortOptions}
              activeSort={activeSort}
              direction={sortDirection}
              onChange={onSortChange}
            />
          )}

          {activeFilters.length > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Limpiar todo
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {activeFilters.map((filter) => {
              const config = filters.find((f) => f.id === filter.id);
              if (!config) return null;

              const getDisplayValue = () => {
                if (Array.isArray(filter.value)) {
                  return `${filter.value.length} seleccionados`;
                }
                if (typeof filter.value === 'object' && filter.value !== null) {
                  const range = filter.value as { min: number; max: number };
                  return `${range.min} - ${range.max}`;
                }
                const option = config.options?.find((o) => o.value === filter.value);
                return option?.label || String(filter.value);
              };

              return (
                <FilterChip
                  key={filter.id}
                  label={config.label}
                  value={getDisplayValue()}
                  onRemove={() => setFilterValue(filter.id, null)}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Sheet variant (mobile)
  return (
    <div className={className}>
      <button
        onClick={() => setIsSheetOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-oaxaca-pink transition-colors"
      >
        <Sliders size={18} />
        <span>Filtros</span>
        {activeFilters.length > 0 && (
          <span className="px-2 py-0.5 bg-oaxaca-pink text-white text-xs rounded-full">
            {activeFilters.length}
          </span>
        )}
      </button>

      {/* Bottom Sheet would be rendered here using BottomSheet component */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsSheetOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl p-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filtros
              </h3>
              <button
                onClick={() => setIsSheetOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {filters.map(renderFilterInput)}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={clearAllFilters}
                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300"
              >
                Limpiar
              </button>
              <button
                onClick={() => setIsSheetOpen(false)}
                className="flex-1 py-3 bg-oaxaca-pink text-white rounded-xl"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// useFilters Hook
// ============================================

export const useFilters = <T extends Record<string, unknown>>(initialFilters: T = {} as T) => {
  const [filters, setFilters] = useState<T>(initialFilters);
  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);

  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilter = useCallback(<K extends keyof T>(key: K) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(initialFilters);
    setSort(null);
  }, [initialFilters]);

  const setSort_ = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSort({ field, direction });
  }, []);

  const activeFiltersCount = Object.keys(filters).filter(
    (key) => filters[key] !== undefined && filters[key] !== null
  ).length;

  return {
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    sort,
    setSort: setSort_,
    activeFiltersCount,
  };
};

export default Filters;
