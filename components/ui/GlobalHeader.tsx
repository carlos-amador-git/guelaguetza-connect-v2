import React from 'react';
import {
  ArrowLeft,
  Home,
  Menu,
  X,
  Search,
  Bell,
  User,
  Settings,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { ViewState } from '../../types';

interface BreadcrumbItem {
  label: string;
  view?: ViewState;
}

interface GlobalHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onNavigate?: (view: ViewState) => void;
  breadcrumbs?: BreadcrumbItem[];
  showHomeButton?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showMenu?: boolean;
  variant?: 'default' | 'gradient' | 'transparent';
  gradientFrom?: string;
  gradientTo?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  title,
  subtitle,
  onBack,
  onNavigate,
  breadcrumbs,
  showHomeButton = true,
  showSearch = false,
  showNotifications = false,
  showMenu = false,
  variant = 'default',
  gradientFrom = 'from-oaxaca-purple',
  gradientTo = 'to-oaxaca-pink',
  actions,
  icon,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const quickLinks = [
    { label: 'Inicio', view: ViewState.HOME, icon: Home },
    { label: 'Perfil', view: ViewState.PROFILE, icon: User },
    { label: 'Buscar', view: ViewState.SEARCH, icon: Search },
    { label: 'Configuracion', view: ViewState.PROFILE, icon: Settings },
  ];

  const getHeaderClasses = () => {
    switch (variant) {
      case 'gradient':
        return `bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white`;
      case 'transparent':
        return 'bg-transparent text-gray-900 dark:text-white';
      default:
        return 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm';
    }
  };

  const getButtonClasses = () => {
    switch (variant) {
      case 'gradient':
        return 'hover:bg-white/20 text-white';
      case 'transparent':
        return 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300';
      default:
        return 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300';
    }
  };

  return (
    <>
      <header className={`sticky top-0 z-30 ${getHeaderClasses()}`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left section */}
            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className={`p-2 rounded-full transition ${getButtonClasses()}`}
                  aria-label="Volver"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              {showHomeButton && !onBack && onNavigate && (
                <button
                  onClick={() => onNavigate(ViewState.HOME)}
                  className={`p-2 rounded-full transition ${getButtonClasses()}`}
                  aria-label="Inicio"
                >
                  <Home size={20} />
                </button>
              )}
              {icon && <div className="ml-1">{icon}</div>}
              <div className="ml-1">
                <h1 className="font-bold text-lg leading-tight">{title}</h1>
                {subtitle && (
                  <p className={`text-xs ${variant === 'gradient' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-1">
              {showSearch && onNavigate && (
                <button
                  onClick={() => onNavigate(ViewState.SEARCH)}
                  className={`p-2 rounded-full transition ${getButtonClasses()}`}
                  aria-label="Buscar"
                >
                  <Search size={20} />
                </button>
              )}
              {showNotifications && (
                <button
                  className={`p-2 rounded-full transition relative ${getButtonClasses()}`}
                  aria-label="Notificaciones"
                >
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>
              )}
              {actions}
              {showMenu && (
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`p-2 rounded-full transition ${getButtonClasses()}`}
                  aria-label="Menu"
                >
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              )}
            </div>
          </div>

          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs overflow-x-auto">
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <ChevronRight size={12} className={variant === 'gradient' ? 'text-white/50' : 'text-gray-400'} />
                  )}
                  {item.view && onNavigate ? (
                    <button
                      onClick={() => onNavigate(item.view!)}
                      className={`hover:underline whitespace-nowrap ${
                        variant === 'gradient' ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className={`whitespace-nowrap ${
                      index === breadcrumbs.length - 1
                        ? variant === 'gradient' ? 'text-white font-medium' : 'text-gray-900 dark:text-white font-medium'
                        : variant === 'gradient' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {item.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Quick navigation menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-72 bg-white dark:bg-gray-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 dark:text-white">Menu</h2>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
            <nav className="p-2">
              {quickLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => {
                    onNavigate?.(link.view);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <link.icon size={20} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-200">{link.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalHeader;
