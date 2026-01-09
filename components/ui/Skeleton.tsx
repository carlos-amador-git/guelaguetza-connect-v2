import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'shimmer' | 'pulse' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'shimmer',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl',
  };

  const animationClasses = {
    shimmer: 'animate-shimmer',
    pulse: 'animate-pulse',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'text' ? '1rem' : undefined),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Skeleton for story cards in grid
export const SkeletonStoryCard: React.FC = () => (
  <div className="flex flex-col items-center gap-2">
    <Skeleton variant="circular" width={64} height={64} />
    <Skeleton variant="text" width={60} height={12} />
  </div>
);

// Skeleton for full story view
export const SkeletonStoryFull: React.FC = () => (
  <div className="h-full w-full flex flex-col">
    {/* Header */}
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" width={120} height={14} className="mb-1" />
        <Skeleton variant="text" width={80} height={10} />
      </div>
    </div>
    {/* Content area */}
    <div className="flex-1 bg-gray-300 dark:bg-gray-800 animate-pulse" />
    {/* Actions */}
    <div className="absolute bottom-20 left-4 right-4 z-10">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
    </div>
  </div>
);

// Skeleton for event cards
export const SkeletonEventCard: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-gray-200 dark:border-gray-700">
    <div className="flex items-start gap-3">
      <Skeleton variant="rounded" width={42} height={42} />
      <div className="flex-1">
        <Skeleton variant="text" width="70%" height={16} className="mb-2" />
        <div className="flex items-center gap-3">
          <Skeleton variant="text" width={60} height={12} />
          <Skeleton variant="text" width={80} height={12} />
        </div>
      </div>
    </div>
  </div>
);

// Skeleton for avatar
export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <Skeleton variant="circular" width={size} height={size} />
);

// ============================================
// Skeleton Text
// ============================================

interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lastLineWidth = '60%',
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height={16}
          width={i === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
};

// ============================================
// Skeleton Card
// ============================================

interface SkeletonCardProps {
  showImage?: boolean;
  showAvatar?: boolean;
  lines?: number;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showImage = true,
  showAvatar = false,
  lines = 2,
  className = '',
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden ${className}`}>
      {showImage && (
        <Skeleton height={200} variant="rectangular" className="w-full" />
      )}
      <div className="p-4">
        {showAvatar && (
          <div className="flex items-center gap-3 mb-3">
            <SkeletonAvatar size={32} />
            <div className="flex-1">
              <Skeleton height={14} width="40%" className="mb-1" />
              <Skeleton height={12} width="25%" />
            </div>
          </div>
        )}
        <Skeleton height={20} width="80%" className="mb-2" />
        <SkeletonText lines={lines} />
      </div>
    </div>
  );
};

// ============================================
// Skeleton List Item
// ============================================

interface SkeletonListItemProps {
  showAvatar?: boolean;
  showAction?: boolean;
  lines?: number;
  className?: string;
}

export const SkeletonListItem: React.FC<SkeletonListItemProps> = ({
  showAvatar = true,
  showAction = false,
  lines = 2,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-4 p-4 ${className}`}>
      {showAvatar && <SkeletonAvatar />}
      <div className="flex-1">
        <Skeleton height={16} width="60%" className="mb-2" />
        {lines > 1 && <Skeleton height={14} width="40%" />}
      </div>
      {showAction && <Skeleton width={60} height={32} variant="rounded" />}
    </div>
  );
};

// ============================================
// Skeleton Product
// ============================================

interface SkeletonProductProps {
  variant?: 'card' | 'list';
  className?: string;
}

export const SkeletonProduct: React.FC<SkeletonProductProps> = ({
  variant = 'card',
  className = '',
}) => {
  if (variant === 'list') {
    return (
      <div className={`flex gap-4 p-4 ${className}`}>
        <Skeleton width={100} height={100} variant="rounded" />
        <div className="flex-1">
          <Skeleton height={18} width="70%" className="mb-2" />
          <Skeleton height={14} width="40%" className="mb-3" />
          <Skeleton height={22} width="30%" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden ${className}`}>
      <Skeleton height={180} variant="rectangular" className="w-full" />
      <div className="p-4">
        <Skeleton height={16} width="80%" className="mb-2" />
        <Skeleton height={14} width="50%" className="mb-3" />
        <div className="flex items-center justify-between">
          <Skeleton height={20} width="35%" />
          <Skeleton width={36} height={36} variant="circular" />
        </div>
      </div>
    </div>
  );
};

// ============================================
// Skeleton Profile
// ============================================

export const SkeletonProfile: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div className={`text-center ${className}`}>
      <SkeletonAvatar size={64} />
      <Skeleton height={24} width={150} className="mx-auto mt-4 mb-2" />
      <Skeleton height={16} width={100} className="mx-auto mb-4" />
      <div className="flex justify-center gap-8 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <Skeleton height={20} width={40} className="mx-auto mb-1" />
            <Skeleton height={14} width={60} className="mx-auto" />
          </div>
        ))}
      </div>
      <Skeleton height={40} width={120} variant="rounded" className="mx-auto" />
    </div>
  );
};

// ============================================
// Skeleton Feed Post
// ============================================

interface SkeletonFeedPostProps {
  showImage?: boolean;
  className?: string;
}

export const SkeletonFeedPost: React.FC<SkeletonFeedPostProps> = ({
  showImage = true,
  className = '',
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <SkeletonAvatar />
        <div className="flex-1">
          <Skeleton height={16} width={120} className="mb-1" />
          <Skeleton height={12} width={80} />
        </div>
        <Skeleton width={24} height={24} variant="circular" />
      </div>

      {/* Image */}
      {showImage && (
        <Skeleton height={300} variant="rectangular" className="w-full" />
      )}

      {/* Content */}
      <div className="p-4">
        <SkeletonText lines={2} />

        {/* Actions */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Skeleton width={60} height={24} variant="rounded" />
          <Skeleton width={60} height={24} variant="rounded" />
          <Skeleton width={60} height={24} variant="rounded" />
        </div>
      </div>
    </div>
  );
};

// ============================================
// Loading Spinner
// ============================================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'pink' | 'gray' | 'white';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'pink',
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  const colors = {
    pink: 'border-oaxaca-pink/30 border-t-oaxaca-pink',
    gray: 'border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300',
    white: 'border-white/30 border-t-white',
  };

  return (
    <div
      className={`rounded-full animate-spin ${sizes[size]} ${colors[color]} ${className}`}
    />
  );
};

// ============================================
// Loading Dots
// ============================================

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'pink' | 'gray';
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  color = 'pink',
  className = '',
}) => {
  const sizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const colors = {
    pink: 'bg-oaxaca-pink',
    gray: 'bg-gray-400',
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`rounded-full ${sizes[size]} ${colors[color]} animate-bounce`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
};

// ============================================
// Progress Loading
// ============================================

interface ProgressLoadingProps {
  progress?: number;
  showPercentage?: boolean;
  label?: string;
  className?: string;
}

export const ProgressLoading: React.FC<ProgressLoadingProps> = ({
  progress = 0,
  showPercentage = true,
  label,
  className = '',
}) => {
  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          {label && <span>{label}</span>}
          {showPercentage && <span>{Math.round(progress)}%</span>}
        </div>
      )}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-oaxaca-pink rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// ============================================
// Page Loading
// ============================================

interface PageLoadingProps {
  message?: string;
  className?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  message = 'Cargando...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
      <Spinner size="lg" />
      <p className="mt-4 text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
};

// ============================================
// Skeleton Table
// ============================================

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {showHeader && (
        <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton key={i} height={16} className="flex-1" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4">
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton key={colIndex} height={14} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
