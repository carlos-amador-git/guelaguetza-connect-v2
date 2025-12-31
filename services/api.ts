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

// Story interactions
export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    nombre: string;
    avatar: string | null;
  };
}

export interface StoryWithDetails extends Story {
  isLiked?: boolean;
  comments?: Comment[];
}

export async function likeStory(storyId: string, token: string): Promise<{ liked: boolean; likesCount: number }> {
  const res = await fetch(`${API_BASE}/stories/${storyId}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to like story');
  return res.json();
}

export async function addComment(
  storyId: string,
  text: string,
  token: string
): Promise<Comment> {
  const res = await fetch(`${API_BASE}/stories/${storyId}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to add comment');
  return res.json();
}

export async function createStory(
  data: { description: string; mediaUrl: string; location: string },
  token: string
): Promise<Story> {
  const res = await fetch(`${API_BASE}/stories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create story');
  return res.json();
}

export async function deleteStory(storyId: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/stories/${storyId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to delete story');
}
