import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { subscribeToOnlineStatus, checkOnlineStatus } from '../services/pwa';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(checkOnlineStatus());
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToOnlineStatus((online) => {
      setIsOnline(online);

      if (!online) {
        setShowBanner(true);
        setWasOffline(true);
      } else if (wasOffline) {
        // Show "back online" message briefly
        setShowBanner(true);
        setTimeout(() => {
          setShowBanner(false);
          setWasOffline(false);
        }, 3000);
      }
    });

    return unsubscribe;
  }, [wasOffline]);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2.5 text-center text-sm font-medium transition-all duration-300 ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-oaxaca-yellow text-gray-900'
      }`}
    >
      {isOnline ? (
        <span className="flex items-center justify-center gap-2">
          <Wifi size={16} />
          Conexion restaurada
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <WifiOff size={16} />
          Sin conexion - Modo offline activo
        </span>
      )}
    </div>
  );
};

export default OfflineIndicator;
