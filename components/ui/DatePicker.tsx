import React, { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, X } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

// ============================================
// Types
// ============================================

interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  format?: string;
  showTime?: boolean;
  className?: string;
  locale?: string;
}

interface CalendarProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  markedDates?: Date[];
  onMonthChange?: (date: Date) => void;
  className?: string;
  locale?: string;
}

// ============================================
// Utilities
// ============================================

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const isSameDay = (d1: Date, d2: Date): boolean =>
  d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getFullYear() === d2.getFullYear();

const isToday = (date: Date): boolean => isSameDay(date, new Date());

const getDaysInMonth = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate();

const getFirstDayOfMonth = (year: number, month: number): number =>
  new Date(year, month, 1).getDay();

const formatDate = (date: Date, format: string, locale: string = 'es-MX'): string => {
  const options: Intl.DateTimeFormatOptions = {};

  if (format.includes('YYYY') || format.includes('yyyy')) {
    options.year = 'numeric';
  }
  if (format.includes('MM')) {
    options.month = '2-digit';
  } else if (format.includes('MMM')) {
    options.month = 'short';
  } else if (format.includes('MMMM')) {
    options.month = 'long';
  }
  if (format.includes('DD') || format.includes('dd')) {
    options.day = '2-digit';
  }
  if (format.includes('HH') || format.includes('hh')) {
    options.hour = '2-digit';
  }
  if (format.includes('mm')) {
    options.minute = '2-digit';
  }

  return new Intl.DateTimeFormat(locale, options).format(date);
};

// ============================================
// Calendar Component
// ============================================

export const Calendar: React.FC<CalendarProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  markedDates = [],
  onMonthChange,
  className = '',
  locale = 'es-MX',
}) => {
  const [viewDate, setViewDate] = useState(value || new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];

    // Empty slots for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [year, month, daysInMonth, firstDayOfMonth]);

  // Navigate months
  const goToPrevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    setViewDate(newDate);
    onMonthChange?.(newDate);
    triggerHaptic('selection');
  };

  const goToNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    setViewDate(newDate);
    onMonthChange?.(newDate);
    triggerHaptic('selection');
  };

  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    onMonthChange?.(today);
    triggerHaptic('selection');
  };

  // Check if date is disabled
  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < new Date(minDate.setHours(0, 0, 0, 0))) return true;
    if (maxDate && date > new Date(maxDate.setHours(23, 59, 59, 999))) return true;
    return false;
  };

  // Check if date is marked
  const isDateMarked = (date: Date): boolean =>
    markedDates.some((d) => isSameDay(d, date));

  // Select date
  const selectDate = (date: Date) => {
    if (isDateDisabled(date)) return;
    onChange?.(date);
    triggerHaptic('impact');
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>

        <button
          onClick={goToToday}
          className="text-lg font-semibold text-gray-900 dark:text-white hover:text-oaxaca-pink transition-colors"
        >
          {MONTHS_ES[month]} {year}
        </button>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_ES.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const isSelected = value && isSameDay(date, value);
          const isTodayDate = isToday(date);
          const isDisabled = isDateDisabled(date);
          const isMarked = isDateMarked(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => selectDate(date)}
              disabled={isDisabled}
              className={`aspect-square rounded-lg text-sm font-medium transition-all relative
                ${isSelected
                  ? 'bg-oaxaca-pink text-white'
                  : isTodayDate
                  ? 'bg-oaxaca-pink/10 text-oaxaca-pink'
                  : isDisabled
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              {date.getDate()}
              {isMarked && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-oaxaca-pink rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// DatePicker Component
// ============================================

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  placeholder = 'Seleccionar fecha',
  format = 'DD/MM/YYYY',
  showTime = false,
  className = '',
  locale = 'es-MX',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState({ hours: 12, minutes: 0 });

  const displayValue = value
    ? formatDate(value, showTime ? `${format} HH:mm` : format, locale)
    : '';

  const handleDateSelect = (date: Date) => {
    if (showTime) {
      date.setHours(time.hours, time.minutes);
    }
    onChange?.(date);
    if (!showTime) {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (type: 'hours' | 'minutes', newValue: number) => {
    const newTime = { ...time, [type]: newValue };
    setTime(newTime);

    if (value) {
      const newDate = new Date(value);
      newDate.setHours(newTime.hours, newTime.minutes);
      onChange?.(newDate);
    }
  };

  const handleClear = () => {
    onChange?.(null);
    triggerHaptic('light');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center gap-3 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-left transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-oaxaca-pink'
        } ${isOpen ? 'ring-2 ring-oaxaca-pink' : ''}`}
      >
        <Calendar size={20} className="text-gray-400 flex-shrink-0" />
        <span
          className={`flex-1 ${
            value ? 'text-gray-900 dark:text-white' : 'text-gray-400'
          }`}
        >
          {displayValue || placeholder}
        </span>
        {value && !disabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-2 left-0 right-0 sm:left-auto sm:right-auto sm:w-auto">
            <Calendar
              value={value}
              onChange={handleDateSelect}
              minDate={minDate}
              maxDate={maxDate}
              locale={locale}
            />

            {/* Time picker */}
            {showTime && (
              <div className="bg-white dark:bg-gray-800 rounded-b-xl border-t border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center gap-4">
                  <Clock size={20} className="text-gray-400" />
                  <div className="flex items-center gap-2">
                    <select
                      value={time.hours}
                      onChange={(e) => handleTimeChange('hours', parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oaxaca-pink"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-500">:</span>
                    <select
                      value={time.minutes}
                      onChange={(e) => handleTimeChange('minutes', parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oaxaca-pink"
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full mt-4 py-2 bg-oaxaca-pink text-white rounded-lg font-medium hover:opacity-90"
                >
                  Confirmar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// DateRangePicker Component
// ============================================

interface DateRangePickerProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onChange?: (range: { start: Date | null; end: Date | null }) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  placeholder = 'Seleccionar rango',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');

  const displayValue =
    startDate && endDate
      ? `${formatDate(startDate, 'DD/MM/YYYY')} - ${formatDate(endDate, 'DD/MM/YYYY')}`
      : startDate
      ? `${formatDate(startDate, 'DD/MM/YYYY')} - ...`
      : '';

  const handleDateSelect = (date: Date) => {
    if (selecting === 'start') {
      onChange?.({ start: date, end: null });
      setSelecting('end');
    } else {
      if (startDate && date < startDate) {
        onChange?.({ start: date, end: startDate });
      } else {
        onChange?.({ start: startDate, end: date });
      }
      setSelecting('start');
      setIsOpen(false);
    }
    triggerHaptic('selection');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center gap-3 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-left transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-oaxaca-pink'
        }`}
      >
        <Calendar size={20} className="text-gray-400 flex-shrink-0" />
        <span
          className={`flex-1 ${
            startDate ? 'text-gray-900 dark:text-white' : 'text-gray-400'
          }`}
        >
          {displayValue || placeholder}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-2 left-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {selecting === 'start' ? 'Selecciona fecha de inicio' : 'Selecciona fecha de fin'}
              </div>
              <Calendar
                value={selecting === 'start' ? startDate : endDate}
                onChange={handleDateSelect}
                minDate={selecting === 'end' ? startDate || minDate : minDate}
                maxDate={maxDate}
                markedDates={[startDate, endDate].filter(Boolean) as Date[]}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// Quick Date Presets
// ============================================

interface DatePresetsProps {
  onSelect: (range: { start: Date; end: Date }) => void;
  className?: string;
}

export const DatePresets: React.FC<DatePresetsProps> = ({
  onSelect,
  className = '',
}) => {
  const presets = [
    {
      label: 'Hoy',
      getValue: () => {
        const today = new Date();
        return { start: today, end: today };
      },
    },
    {
      label: 'Ayer',
      getValue: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: yesterday };
      },
    },
    {
      label: 'Últimos 7 días',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return { start, end };
      },
    },
    {
      label: 'Últimos 30 días',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return { start, end };
      },
    },
    {
      label: 'Este mes',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start, end };
      },
    },
    {
      label: 'Mes pasado',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start, end };
      },
    },
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {presets.map((preset) => (
        <button
          key={preset.label}
          onClick={() => {
            onSelect(preset.getValue());
            triggerHaptic('selection');
          }}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-oaxaca-pink hover:text-white transition-colors"
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
};

export default DatePicker;
