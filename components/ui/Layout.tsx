import React from 'react';

// ============================================
// Container
// ============================================

interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  centered?: boolean;
  className?: string;
}

const containerSizes = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'lg',
  padding = true,
  centered = true,
  className = '',
}) => {
  return (
    <div
      className={`
        ${containerSizes[size]}
        ${centered ? 'mx-auto' : ''}
        ${padding ? 'px-4 sm:px-6 lg:px-8' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ============================================
// Section
// ============================================

interface SectionProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'transparent' | 'white' | 'gray' | 'gradient';
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  children,
  padding = 'lg',
  background = 'transparent',
  className = '',
}) => {
  const paddings = {
    none: '',
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-12 md:py-16',
    xl: 'py-16 md:py-24',
  };

  const backgrounds = {
    transparent: '',
    white: 'bg-white dark:bg-gray-900',
    gray: 'bg-gray-50 dark:bg-gray-800/50',
    gradient: 'bg-gradient-to-b from-oaxaca-pink/5 to-transparent',
  };

  return (
    <section
      className={`
        ${paddings[padding]}
        ${backgrounds[background]}
        ${className}
      `}
    >
      {children}
    </section>
  );
};

// ============================================
// Divider
// ============================================

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  color?: 'light' | 'dark' | 'pink';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  label?: string;
  labelPosition?: 'left' | 'center' | 'right';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  color = 'light',
  spacing = 'md',
  label,
  labelPosition = 'center',
  className = '',
}) => {
  const colors = {
    light: 'border-gray-200 dark:border-gray-700',
    dark: 'border-gray-400 dark:border-gray-500',
    pink: 'border-oaxaca-pink/30',
  };

  const variants = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  };

  const spacings = {
    none: '',
    sm: orientation === 'horizontal' ? 'my-2' : 'mx-2',
    md: orientation === 'horizontal' ? 'my-4' : 'mx-4',
    lg: orientation === 'horizontal' ? 'my-8' : 'mx-8',
  };

  if (orientation === 'vertical') {
    return (
      <div
        className={`
          inline-block h-full border-l
          ${variants[variant]}
          ${colors[color]}
          ${spacings[spacing]}
          ${className}
        `}
      />
    );
  }

  if (label) {
    const labelPositions = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    };

    return (
      <div className={`flex items-center ${spacings[spacing]} ${className}`}>
        {labelPosition !== 'left' && (
          <div className={`flex-1 border-t ${variants[variant]} ${colors[color]}`} />
        )}
        <span className="px-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {label}
        </span>
        {labelPosition !== 'right' && (
          <div className={`flex-1 border-t ${variants[variant]} ${colors[color]}`} />
        )}
      </div>
    );
  }

  return (
    <hr
      className={`
        border-0 border-t
        ${variants[variant]}
        ${colors[color]}
        ${spacings[spacing]}
        ${className}
      `}
    />
  );
};

// ============================================
// Stack (Flex Column)
// ============================================

interface StackProps {
  children: React.ReactNode;
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  divider?: boolean;
  className?: string;
}

export const Stack: React.FC<StackProps> = ({
  children,
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  divider = false,
  className = '',
}) => {
  const spacings = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const alignments = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifications = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  const childArray = React.Children.toArray(children).filter(Boolean);

  if (divider) {
    return (
      <div
        className={`
          flex flex-col
          ${alignments[align]}
          ${justifications[justify]}
          ${className}
        `}
      >
        {childArray.map((child, index) => (
          <React.Fragment key={index}>
            {index > 0 && <Divider spacing="sm" />}
            {child}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`
        flex flex-col
        ${spacings[spacing]}
        ${alignments[align]}
        ${justifications[justify]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ============================================
// HStack (Flex Row)
// ============================================

interface HStackProps {
  children: React.ReactNode;
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  divider?: boolean;
  className?: string;
}

export const HStack: React.FC<HStackProps> = ({
  children,
  spacing = 'md',
  align = 'center',
  justify = 'start',
  wrap = false,
  divider = false,
  className = '',
}) => {
  const spacings = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const alignments = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
  };

  const justifications = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  const childArray = React.Children.toArray(children).filter(Boolean);

  if (divider) {
    return (
      <div
        className={`
          flex flex-row
          ${alignments[align]}
          ${justifications[justify]}
          ${wrap ? 'flex-wrap' : ''}
          ${className}
        `}
      >
        {childArray.map((child, index) => (
          <React.Fragment key={index}>
            {index > 0 && <Divider orientation="vertical" spacing="sm" />}
            {child}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`
        flex flex-row
        ${spacings[spacing]}
        ${alignments[align]}
        ${justifications[justify]}
        ${wrap ? 'flex-wrap' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ============================================
// Grid
// ============================================

interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols = 3,
  gap = 'md',
  responsive = true,
  className = '',
}) => {
  const gaps = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const columns = responsive
    ? {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
        6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
        12: 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-12',
      }
    : {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
        12: 'grid-cols-12',
      };

  return (
    <div className={`grid ${columns[cols]} ${gaps[gap]} ${className}`}>
      {children}
    </div>
  );
};

// ============================================
// GridItem
// ============================================

interface GridItemProps {
  children: React.ReactNode;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'full';
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export const GridItem: React.FC<GridItemProps> = ({
  children,
  colSpan,
  rowSpan,
  className = '',
}) => {
  const colSpans = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
    12: 'col-span-12',
    full: 'col-span-full',
  };

  const rowSpans = {
    1: 'row-span-1',
    2: 'row-span-2',
    3: 'row-span-3',
    4: 'row-span-4',
    5: 'row-span-5',
    6: 'row-span-6',
  };

  return (
    <div
      className={`
        ${colSpan ? colSpans[colSpan] : ''}
        ${rowSpan ? rowSpans[rowSpan] : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ============================================
// Box (Generic Container)
// ============================================

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'nav';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  background?: 'transparent' | 'white' | 'gray';
}

export const Box: React.FC<BoxProps> = ({
  as: Component = 'div',
  padding = 'none',
  rounded = 'none',
  shadow = 'none',
  border = false,
  background = 'transparent',
  className = '',
  children,
  ...props
}) => {
  const paddings = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  const backgrounds = {
    transparent: '',
    white: 'bg-white dark:bg-gray-900',
    gray: 'bg-gray-50 dark:bg-gray-800',
  };

  return (
    <Component
      className={`
        ${paddings[padding]}
        ${roundedClasses[rounded]}
        ${shadows[shadow]}
        ${backgrounds[background]}
        ${border ? 'border border-gray-200 dark:border-gray-700' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  );
};

// ============================================
// Spacer
// ============================================

interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  axis?: 'horizontal' | 'vertical' | 'both';
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  axis = 'vertical',
}) => {
  const sizes = {
    xs: axis === 'horizontal' ? 'w-1' : axis === 'vertical' ? 'h-1' : 'w-1 h-1',
    sm: axis === 'horizontal' ? 'w-2' : axis === 'vertical' ? 'h-2' : 'w-2 h-2',
    md: axis === 'horizontal' ? 'w-4' : axis === 'vertical' ? 'h-4' : 'w-4 h-4',
    lg: axis === 'horizontal' ? 'w-8' : axis === 'vertical' ? 'h-8' : 'w-8 h-8',
    xl: axis === 'horizontal' ? 'w-12' : axis === 'vertical' ? 'h-12' : 'w-12 h-12',
    '2xl': axis === 'horizontal' ? 'w-16' : axis === 'vertical' ? 'h-16' : 'w-16 h-16',
  };

  return <div className={sizes[size]} />;
};

// ============================================
// Center
// ============================================

interface CenterProps {
  children: React.ReactNode;
  className?: string;
}

export const Center: React.FC<CenterProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {children}
    </div>
  );
};

// ============================================
// AspectRatio
// ============================================

interface AspectRatioProps {
  children: React.ReactNode;
  ratio?: '1/1' | '4/3' | '16/9' | '21/9' | '2/3' | '3/2';
  className?: string;
}

export const AspectRatio: React.FC<AspectRatioProps> = ({
  children,
  ratio = '16/9',
  className = '',
}) => {
  const ratios = {
    '1/1': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-video',
    '21/9': 'aspect-[21/9]',
    '2/3': 'aspect-[2/3]',
    '3/2': 'aspect-[3/2]',
  };

  return (
    <div className={`relative ${ratios[ratio]} ${className}`}>
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );
};

// ============================================
// Sticky
// ============================================

interface StickyProps {
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  offset?: number;
  zIndex?: number;
  className?: string;
}

export const Sticky: React.FC<StickyProps> = ({
  children,
  position = 'top',
  offset = 0,
  zIndex = 10,
  className = '',
}) => {
  return (
    <div
      className={`sticky ${className}`}
      style={{
        [position]: offset,
        zIndex,
      }}
    >
      {children}
    </div>
  );
};

// ============================================
// Absolute
// ============================================

interface AbsoluteProps {
  children: React.ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  offset?: number;
  className?: string;
}

export const Absolute: React.FC<AbsoluteProps> = ({
  children,
  position = 'top-right',
  offset = 0,
  className = '',
}) => {
  const positions = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };

  return (
    <div
      className={`absolute ${positions[position]} ${className}`}
      style={position !== 'center' ? { margin: offset } : undefined}
    >
      {children}
    </div>
  );
};

// ============================================
// Overlay
// ============================================

interface OverlayProps {
  children?: React.ReactNode;
  visible: boolean;
  onClick?: () => void;
  blur?: boolean;
  opacity?: 'light' | 'medium' | 'dark';
  zIndex?: number;
  className?: string;
}

export const Overlay: React.FC<OverlayProps> = ({
  children,
  visible,
  onClick,
  blur = false,
  opacity = 'medium',
  zIndex = 40,
  className = '',
}) => {
  const opacities = {
    light: 'bg-black/25',
    medium: 'bg-black/50',
    dark: 'bg-black/75',
  };

  if (!visible) return null;

  return (
    <div
      className={`
        fixed inset-0
        ${opacities[opacity]}
        ${blur ? 'backdrop-blur-sm' : ''}
        transition-opacity
        ${className}
      `}
      style={{ zIndex }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// ============================================
// ScrollArea
// ============================================

interface ScrollAreaProps {
  children: React.ReactNode;
  maxHeight?: string | number;
  hideScrollbar?: boolean;
  className?: string;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({
  children,
  maxHeight,
  hideScrollbar = false,
  className = '',
}) => {
  return (
    <div
      className={`
        overflow-auto
        ${hideScrollbar ? 'scrollbar-hide' : 'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600'}
        ${className}
      `}
      style={{ maxHeight }}
    >
      {children}
    </div>
  );
};

// ============================================
// Hide (Responsive visibility)
// ============================================

interface HideProps {
  children: React.ReactNode;
  below?: 'sm' | 'md' | 'lg' | 'xl';
  above?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Hide: React.FC<HideProps> = ({
  children,
  below,
  above,
  className = '',
}) => {
  let hideClass = '';

  if (below) {
    const belowClasses = {
      sm: 'hidden sm:block',
      md: 'hidden md:block',
      lg: 'hidden lg:block',
      xl: 'hidden xl:block',
    };
    hideClass = belowClasses[below];
  }

  if (above) {
    const aboveClasses = {
      sm: 'sm:hidden',
      md: 'md:hidden',
      lg: 'lg:hidden',
      xl: 'xl:hidden',
    };
    hideClass = aboveClasses[above];
  }

  return (
    <div className={`${hideClass} ${className}`}>
      {children}
    </div>
  );
};

// ============================================
// Show (Responsive visibility)
// ============================================

interface ShowProps {
  children: React.ReactNode;
  below?: 'sm' | 'md' | 'lg' | 'xl';
  above?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Show: React.FC<ShowProps> = ({
  children,
  below,
  above,
  className = '',
}) => {
  let showClass = '';

  if (below) {
    const belowClasses = {
      sm: 'block sm:hidden',
      md: 'block md:hidden',
      lg: 'block lg:hidden',
      xl: 'block xl:hidden',
    };
    showClass = belowClasses[below];
  }

  if (above) {
    const aboveClasses = {
      sm: 'hidden sm:block',
      md: 'hidden md:block',
      lg: 'hidden lg:block',
      xl: 'hidden xl:block',
    };
    showClass = aboveClasses[above];
  }

  return (
    <div className={`${showClass} ${className}`}>
      {children}
    </div>
  );
};
