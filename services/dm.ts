// Direct Messages Service - API calls and WebSocket connection

const API_BASE = (import.meta as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || 'http://localhost:3000/api';
const WS_BASE = (import.meta as { env: { VITE_WS_URL?: string } }).env.VITE_WS_URL || 'ws://localhost:3000/api';

export interface Participant {
  id: string;
  nombre: string;
  apellido: string | null;
  avatar: string | null;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: Participant;
}

export interface Conversation {
  id: string;
  lastMessageAt: string | null;
  createdAt: string;
  otherParticipant: Participant;
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
}

export interface MessagesResponse {
  messages: DirectMessage[];
  hasMore: boolean;
}

// REST API calls
export async function getConversations(
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<ConversationsResponse> {
  const response = await fetch(
    `${API_BASE}/dm/conversations?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Error al obtener conversaciones');
  }

  const data = await response.json();
  return data.data;
}

export async function createConversation(
  participantId: string,
  token: string
): Promise<{ id: string; otherParticipant: Participant }> {
  const response = await fetch(`${API_BASE}/dm/conversations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ participantId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear conversación');
  }

  const data = await response.json();
  return data.data;
}

export async function getMessages(
  conversationId: string,
  page: number = 1,
  limit: number = 30,
  token: string
): Promise<MessagesResponse> {
  const response = await fetch(
    `${API_BASE}/dm/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Error al obtener mensajes');
  }

  const data = await response.json();
  return data.data;
}

export async function sendMessage(
  conversationId: string,
  content: string,
  token: string
): Promise<DirectMessage> {
  const response = await fetch(`${API_BASE}/dm/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ conversationId, content }),
  });

  if (!response.ok) {
    throw new Error('Error al enviar mensaje');
  }

  const data = await response.json();
  return data.data;
}

export async function markMessageAsRead(messageId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/dm/messages/${messageId}/read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al marcar mensaje');
  }
}

export async function getUnreadCount(token: string): Promise<number> {
  const response = await fetch(`${API_BASE}/dm/unread-count`, {
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

// WebSocket connection
export type MessageCallback = (message: DirectMessage) => void;
export type UnreadCountCallback = (count: number) => void;

let ws: WebSocket | null = null;
let messageCallbacks: MessageCallback[] = [];
let unreadCountCallbacks: UnreadCountCallback[] = [];
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

export function connectDMWebSocket(token: string): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return;
  }

  const wsUrl = `${WS_BASE}/dm/ws?token=${token}`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('DM WebSocket connected');
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
      } else if (message.type === 'message') {
        messageCallbacks.forEach((cb) => cb(message.data));
      }
    } catch {
      // Ignore malformed messages
    }
  };

  ws.onclose = () => {
    console.log('DM WebSocket disconnected');
    ws = null;

    // Try to reconnect after 5 seconds
    reconnectTimeout = setTimeout(() => {
      connectDMWebSocket(token);
    }, 5000);
  };

  ws.onerror = (error) => {
    console.error('DM WebSocket error:', error);
    ws?.close();
  };
}

export function disconnectDMWebSocket(): void {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }

  messageCallbacks = [];
  unreadCountCallbacks = [];
}

export function onMessage(callback: MessageCallback): () => void {
  messageCallbacks.push(callback);
  return () => {
    messageCallbacks = messageCallbacks.filter((cb) => cb !== callback);
  };
}

export function onDMUnreadCount(callback: UnreadCountCallback): () => void {
  unreadCountCallbacks.push(callback);
  return () => {
    unreadCountCallbacks = unreadCountCallbacks.filter((cb) => cb !== callback);
  };
}

export function markConversationAsRead(conversationId: string): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'markRead', conversationId }));
  }
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
