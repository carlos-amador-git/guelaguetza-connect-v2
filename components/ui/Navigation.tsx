import React from 'react';

// ============================================
// Navbar / App Bar
// ============================================

interface NavbarProps {
  children?: React.ReactNode;
  variant?: 'solid' | 'transparent' | 'blur';
  position?: 'fixed' | 'sticky' | 'relative';
  showShadow?: boolean;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  children,
  variant = 'solid',
  position = 'sticky',
  showShadow = true,
  className = '',
}) => {
  const variants = {
    solid: 'bg-white dark:bg-gray-900',
    transparent: 'bg-transparent',
    blur: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg',
  };

  return (
    <nav
      className={`
        ${position} top-0 left-0 right-0 z-40
        ${variants[variant]}
        ${showShadow ? 'shadow-sm' : ''}
        ${className}
      `}
    >
      <div className="px-4 h-14 flex items-center justify-between">
        {children}
      </div>
    </nav>
  );
};

// ============================================
// Navbar Brand
// ============================================

interface NavbarBrandProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export const NavbarBrand: React.FC<NavbarBrandProps> = ({
  children,
  href,
  onClick,
  className = '',
}) => {
  const content = (
    <div className={`flex items-center gap-2 font-bold text-lg ${className}`}>
      {children}
    </div>
  );

  if (href) {
    return <a href={href}>{content}</a>;
  }

  if (onClick) {
    return <button onClick={onClick}>{content}</button>;
  }

  return content;
};

// ============================================
// Navbar Actions
// ============================================

interface NavbarActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const NavbarActions: React.FC<NavbarActionsProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {children}
    </div>
  );
};

// ============================================
// Navbar Title
// ============================================

interface NavbarTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const NavbarTitle: React.FC<NavbarTitleProps> = ({
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`flex-1 text-center ${className}`}>
      <h1 className="font-semibold text-gray-900 dark:text-white truncate">{title}</h1>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
      )}
    </div>
  );
};

// ============================================
// Bottom Navigation
// ============================================

interface BottomNavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: number | string;
  href?: string;
}

interface BottomNavigationProps {
  items: BottomNavItem[];
  activeKey: string;
  onChange: (key: string) => void;
  showLabels?: boolean;
  variant?: 'default' | 'floating';
  className?: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeKey,
  onChange,
  showLabels = true,
  variant = 'default',
  className = '',
}) => {
  const containerClasses = variant === 'floating'
    ? 'fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800'
    : 'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-safe';

  return (
    <nav className={`${containerClasses} z-50 ${className}`}>
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = activeKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`
                flex flex-col items-center justify-center flex-1 h-full
                transition-colors relative
                ${isActive
                  ? 'text-oaxaca-pink'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }
              `}
            >
              <div className="relative">
                {isActive && item.activeIcon ? item.activeIcon : item.icon}
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              {showLabels && (
                <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>
                  {item.label}
                </span>
              )}
              {isActive && variant === 'default' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-oaxaca-pink rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// ============================================
// Sidebar
// ============================================

interface SidebarProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  width?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
  className?: string;
}

const sidebarWidths = {
  sm: 'w-64',
  md: 'w-80',
  lg: 'w-96',
};

export const Sidebar: React.FC<SidebarProps> = ({
  children,
  isOpen,
  onClose,
  position = 'left',
  width = 'md',
  overlay = true,
  className = '',
}) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      {overlay && (
        <div
          className={`
            fixed inset-0 bg-black/50 z-40 transition-opacity duration-300
            ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 bottom-0 ${position === 'left' ? 'left-0' : 'right-0'}
          ${sidebarWidths[width]}
          bg-white dark:bg-gray-900 z-50
          transform transition-transform duration-300 ease-out
          ${isOpen
            ? 'translate-x-0'
            : position === 'left'
              ? '-translate-x-full'
              : 'translate-x-full'
          }
          ${className}
        `}
      >
        {children}
      </aside>
    </>
  );
};

// ============================================
// Sidebar Header
// ============================================

interface SidebarHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  children,
  onClose,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 ${className}`}>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          aria-label="Cerrar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// ============================================
// Sidebar Content
// ============================================

interface SidebarContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`flex-1 overflow-y-auto p-4 ${className}`}>
      {children}
    </div>
  );
};

// ============================================
// Sidebar Navigation
// ============================================

interface SidebarNavItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: number | string;
  children?: SidebarNavItem[];
}

interface SidebarNavigationProps {
  items: SidebarNavItem[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  className?: string;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  items,
  activeKey,
  onSelect,
  className = '',
}) => {
  const [expandedKeys, setExpandedKeys] = React.useState<string[]>([]);

  const toggleExpanded = (key: string) => {
    setExpandedKeys(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const renderItem = (item: SidebarNavItem, depth: number = 0) => {
    const isActive = activeKey === item.key;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedKeys.includes(item.key);

    return (
      <div key={item.key}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.key);
            } else {
              onSelect?.(item.key);
              item.onClick?.();
            }
          }}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
            ${depth > 0 ? 'ml-6' : ''}
            ${isActive
              ? 'bg-oaxaca-pink/10 text-oaxaca-pink'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          {item.icon && (
            <span className={`w-5 h-5 ${isActive ? 'text-oaxaca-pink' : 'text-gray-500 dark:text-gray-400'}`}>
              {item.icon}
            </span>
          )}
          <span className="flex-1 text-left font-medium">{item.label}</span>
          {item.badge !== undefined && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className={`space-y-1 ${className}`}>
      {items.map(item => renderItem(item))}
    </nav>
  );
};

// ============================================
// Breadcrumbs
// ============================================

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: 'slash' | 'chevron' | 'dot';
  maxItems?: number;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  separator = 'chevron',
  maxItems,
  className = '',
}) => {
  const separators = {
    slash: '/',
    chevron: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    ),
    dot: '•',
  };

  let displayItems = items;
  let showCollapsed = false;

  if (maxItems && items.length > maxItems) {
    showCollapsed = true;
    displayItems = [
      items[0],
      { label: '...' },
      ...items.slice(-(maxItems - 1)),
    ];
  }

  return (
    <nav className={`flex items-center gap-2 text-sm ${className}`} aria-label="Breadcrumb">
      {displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1;
        const isCollapsed = item.label === '...';

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">
                {separators[separator]}
              </span>
            )}
            {isCollapsed ? (
              <span className="text-gray-400 dark:text-gray-500">...</span>
            ) : isLast ? (
              <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px] flex items-center gap-1.5">
                {item.icon}
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                className="text-gray-500 dark:text-gray-400 hover:text-oaxaca-pink dark:hover:text-oaxaca-pink truncate max-w-[150px] flex items-center gap-1.5 transition-colors"
              >
                {item.icon}
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// ============================================
// Stepper
// ============================================

interface StepperStep {
  key: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  optional?: boolean;
}

interface StepperProps {
  steps: StepperStep[];
  activeStep: number;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'simple' | 'dot';
  onStepClick?: (index: number) => void;
  completedSteps?: number[];
  errorSteps?: number[];
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  activeStep,
  orientation = 'horizontal',
  variant = 'default',
  onStepClick,
  completedSteps = [],
  errorSteps = [],
  className = '',
}) => {
  const isCompleted = (index: number) => completedSteps.includes(index) || index < activeStep;
  const isError = (index: number) => errorSteps.includes(index);
  const isActive = (index: number) => index === activeStep;
  const isClickable = (index: number) => onStepClick && (isCompleted(index) || index <= activeStep);

  if (variant === 'dot') {
    return (
      <div className={`flex items-center justify-center gap-2 ${className}`}>
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => isClickable(index) && onStepClick?.(index)}
            disabled={!isClickable(index)}
            className={`
              w-2.5 h-2.5 rounded-full transition-all
              ${isActive(index) ? 'w-6 bg-oaxaca-pink' : ''}
              ${isCompleted(index) && !isActive(index) ? 'bg-oaxaca-pink' : ''}
              ${!isActive(index) && !isCompleted(index) ? 'bg-gray-300 dark:bg-gray-600' : ''}
              ${isClickable(index) ? 'cursor-pointer' : 'cursor-default'}
            `}
            aria-label={`Paso ${index + 1}`}
          />
        ))}
      </div>
    );
  }

  if (orientation === 'vertical') {
    return (
      <div className={`space-y-0 ${className}`}>
        {steps.map((step, index) => {
          const completed = isCompleted(index);
          const error = isError(index);
          const active = isActive(index);
          const last = index === steps.length - 1;

          return (
            <div key={step.key} className="flex">
              <div className="flex flex-col items-center mr-4">
                <button
                  onClick={() => isClickable(index) && onStepClick?.(index)}
                  disabled={!isClickable(index)}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold
                    transition-all
                    ${completed ? 'bg-oaxaca-pink text-white' : ''}
                    ${error ? 'bg-red-500 text-white' : ''}
                    ${active && !error ? 'bg-oaxaca-pink text-white ring-4 ring-oaxaca-pink/20' : ''}
                    ${!completed && !active && !error ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}
                    ${isClickable(index) ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}
                  `}
                >
                  {completed ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : error ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : step.icon ? (
                    step.icon
                  ) : (
                    index + 1
                  )}
                </button>
                {!last && (
                  <div className={`w-0.5 flex-1 min-h-[40px] ${completed ? 'bg-oaxaca-pink' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </div>
              <div className="pb-8">
                <p className={`font-medium ${active ? 'text-oaxaca-pink' : 'text-gray-900 dark:text-white'}`}>
                  {step.label}
                  {step.optional && <span className="text-gray-400 text-sm ml-2">(Opcional)</span>}
                </p>
                {step.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal stepper
  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => {
        const completed = isCompleted(index);
        const error = isError(index);
        const active = isActive(index);
        const last = index === steps.length - 1;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <button
                onClick={() => isClickable(index) && onStepClick?.(index)}
                disabled={!isClickable(index)}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  transition-all
                  ${completed ? 'bg-oaxaca-pink text-white' : ''}
                  ${error ? 'bg-red-500 text-white' : ''}
                  ${active && !error ? 'bg-oaxaca-pink text-white ring-4 ring-oaxaca-pink/20' : ''}
                  ${!completed && !active && !error ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}
                  ${isClickable(index) ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}
                `}
              >
                {completed ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : error ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : step.icon ? (
                  step.icon
                ) : (
                  index + 1
                )}
              </button>
              {variant === 'default' && (
                <div className="mt-2 text-center max-w-[100px]">
                  <p className={`text-xs font-medium ${active ? 'text-oaxaca-pink' : 'text-gray-600 dark:text-gray-400'}`}>
                    {step.label}
                  </p>
                </div>
              )}
            </div>
            {!last && (
              <div className={`flex-1 h-0.5 mx-2 ${completed ? 'bg-oaxaca-pink' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================
// Pagination
// ============================================

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  siblingCount?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'simple' | 'minimal';
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  siblingCount = 1,
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  const pageSizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
  };

  const generatePages = () => {
    const totalPageNumbers = siblingCount * 2 + 3;

    if (totalPages <= totalPageNumbers) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftRange = range(1, 3 + siblingCount * 2);
      return [...leftRange, 'dots', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightRange = range(totalPages - (2 + siblingCount * 2), totalPages);
      return [1, 'dots', ...rightRange];
    }

    const middleRange = range(leftSiblingIndex, rightSiblingIndex);
    return [1, 'dots', ...middleRange, 'dots', totalPages];
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="text-gray-500 hover:text-oaxaca-pink disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-gray-600 dark:text-gray-400">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="text-gray-500 hover:text-oaxaca-pink disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  if (variant === 'simple') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            ${pageSizes[size]} rounded-xl flex items-center justify-center
            bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
            hover:bg-gray-200 dark:hover:bg-gray-700
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="px-4 text-gray-600 dark:text-gray-400">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            ${pageSizes[size]} rounded-xl flex items-center justify-center
            bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
            hover:bg-gray-200 dark:hover:bg-gray-700
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  const pages = generatePages();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`
            ${pageSizes[size]} rounded-xl flex items-center justify-center
            text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label="Primera página"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      )}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          ${pageSizes[size]} rounded-xl flex items-center justify-center
          text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label="Página anterior"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {pages.map((page, index) => {
        if (page === 'dots') {
          return (
            <span key={`dots-${index}`} className="px-2 text-gray-400">
              ...
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`
              ${pageSizes[size]} rounded-xl flex items-center justify-center font-medium
              transition-all
              ${isActive
                ? 'bg-oaxaca-pink text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`
          ${pageSizes[size]} rounded-xl flex items-center justify-center
          text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label="Página siguiente"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`
            ${pageSizes[size]} rounded-xl flex items-center justify-center
            text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label="Última página"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};

// ============================================
// Tab Navigation
// ============================================

interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: number | string;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
  variant?: 'underline' | 'pills' | 'enclosed';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  fullWidth = false,
  size = 'md',
  className = '',
}) => {
  const tabSizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    underline: {
      container: 'border-b border-gray-200 dark:border-gray-700',
      tab: (active: boolean) => `
        ${tabSizes[size]}
        ${active
          ? 'text-oaxaca-pink border-b-2 border-oaxaca-pink -mb-px'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }
      `,
    },
    pills: {
      container: 'bg-gray-100 dark:bg-gray-800 rounded-xl p-1',
      tab: (active: boolean) => `
        ${tabSizes[size]}
        rounded-lg
        ${active
          ? 'bg-white dark:bg-gray-700 text-oaxaca-pink shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }
      `,
    },
    enclosed: {
      container: 'border-b border-gray-200 dark:border-gray-700',
      tab: (active: boolean) => `
        ${tabSizes[size]}
        rounded-t-lg border border-transparent -mb-px
        ${active
          ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 border-b-white dark:border-b-gray-900 text-oaxaca-pink'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
        }
      `,
    },
  };

  return (
    <div className={`${variantClasses[variant].container} ${className}`} role="tablist">
      <div className={`flex ${fullWidth ? 'w-full' : ''} gap-1`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.key)}
              className={`
                ${variantClasses[variant].tab(isActive)}
                ${fullWidth ? 'flex-1' : ''}
                flex items-center justify-center gap-2 font-medium transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`
                  px-1.5 py-0.5 text-xs rounded-full
                  ${isActive ? 'bg-oaxaca-pink/20 text-oaxaca-pink' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                `}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// Back Button
// ============================================

interface BackButtonProps {
  onClick?: () => void;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = 'Atrás',
  showLabel = false,
  className = '',
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.history.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-2 p-2 rounded-xl
        text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800
        transition-colors
        ${className}
      `}
      aria-label={label}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {showLabel && <span className="font-medium">{label}</span>}
    </button>
  );
};
