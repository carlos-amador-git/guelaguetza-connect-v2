// Social Service - API calls for followers, profiles, and feed
import { MOCK_STORIES, MOCK_USERS } from './mockData';

const API_BASE = ((import.meta as any).env.VITE_API_URL || '') + '/api';

export interface UserProfile {
  id: string;
  nombre: string;
  apellido: string | null;
  avatar: string | null;
  bio: string | null;
  region: string | null;
  isPublic: boolean;
  followersCount: number;
  followingCount: number;
  storiesCount: number;
  isFollowing?: boolean;
  createdAt: string;
}

export interface UserListItem {
  id: string;
  nombre: string;
  apellido: string | null;
  avatar: string | null;
  bio: string | null;
  isFollowing?: boolean;
}

export interface PaginatedUsers {
  users: UserListItem[];
  total: number;
  hasMore: boolean;
}

export interface FeedStory {
  id: string;
  description: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  thumbnailUrl: string | null;
  duration: number | null;
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
  isLiked: boolean;
}

export interface PaginatedFeed {
  stories: FeedStory[];
  total: number;
  hasMore: boolean;
}

// Follow a user
export async function followUser(userId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/users/${userId}/follow`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al seguir usuario');
  }
}

// Unfollow a user
export async function unfollowUser(userId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/users/${userId}/follow`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al dejar de seguir');
  }
}

// Check if following a user
export async function isFollowing(userId: string, token: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/users/${userId}/is-following`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.data.isFollowing;
}

// Get user's public profile
export async function getUserProfile(userId: string, token?: string): Promise<UserProfile> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/users/${userId}/profile`, { headers });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener perfil');
    }

    const data = await response.json();
    return data.data;
  } catch {
    // Return mock data when backend is unavailable
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
      return {
        ...user,
        isPublic: true,
        isFollowing: false,
      };
    }
    throw new Error('Usuario no encontrado');
  }
}

// Get user's followers
export async function getFollowers(
  userId: string,
  page: number = 1,
  limit: number = 20,
  token?: string
): Promise<PaginatedUsers> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE}/users/${userId}/followers?page=${page}&limit=${limit}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error('Error al obtener seguidores');
  }

  const data = await response.json();
  return data.data;
}

// Get users that a user is following
export async function getFollowing(
  userId: string,
  page: number = 1,
  limit: number = 20,
  token?: string
): Promise<PaginatedUsers> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE}/users/${userId}/following?page=${page}&limit=${limit}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error('Error al obtener siguiendo');
  }

  const data = await response.json();
  return data.data;
}

// Get user's stories
export async function getUserStories(
  userId: string,
  page: number = 1,
  limit: number = 20,
  token?: string
): Promise<PaginatedFeed> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE}/users/${userId}/stories?page=${page}&limit=${limit}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error('Error al obtener stories');
  }

  const data = await response.json();
  return data.data;
}

// Get personalized feed (stories from users you follow)
export async function getFeed(
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedFeed> {
  try {
    const response = await fetch(
      `${API_BASE}/feed?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error al obtener feed');
    }

    const data = await response.json();
    return data.data;
  } catch {
    // Return mock data when backend is unavailable
    const start = (page - 1) * limit;
    const paginatedStories = MOCK_STORIES.slice(start, start + limit);

    return {
      stories: paginatedStories,
      total: MOCK_STORIES.length,
      hasMore: start + limit < MOCK_STORIES.length,
    };
  }
}
