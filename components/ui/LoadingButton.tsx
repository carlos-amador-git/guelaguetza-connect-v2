import React from 'react';
import { LucideIcon } from 'lucide-react';

interface LoadingButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loadingText?: string;
  className?: string;
}

const variants = {
  primary: 'bg-oaxaca-pink text-white hover:bg-oaxaca-pink/90 disabled:bg-gray-300 dark:disabled:bg-gray-700',
  secondary: 'bg-oaxaca-yellow text-white hover:bg-oaxaca-yellow/90 disabled:bg-gray-300 dark:disabled:bg-gray-700',
  outline: 'border-2 border-oaxaca-pink text-oaxaca-pink hover:bg-oaxaca-pink/10 disabled:border-gray-300 disabled:text-gray-300',
  ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:text-gray-300',
  danger: 'bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-700',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-base gap-2',
  lg: 'px-6 py-3.5 text-lg gap-2.5',
};

const iconSizes = {
  sm: 16,
  md: 18,
  lg: 20,
};

const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  loadingText,
  className = '',
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-xl
        transition-all duration-200 ease-out
        active:scale-[0.98]
        disabled:cursor-not-allowed disabled:opacity-70
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <>
          <div className={`animate-spin rounded-full border-2 border-current border-t-transparent`}
            style={{ width: iconSizes[size], height: iconSizes[size] }}
          />
          {loadingText && <span>{loadingText}</span>}
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={iconSizes[size]} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={iconSizes[size]} />}
        </>
      )}
    </button>
  );
};

// Specialized button variants
export const PrimaryButton: React.FC<Omit<LoadingButtonProps, 'variant'>> = (props) => (
  <LoadingButton variant="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<LoadingButtonProps, 'variant'>> = (props) => (
  <LoadingButton variant="secondary" {...props} />
);

export const OutlineButton: React.FC<Omit<LoadingButtonProps, 'variant'>> = (props) => (
  <LoadingButton variant="outline" {...props} />
);

export const GhostButton: React.FC<Omit<LoadingButtonProps, 'variant'>> = (props) => (
  <LoadingButton variant="ghost" {...props} />
);

export const DangerButton: React.FC<Omit<LoadingButtonProps, 'variant'>> = (props) => (
  <LoadingButton variant="danger" {...props} />
);

// Icon-only button
interface IconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  label: string; // For accessibility
  className?: string;
}

const iconButtonSizes = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  onClick,
  loading = false,
  disabled = false,
  variant = 'ghost',
  size = 'md',
  label,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={label}
      className={`
        inline-flex items-center justify-center rounded-full
        transition-all duration-200
        active:scale-95
        disabled:cursor-not-allowed disabled:opacity-50
        ${variants[variant]}
        ${iconButtonSizes[size]}
        ${className}
      `}
    >
      {loading ? (
        <div
          className="animate-spin rounded-full border-2 border-current border-t-transparent"
          style={{ width: iconSizes[size], height: iconSizes[size] }}
        />
      ) : (
        <Icon size={iconSizes[size]} />
      )}
    </button>
  );
};

export default LoadingButton;
