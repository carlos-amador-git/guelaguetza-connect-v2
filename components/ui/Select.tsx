import React from 'react';

// ============================================
// Basic Select
// ============================================

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outlined' | 'filled';
  fullWidth?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  label,
  error,
  hint,
  disabled = false,
  size = 'md',
  variant = 'outlined',
  fullWidth = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const sizes = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base',
    lg: 'h-13 text-lg',
  };

  const variants = {
    outlined: `
      bg-white dark:bg-gray-900 border-2
      ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}
      ${!error && !disabled ? 'focus-within:border-oaxaca-pink' : ''}
    `,
    filled: `
      bg-gray-100 dark:bg-gray-800 border-2 border-transparent
      ${error ? 'bg-red-50 dark:bg-red-900/20' : ''}
      ${!error && !disabled ? 'focus-within:bg-gray-50 dark:focus-within:bg-gray-700' : ''}
    `,
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`} ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            ${sizes[size]}
            ${variants[variant]}
            ${fullWidth ? 'w-full' : 'min-w-[200px]'}
            px-4 rounded-xl flex items-center justify-between gap-2
            transition-colors
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span className={`flex items-center gap-2 truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
            {selectedOption?.icon}
            {selectedOption?.label || placeholder}
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                disabled={option.disabled}
                className={`
                  w-full px-4 py-2.5 text-left flex items-center gap-3
                  ${value === option.value
                    ? 'bg-oaxaca-pink/10 text-oaxaca-pink'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                  ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {option.icon && <span className="w-5 h-5 flex-shrink-0">{option.icon}</span>}
                <div className="flex-1 min-w-0">
                  <div className="truncate">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{option.description}</div>
                  )}
                </div>
                {value === option.value && (
                  <svg className="w-5 h-5 text-oaxaca-pink flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {(error || hint) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
};

// ============================================
// Multi Select
// ============================================

interface MultiSelectProps {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  maxSelected?: number;
  showSelectedCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  label,
  error,
  hint,
  disabled = false,
  maxSelected,
  showSelectedCount = true,
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOptions = options.filter(opt => value.includes(opt.value));

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else if (!maxSelected || value.length < maxSelected) {
      onChange([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const sizes = {
    sm: 'min-h-9 text-sm',
    md: 'min-h-11 text-base',
    lg: 'min-h-13 text-lg',
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`} ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            ${sizes[size]}
            ${fullWidth ? 'w-full' : 'min-w-[200px]'}
            px-3 py-2 rounded-xl border-2
            ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}
            ${!error && !disabled ? 'focus-within:border-oaxaca-pink' : ''}
            bg-white dark:bg-gray-900
            flex items-center gap-2 flex-wrap
            transition-colors
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {selectedOptions.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            <>
              {selectedOptions.slice(0, 3).map(option => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-oaxaca-pink/10 text-oaxaca-pink rounded-lg text-sm"
                >
                  {option.label}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(option.value, e)}
                    className="hover:bg-oaxaca-pink/20 rounded-full"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              {selectedOptions.length > 3 && showSelectedCount && (
                <span className="text-sm text-gray-500">+{selectedOptions.length - 3} más</span>
              )}
            </>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {options.map((option) => {
              const isSelected = value.includes(option.value);
              const isDisabled = option.disabled || (!isSelected && maxSelected && value.length >= maxSelected);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => !isDisabled && handleToggle(option.value)}
                  disabled={isDisabled}
                  className={`
                    w-full px-4 py-2.5 text-left flex items-center gap-3
                    ${isSelected
                      ? 'bg-oaxaca-pink/10 text-oaxaca-pink'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-oaxaca-pink border-oaxaca-pink' : 'border-gray-300 dark:border-gray-600'}`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{option.description}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {(error || hint) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
};

// ============================================
// Autocomplete / Combobox
// ============================================

interface AutocompleteProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  onInputChange?: (query: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  loading?: boolean;
  allowCustom?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  options,
  value,
  onChange,
  onInputChange,
  placeholder = 'Buscar...',
  label,
  error,
  hint,
  disabled = false,
  loading = false,
  allowCustom = false,
  clearable = true,
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = React.useMemo(() => {
    if (!query) return options;
    const lowerQuery = query.toLowerCase();
    return options.filter(
      opt =>
        opt.label.toLowerCase().includes(lowerQuery) ||
        opt.value.toLowerCase().includes(lowerQuery) ||
        opt.description?.toLowerCase().includes(lowerQuery)
    );
  }, [options, query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
    setHighlightedIndex(0);
    onInputChange?.(newQuery);
  };

  const handleSelect = (option: SelectOption) => {
    onChange(option.value);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(i => Math.min(i + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        } else if (allowCustom && query) {
          onChange(query);
          setQuery('');
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
    inputRef.current?.focus();
  };

  const sizes = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base',
    lg: 'h-13 text-lg',
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <div
          className={`
            ${sizes[size]}
            ${fullWidth ? 'w-full' : 'min-w-[200px]'}
            px-4 rounded-xl border-2
            ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}
            ${!error && !disabled ? 'focus-within:border-oaxaca-pink' : ''}
            bg-white dark:bg-gray-900
            flex items-center gap-2
            transition-colors
          `}
        >
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query || (selectedOption && !isOpen ? selectedOption.label : '')}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />

          {loading && (
            <div className="w-5 h-5 border-2 border-oaxaca-pink border-t-transparent rounded-full animate-spin" />
          )}

          {clearable && value && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {isOpen && (filteredOptions.length > 0 || (allowCustom && query)) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {filteredOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                disabled={option.disabled}
                className={`
                  w-full px-4 py-2.5 text-left flex items-center gap-3
                  ${highlightedIndex === index ? 'bg-gray-50 dark:bg-gray-700' : ''}
                  ${value === option.value ? 'text-oaxaca-pink' : 'text-gray-700 dark:text-gray-300'}
                  ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
                `}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option.icon && <span className="w-5 h-5 flex-shrink-0">{option.icon}</span>}
                <div className="flex-1 min-w-0">
                  <div className="truncate">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{option.description}</div>
                  )}
                </div>
              </button>
            ))}

            {allowCustom && query && !filteredOptions.find(o => o.value === query) && (
              <button
                type="button"
                onClick={() => {
                  onChange(query);
                  setQuery('');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5 text-oaxaca-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear "{query}"
              </button>
            )}
          </div>
        )}

        {isOpen && !loading && filteredOptions.length === 0 && !allowCustom && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-4 px-4 z-50 text-center text-gray-500 dark:text-gray-400">
            No se encontraron resultados
          </div>
        )}
      </div>

      {(error || hint) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
};

// ============================================
// Native Select (for mobile)
// ============================================

interface NativeSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ options, label, error, hint, placeholder, size = 'md', fullWidth = false, className = '', ...props }, ref) => {
    const sizes = {
      sm: 'h-9 text-sm',
      md: 'h-11 text-base',
      lg: 'h-13 text-lg',
    };

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            className={`
              ${sizes[size]}
              ${fullWidth ? 'w-full' : 'min-w-[200px]'}
              px-4 pr-10 rounded-xl border-2 appearance-none
              ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}
              ${!error && !props.disabled ? 'focus:border-oaxaca-pink' : ''}
              bg-white dark:bg-gray-900
              text-gray-900 dark:text-white
              transition-colors outline-none
              ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {(error || hint) && (
          <p className={`mt-1.5 text-sm ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

NativeSelect.displayName = 'NativeSelect';

// ============================================
// Country Select
// ============================================

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

const countries: Country[] = [
  { code: 'MX', name: 'México', flag: '🇲🇽', dialCode: '+52' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', dialCode: '+1' },
  { code: 'ES', name: 'España', flag: '🇪🇸', dialCode: '+34' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', dialCode: '+51' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', dialCode: '+502' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', dialCode: '+593' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', dialCode: '+55' },
];

interface CountrySelectProps {
  value?: string;
  onChange: (country: Country) => void;
  label?: string;
  error?: string;
  showDialCode?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  label,
  error,
  showDialCode = false,
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const countryOptions: SelectOption[] = countries.map(country => ({
    value: country.code,
    label: showDialCode ? `${country.flag} ${country.name} (${country.dialCode})` : `${country.flag} ${country.name}`,
    icon: <span className="text-xl">{country.flag}</span>,
  }));

  const handleChange = (code: string) => {
    const country = countries.find(c => c.code === code);
    if (country) {
      onChange(country);
    }
  };

  return (
    <Autocomplete
      options={countryOptions}
      value={value}
      onChange={handleChange}
      label={label}
      error={error}
      placeholder="Buscar país..."
      size={size}
      fullWidth={fullWidth}
      className={className}
    />
  );
};

// ============================================
// Time Picker Select
// ============================================

interface TimeSelectProps {
  value?: string;
  onChange: (time: string) => void;
  label?: string;
  error?: string;
  interval?: number;
  startHour?: number;
  endHour?: number;
  format?: '12h' | '24h';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const TimeSelect: React.FC<TimeSelectProps> = ({
  value,
  onChange,
  label,
  error,
  interval = 30,
  startHour = 0,
  endHour = 24,
  format = '12h',
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const timeOptions = React.useMemo(() => {
    const options: SelectOption[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        let label: string;

        if (format === '12h') {
          const displayHour = hour % 12 || 12;
          const period = hour < 12 ? 'AM' : 'PM';
          label = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
        } else {
          label = timeValue;
        }

        options.push({ value: timeValue, label });
      }
    }
    return options;
  }, [startHour, endHour, interval, format]);

  return (
    <Select
      options={timeOptions}
      value={value}
      onChange={onChange}
      label={label}
      error={error}
      placeholder="Seleccionar hora..."
      size={size}
      fullWidth={fullWidth}
      className={className}
    />
  );
};

// ============================================
// Color Picker Select
// ============================================

interface ColorOption {
  value: string;
  name: string;
}

const defaultColors: ColorOption[] = [
  { value: '#E94D8B', name: 'Rosa Oaxaca' },
  { value: '#D4A574', name: 'Tierra' },
  { value: '#9FC5A5', name: 'Verde Jade' },
  { value: '#EF4444', name: 'Rojo' },
  { value: '#F97316', name: 'Naranja' },
  { value: '#EAB308', name: 'Amarillo' },
  { value: '#22C55E', name: 'Verde' },
  { value: '#06B6D4', name: 'Cyan' },
  { value: '#3B82F6', name: 'Azul' },
  { value: '#8B5CF6', name: 'Violeta' },
  { value: '#EC4899', name: 'Rosa' },
  { value: '#6B7280', name: 'Gris' },
];

interface ColorSelectProps {
  value?: string;
  onChange: (color: string) => void;
  colors?: ColorOption[];
  label?: string;
  allowCustom?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ColorSelect: React.FC<ColorSelectProps> = ({
  value,
  onChange,
  colors = defaultColors,
  label,
  allowCustom = false,
  size = 'md',
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedColor = colors.find(c => c.value === value);

  const sizes = {
    sm: 'h-9',
    md: 'h-11',
    lg: 'h-13',
  };

  return (
    <div className={className} ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          ${sizes[size]}
          w-full px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-900
          flex items-center gap-3
          hover:border-gray-300 dark:hover:border-gray-600
          transition-colors
        `}
      >
        <div
          className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600"
          style={{ backgroundColor: value || '#E5E7EB' }}
        />
        <span className="flex-1 text-left text-gray-900 dark:text-white">
          {selectedColor?.name || 'Seleccionar color'}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute mt-1 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-6 gap-2">
            {colors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => {
                  onChange(color.value);
                  setIsOpen(false);
                }}
                className={`
                  w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
                  ${value === color.value ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-gray-400' : 'border-transparent'}
                `}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>

          {allowCustom && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                Color personalizado:
                <input
                  type="color"
                  value={value || '#000000'}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
