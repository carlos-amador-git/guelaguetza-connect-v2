import React from 'react';
import type { Achievement } from '../../types/ar';

// ============================================================================
// COMPONENT: AchievementCard
// Displays a single achievement as a badge — unlocked (color) or locked (gray)
// ============================================================================

const DIFFICULTY_COLORS: Record<Achievement['dificultad'], string> = {
  facil: '#22c55e',
  normal: '#3b82f6',
  dificil: '#f59e0b',
};

const TIPO_EMOJIS: Record<Achievement['tipo'], string> = {
  collect_count: '📦',
  collect_all: '✨',
  collect_region: '🗺️',
  complete_quest: '🎯',
  first_action: '🚀',
  time_based: '⏱️',
  creation: '🦌',
};

interface AchievementCardProps {
  key?: React.Key;
  achievement: Achievement;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export function AchievementCard({ achievement, isUnlocked, unlockedAt }: AchievementCardProps) {
  const difficultyColor = DIFFICULTY_COLORS[achievement.dificultad] ?? '#9ca3af';
  const emoji = TIPO_EMOJIS[achievement.tipo] ?? '🏅';

  const formattedDate = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div
      className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all
        ${isUnlocked
          ? 'bg-white border-gray-200 shadow-sm'
          : 'bg-gray-50 border-gray-100 opacity-60'}`}
      data-testid={`achievement-card-${achievement.id}`}
      role="article"
      aria-label={`${achievement.nombre}${isUnlocked ? ', desbloqueado' : ', bloqueado'}`}
    >
      {/* Badge circle */}
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner
          ${isUnlocked ? '' : 'grayscale'}`}
        style={{
          background: isUnlocked
            ? `radial-gradient(circle at 35% 35%, ${difficultyColor}33, ${difficultyColor}11)`
            : '#f3f4f6',
          border: `3px solid ${isUnlocked ? difficultyColor : '#e5e7eb'}`,
        }}
        aria-hidden="true"
      >
        {achievement.badgeUrl ? (
          <img
            src={achievement.badgeUrl}
            alt=""
            className={`w-10 h-10 object-contain ${!isUnlocked ? 'grayscale' : ''}`}
          />
        ) : (
          <span>{emoji}</span>
        )}
      </div>

      {/* Name */}
      <h3
        className={`text-xs font-bold leading-tight mb-1 ${
          isUnlocked ? 'text-gray-900' : 'text-gray-500'
        }`}
      >
        {isUnlocked ? achievement.nombre : '???'}
      </h3>

      {/* Points reward */}
      <div
        className={`text-xs font-semibold mb-1 ${
          isUnlocked ? 'text-amber-600' : 'text-gray-400'
        }`}
        aria-label={`${achievement.pointsReward} puntos`}
      >
        +{achievement.pointsReward} pts
      </div>

      {/* Difficulty dot */}
      <div
        className="w-2 h-2 rounded-full mb-1"
        style={{ backgroundColor: isUnlocked ? difficultyColor : '#d1d5db' }}
        aria-label={`Dificultad: ${achievement.dificultad}`}
        title={achievement.dificultad}
      />

      {/* Unlocked date or locked hint */}
      {isUnlocked ? (
        formattedDate && (
          <p className="text-xs text-gray-400 leading-tight">{formattedDate}</p>
        )
      ) : (
        <p className="text-xs text-gray-400 leading-tight">Bloqueado</p>
      )}
    </div>
  );
}

export default AchievementCard;
