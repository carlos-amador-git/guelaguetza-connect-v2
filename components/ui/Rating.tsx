import React, { useState, useCallback, useMemo } from 'react';
import { Star, Heart, ThumbsUp } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

// ============================================
// Types
// ============================================

type RatingIcon = 'star' | 'heart' | 'thumb';
type RatingSize = 'sm' | 'md' | 'lg' | 'xl';

interface RatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  icon?: RatingIcon;
  size?: RatingSize;
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  precision?: 0.5 | 1;
  color?: string;
  emptyColor?: string;
  className?: string;
  label?: string;
}

// ============================================
// Rating Component
// ============================================

/**
 * Rating - Star/heart/thumb rating component
 *
 * Features:
 * - Multiple icon types
 * - Half-star precision
 * - Read-only mode
 * - Customizable colors
 * - Hover preview
 *
 * Usage:
 * <Rating value={4.5} onChange={setRating} />
 * <Rating value={3} readonly showValue />
 */
const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  onChange,
  readonly = false,
  icon = 'star',
  size = 'md',
  showValue = false,
  showCount = false,
  count,
  precision = 1,
  color = '#E91E8C',
  emptyColor = '#E5E7EB',
  className = '',
  label,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizes: Record<RatingSize, number> = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 40,
  };

  const iconSize = sizes[size];

  const IconComponent = useMemo(() => {
    switch (icon) {
      case 'heart':
        return Heart;
      case 'thumb':
        return ThumbsUp;
      default:
        return Star;
    }
  }, [icon]);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const handleClick = useCallback(
    (newValue: number) => {
      if (readonly || !onChange) return;
      onChange(newValue);
      triggerHaptic('impact');
    },
    [readonly, onChange]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, index: number) => {
      if (readonly) return;

      if (precision === 0.5) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isHalf = x < rect.width / 2;
        setHoverValue(index + (isHalf ? 0.5 : 1));
      } else {
        setHoverValue(index + 1);
      }
    },
    [readonly, precision]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverValue(null);
  }, []);

  const renderIcon = (index: number) => {
    const filled = displayValue >= index + 1;
    const halfFilled = !filled && displayValue > index && displayValue < index + 1;

    return (
      <div
        key={index}
        className={`relative ${readonly ? '' : 'cursor-pointer'}`}
        onClick={() => handleClick(hoverValue !== null ? hoverValue : index + 1)}
        onMouseMove={(e) => handleMouseMove(e, index)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Empty icon */}
        <IconComponent
          size={iconSize}
          fill={emptyColor}
          stroke={emptyColor}
          strokeWidth={1}
        />

        {/* Filled icon */}
        {(filled || halfFilled) && (
          <div
            className="absolute top-0 left-0 overflow-hidden"
            style={{ width: halfFilled ? '50%' : '100%' }}
          >
            <IconComponent
              size={iconSize}
              fill={color}
              stroke={color}
              strokeWidth={1}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      )}

      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }, (_, i) => renderIcon(i))}
      </div>

      {showValue && (
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {displayValue.toFixed(precision === 0.5 ? 1 : 0)}
        </span>
      )}

      {showCount && count !== undefined && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({count.toLocaleString('es-MX')})
        </span>
      )}
    </div>
  );
};

// ============================================
// RatingBreakdown Component
// ============================================

interface RatingBreakdownProps {
  ratings: { stars: number; count: number }[];
  total: number;
  average: number;
  className?: string;
}

export const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
  ratings,
  total,
  average,
  className = '',
}) => {
  const sortedRatings = [...ratings].sort((a, b) => b.stars - a.stars);

  return (
    <div className={`flex gap-6 ${className}`}>
      {/* Average */}
      <div className="text-center">
        <div className="text-5xl font-bold text-gray-900 dark:text-white">
          {average.toFixed(1)}
        </div>
        <Rating value={average} readonly size="sm" precision={0.5} />
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {total.toLocaleString('es-MX')} reseñas
        </div>
      </div>

      {/* Breakdown */}
      <div className="flex-1 space-y-2">
        {sortedRatings.map(({ stars, count }) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={stars} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-3">
                {stars}
              </span>
              <Star size={14} fill="#E91E8C" stroke="#E91E8C" />
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-oaxaca-pink rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 w-10 text-right">
                {percentage.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// RatingInput Component (with labels)
// ============================================

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  labels?: string[];
  size?: RatingSize;
  className?: string;
}

export const RatingInput: React.FC<RatingInputProps> = ({
  value,
  onChange,
  labels = ['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'],
  size = 'lg',
  className = '',
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue !== null ? hoverValue : value;
  const label = displayValue > 0 ? labels[displayValue - 1] : 'Selecciona una calificación';

  return (
    <div className={`text-center ${className}`}>
      <Rating
        value={value}
        onChange={onChange}
        size={size}
        className="justify-center"
      />
      <p
        className={`mt-2 text-sm font-medium transition-colors ${
          displayValue > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400'
        }`}
        onMouseOver={() => setHoverValue(value)}
        onMouseLeave={() => setHoverValue(null)}
      >
        {label}
      </p>
    </div>
  );
};

// ============================================
// QuickRating Component (emoji-based)
// ============================================

interface QuickRatingProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export const QuickRating: React.FC<QuickRatingProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const reactions = [
    { value: 'terrible', emoji: '😫', label: 'Terrible' },
    { value: 'bad', emoji: '😕', label: 'Malo' },
    { value: 'ok', emoji: '😐', label: 'Regular' },
    { value: 'good', emoji: '😊', label: 'Bueno' },
    { value: 'excellent', emoji: '🤩', label: 'Excelente' },
  ];

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      {reactions.map((reaction) => (
        <button
          key={reaction.value}
          onClick={() => {
            onChange(reaction.value);
            triggerHaptic('impact');
          }}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            value === reaction.value
              ? 'bg-oaxaca-pink/10 scale-110'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <span className="text-3xl">{reaction.emoji}</span>
          <span
            className={`text-xs ${
              value === reaction.value
                ? 'text-oaxaca-pink font-medium'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {reaction.label}
          </span>
        </button>
      ))}
    </div>
  );
};

// ============================================
// LikeButton Component
// ============================================

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onChange: (liked: boolean) => void;
  size?: RatingSize;
  showCount?: boolean;
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  liked,
  count,
  onChange,
  size = 'md',
  showCount = true,
  className = '',
}) => {
  const sizes: Record<RatingSize, number> = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };

  const iconSize = sizes[size];

  const handleClick = () => {
    onChange(!liked);
    triggerHaptic(liked ? 'light' : 'impact');
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 transition-colors ${
        liked ? 'text-oaxaca-pink' : 'text-gray-500 dark:text-gray-400 hover:text-oaxaca-pink'
      } ${className}`}
    >
      <Heart
        size={iconSize}
        fill={liked ? '#E91E8C' : 'none'}
        className={`transition-transform ${liked ? 'scale-110' : ''}`}
      />
      {showCount && (
        <span className="text-sm font-medium">
          {count > 0 ? count.toLocaleString('es-MX') : ''}
        </span>
      )}
    </button>
  );
};

// ============================================
// VoteButtons Component
// ============================================

interface VoteButtonsProps {
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  onVote: (vote: 'up' | 'down' | null) => void;
  size?: RatingSize;
  className?: string;
}

export const VoteButtons: React.FC<VoteButtonsProps> = ({
  upvotes,
  downvotes,
  userVote,
  onVote,
  size = 'md',
  className = '',
}) => {
  const sizes: Record<RatingSize, number> = {
    sm: 14,
    md: 18,
    lg: 22,
    xl: 28,
  };

  const iconSize = sizes[size];

  const handleVote = (vote: 'up' | 'down') => {
    if (userVote === vote) {
      onVote(null);
    } else {
      onVote(vote);
    }
    triggerHaptic('impact');
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={() => handleVote('up')}
        className={`flex items-center gap-1 transition-colors ${
          userVote === 'up'
            ? 'text-green-500'
            : 'text-gray-500 dark:text-gray-400 hover:text-green-500'
        }`}
      >
        <ThumbsUp
          size={iconSize}
          fill={userVote === 'up' ? 'currentColor' : 'none'}
        />
        <span className="text-sm font-medium">{upvotes}</span>
      </button>

      <button
        onClick={() => handleVote('down')}
        className={`flex items-center gap-1 transition-colors ${
          userVote === 'down'
            ? 'text-red-500'
            : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
        }`}
      >
        <ThumbsUp
          size={iconSize}
          fill={userVote === 'down' ? 'currentColor' : 'none'}
          className="rotate-180"
        />
        <span className="text-sm font-medium">{downvotes}</span>
      </button>
    </div>
  );
};

// ============================================
// Testimonial Component
// ============================================

interface TestimonialProps {
  author: {
    name: string;
    avatar?: string;
    title?: string;
  };
  rating: number;
  content: string;
  date?: Date;
  className?: string;
}

export const Testimonial: React.FC<TestimonialProps> = ({
  author,
  rating,
  content,
  date,
  className = '',
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm ${className}`}>
      <div className="flex items-start gap-4">
        {author.avatar ? (
          <img
            src={author.avatar}
            alt={author.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-oaxaca-pink/10 flex items-center justify-center text-oaxaca-pink font-semibold">
            {author.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {author.name}
              </h4>
              {author.title && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {author.title}
                </p>
              )}
            </div>
            <Rating value={rating} readonly size="sm" />
          </div>

          <p className="mt-3 text-gray-700 dark:text-gray-300">{content}</p>

          {date && (
            <p className="mt-2 text-xs text-gray-400">
              {date.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rating;
