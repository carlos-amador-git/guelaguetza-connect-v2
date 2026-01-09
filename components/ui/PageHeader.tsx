import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  variant?: 'pink' | 'purple' | 'blue' | 'amber' | 'green' | 'red' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

const gradients: Record<string, string> = {
  pink: 'from-oaxaca-pink to-pink-600',
  purple: 'from-oaxaca-purple to-purple-700',
  blue: 'from-blue-600 to-indigo-700',
  amber: 'from-amber-500 to-orange-500',
  green: 'from-green-600 to-emerald-600',
  red: 'from-red-600 to-pink-600',
  dark: 'from-gray-800 to-gray-900',
};

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  variant = 'pink',
  size = 'md',
  children,
}) => {
  const paddingY = size === 'sm' ? 'py-3' : size === 'lg' ? 'py-6' : 'py-4';
  const titleSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <header className={`bg-gradient-to-r ${gradients[variant]} text-white px-4 ${paddingY} pt-8 md:pt-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Volver"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h1 className={`font-bold ${titleSize}`}>{title}</h1>
              {subtitle && (
                <p className="text-sm text-white/80">{subtitle}</p>
              )}
            </div>
          </div>
          {rightAction && (
            <div className="flex items-center gap-2">
              {rightAction}
            </div>
          )}
        </div>
        {children}
      </div>
    </header>
  );
};

export default PageHeader;
