// Notifications Service - API calls and WebSocket connection

const API_BASE = ((import.meta as any).env.VITE_API_URL || '') + '/api';
const WS_BASE = (import.meta as any).env.VITE_WS_URL || ((window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/api');

export interface Notification {
  id: string;
  type: 'NEW_FOLLOWER' | 'LIKE' | 'COMMENT' | 'BADGE_UNLOCKED' | 'LEVEL_UP' | 'SYSTEM';
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

// REST API calls
export async function getNotifications(
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<NotificationsResponse> {
  const response = await fetch(
    `${API_BASE}/notifications?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Error al obtener notificaciones');
  }

  const data = await response.json();
  return data.data;
}

export async function getUnreadCount(token: string): Promise<number> {
  const response = await fetch(`${API_BASE}/notifications/unread-count`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener conteo');
  }

  const data = await response.json();
  return data.data.count;
}

export async function markAsRead(notificationIds: string[], token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/notifications/mark-read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notificationIds }),
  });

  if (!response.ok) {
    throw new Error('Error al marcar como leídas');
  }
}

export async function markAllAsRead(token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/notifications/mark-all-read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al marcar como leídas');
  }
}

export async function deleteNotification(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/notifications/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al eliminar notificación');
  }
}

// WebSocket connection
export type NotificationCallback = (notification: Notification) => void;
export type UnreadCountCallback = (count: number) => void;

let ws: WebSocket | null = null;
let notificationCallbacks: NotificationCallback[] = [];
let unreadCountCallbacks: UnreadCountCallback[] = [];
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

export function connectWebSocket(token: string): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return;
  }

  const wsUrl = `${WS_BASE}/notifications/ws?token=${token}`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket connected');
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      if (message.type === 'connected') {
        unreadCountCallbacks.forEach((cb) => cb(message.data.unreadCount));
      } else if (message.type === 'notification') {
        notificationCallbacks.forEach((cb) => cb(message.data));
        // Also increment unread count
        // The component should handle this
      }
    } catch {
      // Ignore malformed messages
    }
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    ws = null;

    // Try to reconnect after 5 seconds
    reconnectTimeout = setTimeout(() => {
      connectWebSocket(token);
    }, 5000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    ws?.close();
  };
}

export function disconnectWebSocket(): void {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }

  notificationCallbacks = [];
  unreadCountCallbacks = [];
}

export function onNotification(callback: NotificationCallback): () => void {
  notificationCallbacks.push(callback);
  return () => {
    notificationCallbacks = notificationCallbacks.filter((cb) => cb !== callback);
  };
}

export function onUnreadCount(callback: UnreadCountCallback): () => void {
  unreadCountCallbacks.push(callback);
  return () => {
    unreadCountCallbacks = unreadCountCallbacks.filter((cb) => cb !== callback);
  };
}

// Send message via WebSocket
export function sendMessage(data: unknown): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

// Helper to get notification icon
export function getNotificationIcon(type: Notification['type']): string {
  const icons = {
    NEW_FOLLOWER: '👥',
    LIKE: '❤️',
    COMMENT: '💬',
    BADGE_UNLOCKED: '🏆',
    LEVEL_UP: '⬆️',
    SYSTEM: '📢',
  };
  return icons[type] || '🔔';
}

// Format time ago
export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return 'ahora';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}
