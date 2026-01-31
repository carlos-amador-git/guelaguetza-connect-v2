import React from 'react';
import { Zap, Flame, Trophy } from 'lucide-react';
import { getLevelTitle } from '../../services/gamification';

interface XPProgressProps {
  xp: number;
  level: number;
  xpProgress: number;
  xpForNextLevel: number;
  streak?: number;
  compact?: boolean;
}

const XPProgress: React.FC<XPProgressProps> = ({
  xp,
  level,
  xpProgress,
  xpForNextLevel,
  streak = 0,
  compact = false,
}) => {
  const levelTitle = getLevelTitle(level);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Level badge */}
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-oaxaca-purple to-oaxaca-pink text-white px-3 py-1 rounded-full text-sm font-medium">
          <Trophy size={14} />
          <span>Nv. {level}</span>
        </div>

        {/* XP */}
        <div className="flex items-center gap-1 text-oaxaca-yellow">
          <Zap size={16} className="fill-current" />
          <span className="text-sm font-medium">{xp.toLocaleString()}</span>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="flex items-center gap-1 text-oaxaca-yellow">
            <Flame size={16} className="fill-current" />
            <span className="text-sm font-medium">{streak}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Level circle */}
          <div className="w-12 h-12 bg-gradient-to-br from-oaxaca-purple to-oaxaca-pink rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">{level}</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">{levelTitle}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nivel {level}</p>
          </div>
        </div>

        {/* Streak badge */}
        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-oaxaca-yellow-light dark:bg-oaxaca-yellow/20 text-oaxaca-yellow dark:text-oaxaca-yellow px-3 py-1.5 rounded-full">
            <Flame size={18} className="fill-current" />
            <span className="font-bold">{streak} días</span>
          </div>
        )}
      </div>

      {/* XP Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-oaxaca-yellow font-medium">
            <Zap size={16} className="fill-current" />
            {xp.toLocaleString()} XP
          </span>
          <span className="text-gray-400">
            {xpForNextLevel.toLocaleString()} XP
          </span>
        </div>

        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-oaxaca-yellow to-oaxaca-pink rounded-full transition-all duration-500"
            style={{ width: `${Math.min(xpProgress, 100)}%` }}
          />
        </div>

        <p className="text-xs text-gray-400 text-center">
          {Math.round(xpProgress)}% para nivel {level + 1}
        </p>
      </div>
    </div>
  );
};

export default XPProgress;
