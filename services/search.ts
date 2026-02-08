// Search Service - API calls

const API_BASE = ((import.meta as any).env.VITE_API_URL || '') + '/api';

export interface SearchUser {
  id: string;
  nombre: string;
  apellido: string | null;
  avatar: string | null;
  bio: string | null;
  followersCount: number;
}

export interface SearchStory {
  id: string;
  description: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  thumbnailUrl: string | null;
  location: string;
  likesCount: number;
  createdAt: string;
  user: {
    id: string;
    nombre: string;
    avatar: string | null;
  };
}

export interface TrendingHashtag {
  hashtag: string;
  count: number;
}

export interface SearchResults {
  users: SearchUser[];
  stories: SearchStory[];
  hasMore: boolean;
}

export interface TrendingResults {
  hashtags: TrendingHashtag[];
  stories: SearchStory[];
}

// Search users, stories, or both
export async function search(
  query: string,
  type: 'users' | 'stories' | 'all' = 'all',
  page: number = 1,
  limit: number = 20
): Promise<SearchResults> {
  const params = new URLSearchParams({
    q: query,
    type,
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`${API_BASE}/search?${params}`);

  if (!response.ok) {
    throw new Error('Error en la búsqueda');
  }

  const data = await response.json();
  return data.data;
}

// Get trending content
export async function getTrending(): Promise<TrendingResults> {
  const response = await fetch(`${API_BASE}/search/trending`);

  if (!response.ok) {
    throw new Error('Error al obtener trending');
  }

  const data = await response.json();
  return data.data;
}

// Get search suggestions (autocomplete)
export async function getSuggestions(
  query: string,
  limit: number = 5
): Promise<string[]> {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
  });

  const response = await fetch(`${API_BASE}/search/suggestions?${params}`);

  if (!response.ok) {
    throw new Error('Error al obtener sugerencias');
  }

  const data = await response.json();
  return data.data.suggestions;
}

// Debounce helper for search input
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Extract hashtags from text
export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\wáéíóúñÁÉÍÓÚÑ]+/g);
  return matches ? matches.map((h) => h.toLowerCase()) : [];
}
