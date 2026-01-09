import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

// ============================================
// Types
// ============================================

type ConnectionStatus = 'online' | 'offline' | 'slow';
type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'pending';

interface PendingAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  retries: number;
}

interface NetworkContextType {
  isOnline: boolean;
  connectionStatus: ConnectionStatus;
  syncStatus: SyncStatus;
  pendingActions: PendingAction[];
  addPendingAction: (action: Omit<PendingAction, 'id' | 'timestamp' | 'retries'>) => void;
  syncNow: () => Promise<void>;
  lastSyncTime: Date | null;
}

// ============================================
// Network Context
// ============================================

const NetworkContext = createContext<NetworkContextType | null>(null);

const PENDING_ACTIONS_KEY = 'guelaguetza_pending_actions';

export const NetworkProvider: React.FC<{ children: React.ReactNode; onSync?: (actions: PendingAction[]) => Promise<void> }> = ({
  children,
  onSync,
}) => {
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('online');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingActions, setPendingActions] = useState<PendingAction[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(PENDING_ACTIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const syncingRef = useRef(false);

  // Save pending actions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pendingActions));
    } catch {
      // Ignore storage errors
    }
  }, [pendingActions]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionStatus('online');
      triggerHaptic('success');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStatus('offline');
      triggerHaptic('warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check connection quality
  useEffect(() => {
    if (!isOnline) return;

    const checkConnection = async () => {
      const start = Date.now();
      try {
        await fetch('/api/health', { method: 'HEAD', cache: 'no-store' });
        const latency = Date.now() - start;

        if (latency > 2000) {
          setConnectionStatus('slow');
        } else {
          setConnectionStatus('online');
        }
      } catch {
        setConnectionStatus('slow');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, [isOnline]);

  const addPendingAction = useCallback((action: Omit<PendingAction, 'id' | 'timestamp' | 'retries'>) => {
    const newAction: PendingAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    setPendingActions((prev) => [...prev, newAction]);
    setSyncStatus('pending');
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current || pendingActions.length === 0) return;

    syncingRef.current = true;
    setSyncStatus('syncing');

    try {
      if (onSync) {
        await onSync(pendingActions);
      }

      // Clear synced actions
      setPendingActions([]);
      setSyncStatus('success');
      setLastSyncTime(new Date());
      triggerHaptic('success');

      // Reset to idle after delay
      setTimeout(() => {
        setSyncStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      triggerHaptic('error');

      // Increment retry count
      setPendingActions((prev) =>
        prev.map((action) => ({ ...action, retries: action.retries + 1 }))
      );
    } finally {
      syncingRef.current = false;
    }
  }, [pendingActions, onSync]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0 && !syncingRef.current) {
      syncNow();
    }
  }, [isOnline, pendingActions.length, syncNow]);

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        connectionStatus,
        syncStatus,
        pendingActions,
        addPendingAction,
        syncNow,
        lastSyncTime,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};

// ============================================
// Simple Offline Indicator (Original)
// ============================================

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing?: boolean;
  onSync?: () => void;
  variant?: 'banner' | 'badge' | 'minimal';
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  pendingCount,
  isSyncing = false,
  onSync,
  variant = 'banner',
}) => {
  if (isOnline && pendingCount === 0) {
    return null;
  }

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-1">
        {!isOnline && <WifiOff size={14} className="text-red-500" />}
        {pendingCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-oaxaca-yellow">
            <CloudOff size={12} />
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'badge') {
    if (!isOnline) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
          <WifiOff size={12} />
          Sin conexión
        </div>
      );
    }

    if (pendingCount > 0) {
      return (
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2 py-1 bg-oaxaca-yellow/20 text-oaxaca-yellow rounded-full text-xs font-medium"
        >
          {isSyncing ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : (
            <Cloud size={12} />
          )}
          {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
        </button>
      );
    }

    return null;
  }

  // Banner variant (default)
  if (!isOnline) {
    return (
      <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm">
        <WifiOff size={16} />
        <span>Sin conexión - Los cambios se sincronizarán al volver en línea</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="bg-oaxaca-yellow text-gray-900 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <CloudOff size={16} />
          <span>
            {pendingCount} acción{pendingCount !== 1 ? 'es' : ''} pendiente
            {pendingCount !== 1 ? 's' : ''} de sincronizar
          </span>
        </div>
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      </div>
    );
  }

  return null;
};

// ============================================
// Smart Offline Banner (Uses Context)
// ============================================

interface SmartOfflineBannerProps {
  className?: string;
  showWhenOnline?: boolean;
}

export const SmartOfflineBanner: React.FC<SmartOfflineBannerProps> = ({
  className = '',
  showWhenOnline = false,
}) => {
  const { isOnline, connectionStatus, syncStatus, pendingActions, syncNow } = useNetwork();
  const [visible, setVisible] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setVisible(true);
      setWasOffline(true);
    } else if (wasOffline) {
      setTimeout(() => {
        setVisible(false);
        setWasOffline(false);
      }, 3000);
    } else if (showWhenOnline && pendingActions.length > 0) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isOnline, wasOffline, showWhenOnline, pendingActions.length]);

  if (!visible && !showWhenOnline) return null;

  const getBannerContent = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff size={18} />,
        text: 'Sin conexión a internet',
        bgColor: 'bg-gray-800',
        textColor: 'text-white',
      };
    }

    if (connectionStatus === 'slow') {
      return {
        icon: <Wifi size={18} />,
        text: 'Conexión lenta',
        bgColor: 'bg-yellow-500',
        textColor: 'text-black',
      };
    }

    if (wasOffline) {
      return {
        icon: <Wifi size={18} />,
        text: 'Conexión restaurada',
        bgColor: 'bg-green-500',
        textColor: 'text-white',
      };
    }

    if (syncStatus === 'syncing') {
      return {
        icon: <RefreshCw size={18} className="animate-spin" />,
        text: 'Sincronizando...',
        bgColor: 'bg-blue-500',
        textColor: 'text-white',
      };
    }

    if (pendingActions.length > 0) {
      return {
        icon: <Cloud size={18} />,
        text: `${pendingActions.length} cambio${pendingActions.length > 1 ? 's' : ''} pendiente${pendingActions.length > 1 ? 's' : ''}`,
        bgColor: 'bg-oaxaca-pink',
        textColor: 'text-white',
        action: {
          label: 'Sincronizar',
          onClick: syncNow,
        },
      };
    }

    return null;
  };

  const content = getBannerContent();
  if (!content) return null;

  return (
    <div
      className={`${content.bgColor} ${content.textColor} px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium ${className}`}
    >
      {content.icon}
      <span>{content.text}</span>
      {content.action && (
        <button
          onClick={content.action.onClick}
          className="ml-2 underline hover:no-underline"
        >
          {content.action.label}
        </button>
      )}
    </div>
  );
};

// ============================================
// Sync Status Indicator
// ============================================

interface SyncStatusIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const { syncStatus, pendingActions, lastSyncTime, syncNow } = useNetwork();

  const sizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const iconSize = sizes[size];

  const getStatusInfo = () => {
    switch (syncStatus) {
      case 'idle':
        return {
          icon: <Cloud size={iconSize} />,
          color: 'text-gray-400',
          label: 'Sincronizado',
        };
      case 'syncing':
        return {
          icon: <RefreshCw size={iconSize} className="animate-spin" />,
          color: 'text-blue-500',
          label: 'Sincronizando...',
        };
      case 'success':
        return {
          icon: <Check size={iconSize} />,
          color: 'text-green-500',
          label: 'Sincronizado',
        };
      case 'error':
        return {
          icon: <AlertCircle size={iconSize} />,
          color: 'text-red-500',
          label: 'Error de sincronización',
        };
      case 'pending':
        return {
          icon: <CloudOff size={iconSize} />,
          color: 'text-yellow-500',
          label: `${pendingActions.length} pendiente${pendingActions.length > 1 ? 's' : ''}`,
        };
      default:
        return {
          icon: <Cloud size={iconSize} />,
          color: 'text-gray-400',
          label: 'Sincronizado',
        };
    }
  };

  const status = getStatusInfo();

  return (
    <button
      onClick={() => syncStatus === 'pending' && syncNow()}
      className={`flex items-center gap-2 ${status.color} ${className}`}
      disabled={syncStatus === 'syncing'}
      title={lastSyncTime ? `Última sincronización: ${lastSyncTime.toLocaleTimeString()}` : undefined}
    >
      {status.icon}
      {showLabel && <span className="text-sm">{status.label}</span>}
    </button>
  );
};

// ============================================
// Network Status Badge
// ============================================

export const NetworkStatusBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline, connectionStatus } = useNetwork();

  if (isOnline && connectionStatus === 'online') return null;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        !isOnline
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      } ${className}`}
    >
      {!isOnline ? <WifiOff size={12} /> : <Wifi size={12} />}
      <span>{!isOnline ? 'Offline' : 'Lento'}</span>
    </div>
  );
};

// ============================================
// Offline Fallback Component
// ============================================

interface OfflineFallbackProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallbackWhenOffline?: boolean;
}

export const OfflineFallback: React.FC<OfflineFallbackProps> = ({
  children,
  fallback,
  showFallbackWhenOffline = true,
}) => {
  const { isOnline } = useNetwork();

  if (!isOnline && showFallbackWhenOffline) {
    return (
      <>
        {fallback || (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <WifiOff size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sin conexión
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
              Este contenido no está disponible sin conexión. Conéctate a internet para verlo.
            </p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
};

// ============================================
// useOfflineStorage Hook
// ============================================

export function useOfflineStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setLastUpdated(new Date());
    } catch {
      // Ignore storage errors
    }
  }, [key, value]);

  const clear = useCallback(() => {
    setValue(initialValue);
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  }, [key, initialValue]);

  return { value, setValue, lastUpdated, clear };
}

// ============================================
// useOfflineAction Hook
// ============================================

export const useOfflineAction = <T extends unknown[]>(
  action: (...args: T) => Promise<void>,
  actionType: string
) => {
  const { isOnline, addPendingAction } = useNetwork();

  return useCallback(
    async (...args: T) => {
      if (isOnline) {
        try {
          await action(...args);
        } catch (error) {
          addPendingAction({
            type: actionType,
            payload: args,
          });
          throw error;
        }
      } else {
        addPendingAction({
          type: actionType,
          payload: args,
        });
        triggerHaptic('warning');
      }
    },
    [isOnline, action, actionType, addPendingAction]
  );
};

export default OfflineIndicator;
