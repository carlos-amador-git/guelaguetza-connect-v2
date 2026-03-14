import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getUnreadCount,
  connectWebSocket,
  disconnectWebSocket,
  onNotification,
  onUnreadCount,
  Notification,
} from '../../services/notifications';

interface NotificationBellProps {
  onClick: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
  const { token, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setUnreadCount(0);
      return;
    }

    // Connect WebSocket
    connectWebSocket(token);

    // Get initial count; failure is non-critical — badge simply stays at 0
    getUnreadCount(token)
      .then(setUnreadCount)
      .catch((err) => {
        if (import.meta.env.DEV) console.warn('[NotificationBell] Could not fetch unread count:', err);
        setUnreadCount(0);
      });

    // Listen for real-time updates
    const unsubNotification = onNotification((notification: Notification) => {
      setUnreadCount((prev) => prev + 1);
      setHasNewNotification(true);

      // Reset animation after a moment
      setTimeout(() => setHasNewNotification(false), 1000);
    });

    const unsubUnreadCount = onUnreadCount((count: number) => {
      setUnreadCount(count);
    });

    return () => {
      unsubNotification();
      unsubUnreadCount();
      disconnectWebSocket();
    };
  }, [isAuthenticated, token]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-full transition-all ${
        hasNewNotification ? 'animate-bounce' : ''
      }`}
    >
      <Bell
        size={24}
        className={`transition-colors ${
          unreadCount > 0 ? 'text-oaxaca-pink' : 'text-gray-400'
        }`}
      />

      {/* Badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
