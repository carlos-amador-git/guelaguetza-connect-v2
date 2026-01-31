import React from 'react';
import {
  Package,
  Search,
  Calendar,
  Users,
  ShoppingCart,
  MapPin,
  MessageCircle,
  Bell,
  Ticket,
  Radio,
  Heart,
  Star,
  FileText,
  Inbox,
  Image,
  WifiOff,
  AlertCircle,
  Lock,
  Plus,
  RefreshCw,
} from 'lucide-react';

// ============================================
// Types
// ============================================

type EmptyStateType =
  | 'search'
  | 'products'
  | 'cart'
  | 'events'
  | 'communities'
  | 'messages'
  | 'notifications'
  | 'bookings'
  | 'streams'
  | 'favorites'
  | 'reviews'
  | 'orders'
  | 'locations'
  | 'images'
  | 'offline'
  | 'error'
  | 'locked'
  | 'generic';

// ============================================
// EmptyState Component
// ============================================

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const defaultContent: Record<EmptyStateType, { icon: React.ReactNode; title: string; description: string }> = {
  search: {
    icon: <Search className="w-16 h-16" />,
    title: 'Sin resultados',
    description: 'No encontramos lo que buscas. Intenta con otros términos.',
  },
  products: {
    icon: <Package className="w-16 h-16" />,
    title: 'Sin productos',
    description: 'No hay productos disponibles en este momento.',
  },
  cart: {
    icon: <ShoppingCart className="w-16 h-16" />,
    title: 'Carrito vacío',
    description: 'Agrega productos para comenzar tu compra.',
  },
  events: {
    icon: <Calendar className="w-16 h-16" />,
    title: 'Sin eventos',
    description: 'No hay eventos programados para esta fecha.',
  },
  communities: {
    icon: <Users className="w-16 h-16" />,
    title: 'Sin comunidades',
    description: 'Aún no te has unido a ninguna comunidad.',
  },
  messages: {
    icon: <MessageCircle className="w-16 h-16" />,
    title: 'Sin mensajes',
    description: 'Tu bandeja de mensajes está vacía.',
  },
  notifications: {
    icon: <Bell className="w-16 h-16" />,
    title: 'Sin notificaciones',
    description: 'No tienes notificaciones nuevas.',
  },
  bookings: {
    icon: <Ticket className="w-16 h-16" />,
    title: 'Sin reservaciones',
    description: 'Aún no has reservado ninguna experiencia.',
  },
  streams: {
    icon: <Radio className="w-16 h-16" />,
    title: 'Sin transmisiones',
    description: 'No hay transmisiones disponibles.',
  },
  favorites: {
    icon: <Heart className="w-16 h-16" />,
    title: 'Sin favoritos',
    description: 'Aún no has agregado nada a tus favoritos.',
  },
  reviews: {
    icon: <Star className="w-16 h-16" />,
    title: 'Sin reseñas',
    description: 'Este producto aún no tiene reseñas.',
  },
  orders: {
    icon: <FileText className="w-16 h-16" />,
    title: 'Sin pedidos',
    description: 'Aún no has realizado ningún pedido.',
  },
  locations: {
    icon: <MapPin className="w-16 h-16" />,
    title: 'Sin ubicaciones',
    description: 'No hay ubicaciones disponibles.',
  },
  images: {
    icon: <Image className="w-16 h-16" />,
    title: 'Sin imágenes',
    description: 'No hay imágenes para mostrar.',
  },
  offline: {
    icon: <WifiOff className="w-16 h-16" />,
    title: 'Sin conexión',
    description: 'Parece que no tienes conexión a internet.',
  },
  error: {
    icon: <AlertCircle className="w-16 h-16" />,
    title: 'Algo salió mal',
    description: 'Ocurrió un error inesperado. Intenta de nuevo.',
  },
  locked: {
    icon: <Lock className="w-16 h-16" />,
    title: 'Contenido bloqueado',
    description: 'No tienes permiso para ver este contenido.',
  },
  generic: {
    icon: <Inbox className="w-16 h-16" />,
    title: 'Sin contenido',
    description: 'No hay nada que mostrar aquí.',
  },
};

/**
 * EmptyState - Estados vacíos reutilizables
 *
 * Features:
 * - Tipos predefinidos comunes
 * - Iconos y mensajes contextuales
 * - Acciones opcionales
 * - Tamaños configurables
 *
 * Usage:
 * <EmptyState type="search" title="Sin resultados" />
 * <EmptyState
 *   type="cart"
 *   action={{ label: "Explorar", onClick: () => navigate("/") }}
 * />
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'generic',
  title,
  description,
  action,
  secondaryAction,
  icon,
  size = 'md',
  className = '',
}) => {
  const content = defaultContent[type];

  const sizes = {
    sm: {
      container: 'py-8 px-4',
      iconWrapper: '[&>svg]:w-12 [&>svg]:h-12',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-12 px-4',
      iconWrapper: '[&>svg]:w-16 [&>svg]:h-16',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16 px-8',
      iconWrapper: '[&>svg]:w-20 [&>svg]:h-20',
      title: 'text-xl',
      description: 'text-base',
    },
  };

  const sizeConfig = sizes[size];

  return (
    <div className={`flex flex-col items-center justify-center text-center animate-fade-slide-in ${sizeConfig.container} ${className}`}>
      <div className={`text-gray-300 dark:text-gray-600 mb-4 ${sizeConfig.iconWrapper}`}>
        {icon || content.icon}
      </div>
      <h3 className={`font-semibold text-gray-900 dark:text-gray-100 mb-2 ${sizeConfig.title}`}>
        {title || content.title}
      </h3>
      <p className={`text-gray-500 dark:text-gray-400 max-w-xs mb-6 ${sizeConfig.description}`}>
        {description || content.description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                action.variant === 'secondary'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  : 'bg-oaxaca-pink text-white hover:bg-oaxaca-pink/90'
              }`}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// IllustratedEmptyState Component
// ============================================

interface IllustratedEmptyStateProps {
  illustration: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export const IllustratedEmptyState: React.FC<IllustratedEmptyStateProps> = ({
  illustration,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center text-center py-16 px-6 ${className}`}>
      <div className="mb-6 w-48 h-48">{illustration}</div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>

      {description && (
        <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md">{description}</p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-oaxaca-pink text-white rounded-xl font-medium hover:bg-oaxaca-pink/90 transition-colors"
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </div>
  );
};

// ============================================
// InlineEmptyState Component
// ============================================

interface InlineEmptyStateProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const InlineEmptyState: React.FC<InlineEmptyStateProps> = ({
  message,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-center gap-3 py-4 px-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl ${className}`}
    >
      <span className="text-sm text-gray-500 dark:text-gray-400">{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm text-oaxaca-pink hover:text-oaxaca-pink/80 font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// ============================================
// CreateFirstItem Component
// ============================================

interface CreateFirstItemProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  buttonLabel: string;
  onClick: () => void;
  className?: string;
}

export const CreateFirstItem: React.FC<CreateFirstItemProps> = ({
  title,
  description,
  icon,
  buttonLabel,
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-oaxaca-pink hover:bg-oaxaca-pink/5 transition-all group ${className}`}
    >
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-oaxaca-pink/10 group-hover:text-oaxaca-pink transition-colors">
        {icon || <Plus size={32} />}
      </div>

      <h4 className="mt-4 font-semibold text-gray-900 dark:text-white">{title}</h4>

      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-xs">{description}</p>
      )}

      <span className="mt-4 px-4 py-2 bg-oaxaca-pink text-white rounded-xl font-medium group-hover:bg-oaxaca-pink/90 transition-colors">
        {buttonLabel}
      </span>
    </button>
  );
};

// ============================================
// ErrorState Component
// ============================================

interface ErrorStateProps {
  title?: string;
  error?: string | Error;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Algo salió mal',
  error,
  onRetry,
  retryLabel = 'Intentar de nuevo',
  className = '',
}) => {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className={`flex flex-col items-center text-center py-12 px-6 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500 mb-4">
        <AlertCircle size={32} />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>

      {errorMessage && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">{errorMessage}</p>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw size={16} />
          {retryLabel}
        </button>
      )}
    </div>
  );
};

// ============================================
// LoadingState Component
// ============================================

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Cargando...',
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: { spinner: 'w-6 h-6', text: 'text-sm', padding: 'py-4' },
    md: { spinner: 'w-8 h-8', text: 'text-sm', padding: 'py-8' },
    lg: { spinner: 'w-12 h-12', text: 'text-base', padding: 'py-12' },
  };

  const sizeConfig = sizes[size];

  return (
    <div className={`flex flex-col items-center justify-center ${sizeConfig.padding} ${className}`}>
      <div
        className={`${sizeConfig.spinner} border-2 border-gray-200 dark:border-gray-700 border-t-oaxaca-pink rounded-full animate-spin`}
      />
      {message && (
        <p className={`mt-3 text-gray-500 dark:text-gray-400 ${sizeConfig.text}`}>{message}</p>
      )}
    </div>
  );
};

// ============================================
// NoPermissionState Component
// ============================================

interface NoPermissionStateProps {
  title?: string;
  description?: string;
  onRequestAccess?: () => void;
  onGoBack?: () => void;
  className?: string;
}

export const NoPermissionState: React.FC<NoPermissionStateProps> = ({
  title = 'Acceso restringido',
  description = 'No tienes permiso para ver este contenido.',
  onRequestAccess,
  onGoBack,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center text-center py-12 px-6 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-oaxaca-yellow-light dark:bg-oaxaca-yellow/20 flex items-center justify-center text-oaxaca-yellow mb-4">
        <Lock size={32} />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>

      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">{description}</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRequestAccess && (
          <button
            onClick={onRequestAccess}
            className="px-4 py-2 bg-oaxaca-pink text-white rounded-xl font-medium hover:bg-oaxaca-pink/90 transition-colors"
          >
            Solicitar acceso
          </button>
        )}
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
          >
            Volver
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// OfflineState Component
// ============================================

interface OfflineStateProps {
  onRetry?: () => void;
  cached?: boolean;
  cachedTime?: Date;
  className?: string;
}

export const OfflineState: React.FC<OfflineStateProps> = ({
  onRetry,
  cached = false,
  cachedTime,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center text-center py-12 px-6 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-4">
        <WifiOff size={32} />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sin conexión</h3>

      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        {cached
          ? 'Estás viendo contenido guardado. Algunos datos pueden no estar actualizados.'
          : 'No tienes conexión a internet. Verifica tu red e intenta de nuevo.'}
      </p>

      {cached && cachedTime && (
        <p className="mt-1 text-xs text-gray-400">
          Última actualización:{' '}
          {cachedTime.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw size={16} />
          Reintentar
        </button>
      )}
    </div>
  );
};

export default EmptyState;
