import React, { useMemo, useRef, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';
import { Counter } from './Animations';

// ============================================
// Types
// ============================================

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

// ============================================
// StatCard Component
// ============================================

interface StatCardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percent';
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  className?: string;
  animate?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  previousValue,
  format = 'number',
  icon,
  trend,
  trendValue,
  className = '',
  animate = true,
}) => {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN',
          minimumFractionDigits: 0,
        }).format(val);
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('es-MX').format(val);
    }
  };

  // Calculate trend if previous value provided
  const calculatedTrend = useMemo(() => {
    if (trend) return trend;
    if (previousValue !== undefined && typeof value === 'number') {
      const diff = value - previousValue;
      if (diff > 0) return 'up';
      if (diff < 0) return 'down';
      return 'neutral';
    }
    return undefined;
  }, [trend, previousValue, value]);

  const calculatedTrendValue = useMemo(() => {
    if (trendValue !== undefined) return trendValue;
    if (previousValue !== undefined && previousValue !== 0 && typeof value === 'number') {
      return ((value - previousValue) / previousValue) * 100;
    }
    return undefined;
  }, [trendValue, previousValue, value]);

  const getTrendIcon = () => {
    switch (calculatedTrend) {
      case 'up':
        return <TrendingUp size={16} className="text-green-500" />;
      case 'down':
        return <TrendingDown size={16} className="text-red-500" />;
      default:
        return <Minus size={16} className="text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (calculatedTrend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {animate && typeof value === 'number' ? (
              <Counter to={value} formatter={(v) => formatValue(v)} />
            ) : (
              formatValue(value)
            )}
          </div>
          {calculatedTrend && calculatedTrendValue !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{Math.abs(calculatedTrendValue).toFixed(1)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-oaxaca-pink/10 text-oaxaca-pink rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// ProgressBar Component
// ============================================

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = true,
  color = 'bg-oaxaca-pink',
  size = 'md',
  animate = true,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>}
          {showValue && (
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} ${color} rounded-full ${animate ? 'transition-all duration-500 ease-out' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// ============================================
// DonutChart Component
// ============================================

interface DonutChartProps {
  data: DataPoint[];
  size?: number;
  thickness?: number;
  showLegend?: boolean;
  showTotal?: boolean;
  totalLabel?: string;
  className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 160,
  thickness = 20,
  showLegend = true,
  showTotal = true,
  totalLabel = 'Total',
  className = '',
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const defaultColors = [
    '#E91E8C', // oaxaca-pink
    '#FFB800', // oaxaca-yellow
    '#00B4D8',
    '#2ECC71',
    '#9B59B6',
    '#E74C3C',
    '#3498DB',
  ];

  let currentOffset = 0;

  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {/* Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            className="text-gray-200 dark:text-gray-700"
          />

          {/* Data segments */}
          {data.map((item, index) => {
            const percentage = total > 0 ? item.value / total : 0;
            const strokeLength = circumference * percentage;
            const offset = currentOffset;
            currentOffset += strokeLength;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color || defaultColors[index % defaultColors.length]}
                strokeWidth={thickness}
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>

        {/* Center text */}
        {showTotal && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {total.toLocaleString('es-MX')}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{totalLabel}</span>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-col gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || defaultColors[index % defaultColors.length] }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white ml-auto">
                {item.value.toLocaleString('es-MX')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// BarChart Component
// ============================================

interface BarChartProps {
  data: DataPoint[];
  maxValue?: number;
  horizontal?: boolean;
  showValues?: boolean;
  barHeight?: number;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  maxValue,
  horizontal = true,
  showValues = true,
  barHeight = 32,
  className = '',
}) => {
  const max = maxValue || Math.max(...data.map((d) => d.value));

  const defaultColors = [
    '#E91E8C',
    '#FFB800',
    '#00B4D8',
    '#2ECC71',
    '#9B59B6',
  ];

  if (horizontal) {
    return (
      <div className={`space-y-3 ${className}`}>
        {data.map((item, index) => {
          const percentage = max > 0 ? (item.value / max) * 100 : 0;
          const color = item.color || defaultColors[index % defaultColors.length];

          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                {showValues && (
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.value.toLocaleString('es-MX')}
                  </span>
                )}
              </div>
              <div
                className="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                style={{ height: barHeight / 4 }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical bars
  return (
    <div className={`flex items-end justify-around gap-2 ${className}`} style={{ height: 200 }}>
      {data.map((item, index) => {
        const percentage = max > 0 ? (item.value / max) * 100 : 0;
        const color = item.color || defaultColors[index % defaultColors.length];

        return (
          <div key={index} className="flex flex-col items-center gap-2 flex-1">
            <div className="relative w-full flex justify-center" style={{ height: '80%' }}>
              <div
                className="w-8 rounded-t-lg transition-all duration-500"
                style={{
                  height: `${percentage}%`,
                  backgroundColor: color,
                }}
              />
              {showValues && (
                <span className="absolute -top-6 text-xs font-medium text-gray-900 dark:text-white">
                  {item.value.toLocaleString('es-MX')}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 text-center truncate w-full">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// SparkLine Component
// ============================================

interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  className?: string;
}

export const SparkLine: React.FC<SparkLineProps> = ({
  data,
  width = 100,
  height = 30,
  color = '#E91E8C',
  showArea = true,
  className = '',
}) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPath = `M0,${height} L${points} L${width},${height} Z`;

  return (
    <svg width={width} height={height} className={className}>
      {showArea && (
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill={color}
          fillOpacity={0.1}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ============================================
// MiniStat Component
// ============================================

interface MiniStatProps {
  label: string;
  value: number | string;
  change?: number;
  sparkData?: number[];
  className?: string;
}

export const MiniStat: React.FC<MiniStatProps> = ({
  label,
  value,
  change,
  sparkData,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString('es-MX') : value}
          </span>
          {change !== undefined && (
            <span
              className={`flex items-center text-xs ${
                change >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {Math.abs(change)}%
            </span>
          )}
        </div>
      </div>
      {sparkData && <SparkLine data={sparkData} width={60} height={24} />}
    </div>
  );
};

// ============================================
// Gauge Component
// ============================================

interface GaugeProps {
  value: number;
  max?: number;
  label?: string;
  size?: number;
  thickness?: number;
  color?: string;
  showValue?: boolean;
  className?: string;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  max = 100,
  label,
  size = 120,
  thickness = 12,
  color = '#E91E8C',
  showValue = true,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - thickness) / 2;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size / 2 + 10 }}>
        <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
          {/* Background arc */}
          <path
            d={`M ${thickness / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - thickness / 2} ${size / 2}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            strokeLinecap="round"
            className="text-gray-200 dark:text-gray-700"
          />

          {/* Value arc */}
          <path
            d={`M ${thickness / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - thickness / 2} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>

        {/* Center value */}
        {showValue && (
          <div
            className="absolute left-1/2 -translate-x-1/2 text-center"
            style={{ bottom: 0 }}
          >
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {percentage.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
      {label && (
        <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">{label}</span>
      )}
    </div>
  );
};

// ============================================
// Comparison Component
// ============================================

interface ComparisonProps {
  label: string;
  current: number;
  previous: number;
  format?: 'number' | 'currency' | 'percent';
  className?: string;
}

export const Comparison: React.FC<ComparisonProps> = ({
  label,
  current,
  previous,
  format = 'number',
  className = '',
}) => {
  const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change >= 0;

  const formatValue = (val: number): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN',
          minimumFractionDigits: 0,
        }).format(val);
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('es-MX').format(val);
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg ${className}`}>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          {formatValue(current)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-400">vs {formatValue(previous)}</p>
        <p className={`flex items-center justify-end gap-1 text-sm font-medium ${
          isPositive ? 'text-green-500' : 'text-red-500'
        }`}>
          {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          {Math.abs(change).toFixed(1)}%
        </p>
      </div>
    </div>
  );
};

export default {
  StatCard,
  ProgressBar,
  DonutChart,
  BarChart,
  SparkLine,
  MiniStat,
  Gauge,
  Comparison,
};
