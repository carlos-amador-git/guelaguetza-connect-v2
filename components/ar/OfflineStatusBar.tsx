// ============================================================================
// OfflineStatusBar — Sprint 1.0
// Shows offline/sync state for AR views
// ============================================================================

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { checkOnlineStatus, subscribeToOnlineStatus } from '../../services/pwa';
import { syncPendingOperations } from '../../services/ar-sync';
import { getPendingOperations } from '../../services/ar-offline';

type BarStatus = 'online' | 'offline-cached' | 'offline-empty' | 'syncing';

interface OfflineStatusBarProps {
  /** True when there is cached AR data available for the current view */
  hasCachedData?: boolean;
}

const OfflineStatusBar: React.FC<OfflineStatusBarProps> = ({ hasCachedData = false }) => {
  const [isOnline, setIsOnline] = useState(checkOnlineStatus());
  const [status, setStatus] = useState<BarStatus>('online');
  const [pendingCount, setPendingCount] = useState(0);

  // Derive bar status from online/cache state
  useEffect(() => {
    if (isOnline) {
      setStatus('online');
    } else if (hasCachedData) {
      setStatus('offline-cached');
    } else {
      setStatus('offline-empty');
    }
  }, [isOnline, hasCachedData]);

  // Subscribe to online/offline events
  useEffect(() => {
    const unsubscribe = subscribeToOnlineStatus(async (online) => {
      setIsOnline(online);

      if (online) {
        // Check for pending ops to sync
        try {
          const pending = await getPendingOperations();
          if (pending.length > 0) {
            setPendingCount(pending.length);
            setStatus('syncing');

            await syncPendingOperations();

            setPendingCount(0);
            setStatus('online');
          } else {
            setStatus('online');
          }
        } catch {
          setStatus('online');
        }
      }
    });

    return unsubscribe;
  }, []);

  // Poll pending operations count while online
  useEffect(() => {
    if (!isOnline) return;

    let cancelled = false;
    const check = async () => {
      try {
        const ops = await getPendingOperations();
        if (!cancelled) setPendingCount(ops.length);
      } catch {
        // silent
      }
    };

    check();
  }, [isOnline]);

  // Hidden when online and nothing to sync
  if (status === 'online' && pendingCount === 0) return null;

  const config: Record<
    BarStatus,
    { bg: string; text: string; icon: React.ReactNode; label: string }
  > = {
    online: {
      bg: 'bg-green-500',
      text: 'text-white',
      icon: <RefreshCw size={14} className="animate-spin" />,
      label: `Sincronizando ${pendingCount} operacion${pendingCount !== 1 ? 'es' : ''}…`,
    },
    'offline-cached': {
      bg: 'bg-yellow-400',
      text: 'text-gray-900',
      icon: <WifiOff size={14} />,
      label: 'Sin conexion — usando datos guardados',
    },
    'offline-empty': {
      bg: 'bg-red-500',
      text: 'text-white',
      icon: <AlertTriangle size={14} />,
      label: 'Sin conexion — sin datos',
    },
    syncing: {
      bg: 'bg-blue-500',
      text: 'text-white',
      icon: <RefreshCw size={14} className="animate-spin" />,
      label: `Sincronizando${pendingCount > 0 ? ` ${pendingCount} operacion${pendingCount !== 1 ? 'es' : ''}` : ''}…`,
    },
  };

  const { bg, text, icon, label } = config[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium transition-colors duration-300 ${bg} ${text}`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
};

export default OfflineStatusBar;
