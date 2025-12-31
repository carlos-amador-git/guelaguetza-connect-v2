const API_BASE = 'http://localhost:3005/api';

// Types
export interface Story {
  id: string;
  description: string;
  mediaUrl: string;
  location: string;
  views: number;
  createdAt: string;
  user: {
    id: string;
    nombre: string;
    avatar: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

export interface BusRoute {
  id: string;
  routeCode: string;
  name: string;
  color: string;
  type: string;
  description: string | null;
  frequency: number | null;
  stops: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    sequence: number;
  }>;
  buses: Array<{
    id: string;
    busCode: string;
    latitude: number | null;
    longitude: number | null;
  }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  createdAt: string;
  messages: ChatMessage[];
}

// API Functions
export async function fetchStories(): Promise<Story[]> {
  const res = await fetch(`${API_BASE}/stories`);
  if (!res.ok) throw new Error('Failed to fetch stories');
  const data = await res.json();
  return data.stories;
}

export async function fetchRoutes(): Promise<BusRoute[]> {
  const res = await fetch(`${API_BASE}/transport/routes`);
  if (!res.ok) throw new Error('Failed to fetch routes');
  return res.json();
}

export async function fetchRouteById(id: string): Promise<BusRoute> {
  const res = await fetch(`${API_BASE}/transport/routes/${id}`);
  if (!res.ok) throw new Error('Failed to fetch route');
  return res.json();
}

export async function sendChatMessage(
  message: string,
  conversationId?: string
): Promise<{ response: string; conversationId: string }> {
  const res = await fetch(`${API_BASE}/chat/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationId }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function fetchConversation(id: string): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/chat/conversations/${id}`);
  if (!res.ok) throw new Error('Failed to fetch conversation');
  return res.json();
}
