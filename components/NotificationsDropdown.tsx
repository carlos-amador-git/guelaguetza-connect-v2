import React, { useState, useEffect } from 'react';
import { X, Check, CheckCheck, Loader2, Trash2, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  Notification,
  getNotificationIcon,
  timeAgo,
} from '../services/notifications';
import haptics from '../services/haptics';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUserProfile?: (userId: string) => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  onClose,
  onUserProfile,
}) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen && token) {
      loadNotifications();
    }
  }, [isOpen, token]);

  const loadNotifications = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const data = await getNotifications(1, 30, token);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (!token || notification.read) return;

    haptics.tap();

    try {
      await markAsRead([notification.id], token);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token || unreadCount === 0) return;

    haptics.tap();

    try {
      await markAllAsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;

    haptics.tap();

    const notification = notifications.find((n) => n.id === id);
    try {
      await deleteNotification(id, token);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification);

    // Navigate based on notification type
    if (notification.data) {
      const data = notification.data as Record<string, unknown>;

      if (notification.type === 'NEW_FOLLOWER' && data.userId) {
        onUserProfile?.(data.userId as string);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notificaciones</h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-2 text-oaxaca-pink hover:bg-oaxaca-pink/10 rounded-full transition-colors"
                title="Marcar todas como leídas"
              >
                <CheckCheck size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-oaxaca-pink" size={32} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Bell size={48} className="mb-4 opacity-50" />
              <p>No tienes notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 flex gap-3 transition-colors ${
                    notification.read
                      ? 'bg-white dark:bg-gray-900'
                      : 'bg-oaxaca-pink/5 dark:bg-oaxaca-pink/10'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      notification.read
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'bg-oaxaca-pink/20'
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="flex-1 text-left"
                  >
                    <p
                      className={`text-sm ${
                        notification.read
                          ? 'text-gray-600 dark:text-gray-400'
                          : 'text-gray-900 dark:text-white font-medium'
                      }`}
                    >
                      {notification.body}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </button>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification)}
                        className="p-1.5 text-gray-400 hover:text-oaxaca-pink hover:bg-oaxaca-pink/10 rounded-full transition-colors"
                        aria-label="Marcar como leída"
                      >
                        <Check size={16} aria-hidden="true" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                      aria-label="Eliminar notificación"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsDropdown;
