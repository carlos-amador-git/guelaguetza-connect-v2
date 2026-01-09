import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'pink' | 'white' | 'gray' | 'current';
  fullScreen?: boolean;
  text?: string;
}

const sizes = {
  xs: 'w-4 h-4 border-2',
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

const colors = {
  pink: 'border-oaxaca-pink border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-gray-300 dark:border-gray-600 border-t-transparent',
  current: 'border-current border-t-transparent',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'pink',
  fullScreen = false,
  text,
}) => {
  const spinner = (
    <div className={`${sizes[size]} ${colors[color]} rounded-full animate-spin`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
        {spinner}
        {text && (
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">{text}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {spinner}
      {text && (
        <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">{text}</p>
      )}
    </div>
  );
};

// Shimmer animation base class
const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent";

// Card Skeleton with shimmer
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm ${className}`}>
    <div className={`aspect-video bg-gray-200 dark:bg-gray-700 ${shimmer}`} />
    <div className="p-4 space-y-3">
      <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 ${shimmer}`} />
      <div className={`h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 ${shimmer}`} />
      <div className="flex gap-2">
        <div className={`h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full ${shimmer}`} />
        <div className={`h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full ${shimmer}`} />
      </div>
    </div>
  </div>
);

// List Item Skeleton with shimmer
export const ListItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
    <div className={`w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full ${shimmer}`} />
    <div className="flex-1 space-y-2">
      <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 ${shimmer}`} />
      <div className={`h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 ${shimmer}`} />
    </div>
  </div>
);

// Product Card Skeleton with shimmer
export const ProductSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
    <div className={`aspect-square bg-gray-200 dark:bg-gray-700 ${shimmer}`} />
    <div className="p-3 space-y-2">
      <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${shimmer}`} />
      <div className={`h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 ${shimmer}`} />
      <div className="flex justify-between items-center">
        <div className={`h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded ${shimmer}`} />
        <div className={`h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded ${shimmer}`} />
      </div>
    </div>
  </div>
);

// Story Skeleton (circular)
export const StorySkeleton: React.FC = () => (
  <div className="flex flex-col items-center gap-2">
    <div className={`w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full ${shimmer}`} />
    <div className={`h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded ${shimmer}`} />
  </div>
);

// Event Card Skeleton
export const EventSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
    <div className={`h-32 bg-gray-200 dark:bg-gray-700 ${shimmer}`} />
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg ${shimmer}`} />
        <div className="flex-1 space-y-1">
          <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 ${shimmer}`} />
          <div className={`h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 ${shimmer}`} />
        </div>
      </div>
      <div className={`h-8 bg-gray-200 dark:bg-gray-700 rounded-lg ${shimmer}`} />
    </div>
  </div>
);

// Community Card Skeleton
export const CommunitySkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
    <div className={`h-24 bg-gray-200 dark:bg-gray-700 ${shimmer}`} />
    <div className="p-4 space-y-3 -mt-8">
      <div className={`w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl border-4 border-white dark:border-gray-800 ${shimmer}`} />
      <div className={`h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 ${shimmer}`} />
      <div className={`h-3 bg-gray-200 dark:bg-gray-700 rounded w-full ${shimmer}`} />
      <div className="flex gap-4">
        <div className={`h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded ${shimmer}`} />
        <div className={`h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded ${shimmer}`} />
      </div>
    </div>
  </div>
);

// Message/Chat Skeleton
export const MessageSkeleton: React.FC<{ align?: 'left' | 'right' }> = ({ align = 'left' }) => (
  <div className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[70%] space-y-2 ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <div className={`h-12 w-48 bg-gray-200 dark:bg-gray-700 rounded-2xl ${shimmer}`} />
      <div className={`h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded ${shimmer}`} />
    </div>
  </div>
);

// Experience Card Skeleton
export const ExperienceSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
    <div className={`aspect-[4/3] bg-gray-200 dark:bg-gray-700 ${shimmer}`} />
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className={`h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full ${shimmer}`} />
        <div className={`h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded ${shimmer}`} />
      </div>
      <div className={`h-5 bg-gray-200 dark:bg-gray-700 rounded w-full ${shimmer}`} />
      <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 ${shimmer}`} />
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full ${shimmer}`} />
        <div className={`h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded ${shimmer}`} />
      </div>
    </div>
  </div>
);

// Stream Card Skeleton
export const StreamSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
    <div className={`aspect-video bg-gray-200 dark:bg-gray-700 ${shimmer}`}>
      <div className="absolute top-3 left-3">
        <div className={`h-5 w-12 bg-red-300 dark:bg-red-800 rounded ${shimmer}`} />
      </div>
    </div>
    <div className="p-4 space-y-2">
      <div className={`h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 ${shimmer}`} />
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full ${shimmer}`} />
        <div className={`h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded ${shimmer}`} />
        <div className={`h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded ${shimmer}`} />
      </div>
    </div>
  </div>
);

// Profile Header Skeleton
export const ProfileHeaderSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-4">
      <div className={`w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full ${shimmer}`} />
      <div className="flex-1 space-y-2">
        <div className={`h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 ${shimmer}`} />
        <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 ${shimmer}`} />
      </div>
    </div>
    <div className="flex gap-4 justify-around">
      {[1, 2, 3].map((i) => (
        <div key={i} className="text-center space-y-1">
          <div className={`h-6 w-12 mx-auto bg-gray-200 dark:bg-gray-700 rounded ${shimmer}`} />
          <div className={`h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded ${shimmer}`} />
        </div>
      ))}
    </div>
  </div>
);

// Grid of Skeletons
export const SkeletonGrid: React.FC<{
  count?: number;
  type?: 'card' | 'product' | 'list' | 'story' | 'event' | 'community' | 'experience' | 'stream' | 'message';
  columns?: 1 | 2 | 3 | 4;
}> = ({
  count = 6,
  type = 'card',
  columns,
}) => {
  const skeletonMap = {
    card: CardSkeleton,
    product: ProductSkeleton,
    list: ListItemSkeleton,
    story: StorySkeleton,
    event: EventSkeleton,
    community: CommunitySkeleton,
    experience: ExperienceSkeleton,
    stream: StreamSkeleton,
    message: MessageSkeleton,
  };

  const SkeletonComponent = skeletonMap[type] || CardSkeleton;

  // Story type uses horizontal scroll
  if (type === 'story') {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 px-4">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonComponent key={i} />
        ))}
      </div>
    );
  }

  // List and message types use vertical stack
  if (type === 'list' || type === 'message') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonComponent key={i} align={type === 'message' ? (i % 2 === 0 ? 'left' : 'right') : undefined} />
        ))}
      </div>
    );
  }

  // Grid layout for other types
  const gridCols = columns
    ? `grid-cols-${columns}`
    : type === 'product'
      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid gap-4 ${gridCols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
};

// Inline text skeleton
export const TextSkeleton: React.FC<{ width?: string; height?: string; className?: string }> = ({
  width = 'w-24',
  height = 'h-4',
  className = '',
}) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded ${width} ${height} ${shimmer} ${className}`} />
);

export default LoadingSpinner;
