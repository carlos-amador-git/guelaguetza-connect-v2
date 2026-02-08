// Gamification Service - API calls for XP, badges, and leaderboard

const API_BASE = ((import.meta as any).env.VITE_API_URL || '') + '/api';

export interface UserStats {
  xp: number;
  level: number;
  xpForNextLevel: number;
  xpProgress: number;
  currentStreak: number;
  longestStreak: number;
  rank: number;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'STORIES' | 'SOCIAL' | 'ENGAGEMENT' | 'STREAK' | 'SPECIAL';
  xpReward: number;
  threshold: number;
  unlockedAt?: string;
  isUnlocked: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nombre: string;
  avatar: string | null;
  xp: number;
  level: number;
}

export interface CheckInResult {
  streak: number;
  isNewDay: boolean;
  xpAwarded: number;
  newBadges: Badge[];
}

// Get current user's stats
export async function getMyStats(token: string): Promise<UserStats> {
  const response = await fetch(`${API_BASE}/gamification/me/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener estadísticas');
  }

  const data = await response.json();
  return data.data;
}

// Get current user's badges
export async function getMyBadges(token: string): Promise<Badge[]> {
  const response = await fetch(`${API_BASE}/gamification/me/badges`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener badges');
  }

  const data = await response.json();
  return data.data;
}

// Daily check-in
export async function checkIn(token: string): Promise<CheckInResult> {
  const response = await fetch(`${API_BASE}/gamification/me/check-in`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al hacer check-in');
  }

  const data = await response.json();
  return data.data;
}

// Get another user's stats
export async function getUserStats(userId: string): Promise<UserStats> {
  const response = await fetch(`${API_BASE}/gamification/users/${userId}/stats`);

  if (!response.ok) {
    throw new Error('Error al obtener estadísticas');
  }

  const data = await response.json();
  return data.data;
}

// Get another user's badges (unlocked only)
export async function getUserBadges(userId: string): Promise<Badge[]> {
  const response = await fetch(`${API_BASE}/gamification/users/${userId}/badges`);

  if (!response.ok) {
    throw new Error('Error al obtener badges');
  }

  const data = await response.json();
  return data.data;
}

// Get leaderboard
export async function getLeaderboard(
  page: number = 1,
  limit: number = 20
): Promise<{ entries: LeaderboardEntry[]; total: number }> {
  const response = await fetch(
    `${API_BASE}/gamification/leaderboard?page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Error al obtener leaderboard');
  }

  const data = await response.json();
  return data.data;
}

// Level thresholds (must match backend)
const LEVEL_THRESHOLDS = [
  0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500,
  5500, 6600, 7800, 9100, 10500,
];

export function getLevelTitle(level: number): string {
  const titles = [
    'Novato',        // 1
    'Aprendiz',      // 2
    'Explorador',    // 3
    'Viajero',       // 4
    'Aventurero',    // 5
    'Conocedor',     // 6
    'Experto',       // 7
    'Maestro',       // 8
    'Leyenda',       // 9
    'Guardián',      // 10
    'Embajador',     // 11
    'Campeón',       // 12
    'Héroe',         // 13
    'Mito',          // 14
    'Oaxaqueño',     // 15+
  ];
  return titles[Math.min(level - 1, titles.length - 1)] || 'Oaxaqueño';
}

export function getCategoryName(category: Badge['category']): string {
  const names = {
    STORIES: 'Historias',
    SOCIAL: 'Social',
    ENGAGEMENT: 'Participación',
    STREAK: 'Rachas',
    SPECIAL: 'Especiales',
  };
  return names[category] || category;
}
