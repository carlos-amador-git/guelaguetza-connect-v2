// Analytics Service - API calls

const API_BASE = ((import.meta as any).env.VITE_API_URL || '') + '/api';

export interface StoryStats {
  id: string;
  description: string;
  mediaUrl: string;
  mediaType: string;
  thumbnailUrl: string | null;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;
  createdAt: string;
}

export interface UserAnalytics {
  totalStories: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  followersCount: number;
  followingCount: number;
  engagementRate: number;
  avgLikesPerStory: number;
  avgCommentsPerStory: number;
  topPerformingStories: StoryStats[];
}

export interface TrendData {
  date: string;
  likes: number;
  comments: number;
  views: number;
  followers: number;
}

export interface TrendsResponse {
  daily: TrendData[];
  totals: {
    likes: number;
    comments: number;
    views: number;
    newFollowers: number;
  };
  growth: {
    likesChange: number;
    commentsChange: number;
    viewsChange: number;
    followersChange: number;
  };
}

// Get my analytics
export async function getMyAnalytics(token: string): Promise<UserAnalytics> {
  const response = await fetch(`${API_BASE}/analytics/my-stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener estadisticas');
  }

  const data = await response.json();
  return data.data;
}

// Get story stats
export async function getStoryStats(storyId: string, token: string): Promise<StoryStats> {
  const response = await fetch(`${API_BASE}/analytics/story/${storyId}/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener estadisticas de historia');
  }

  const data = await response.json();
  return data.data;
}

// Get trends
export async function getTrends(days: number = 7, token: string): Promise<TrendsResponse> {
  const response = await fetch(`${API_BASE}/analytics/trends?days=${days}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener tendencias');
  }

  const data = await response.json();
  return data.data;
}

// Format number with K/M suffix
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Format percentage with sign
export function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change}%`;
}

// Get change color class
export function getChangeColor(change: number): string {
  if (change > 0) return 'text-green-500';
  if (change < 0) return 'text-red-500';
  return 'text-gray-400';
}
