import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Achievement } from '../../types/ar';

// ============================================================================
// COMPONENT: AchievementToast
// Appears when a new achievement is unlocked — auto-dismisses after 4 seconds
// ============================================================================

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

const TIPO_EMOJIS: Record<Achievement['tipo'], string> = {
  collect_count: '📦',
  collect_all: '✨',
  collect_region: '🗺️',
  complete_quest: '🎯',
  first_action: '🚀',
  time_based: '⏱️',
  creation: '🦌',
};

const DIFFICULTY_COLORS: Record<Achievement['dificultad'], string> = {
  facil: '#22c55e',
  normal: '#3b82f6',
  dificil: '#f59e0b',
};

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const emoji = TIPO_EMOJIS[achievement.tipo] ?? '🏅';
  const color = DIFFICULTY_COLORS[achievement.dificultad] ?? '#9ca3af';

  // Animate in
  useEffect(() => {
    const enterTimer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(enterTimer);
  }, []);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const leaveTimer = setTimeout(() => {
      setIsLeaving(true);
      const dismissTimer = setTimeout(() => onDismiss(), 400);
      return () => clearTimeout(dismissTimer);
    }, 4000);
    return () => clearTimeout(leaveTimer);
  }, [onDismiss]);

  function handleDismiss() {
    setIsLeaving(true);
    setTimeout(() => onDismiss(), 400);
  }

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-80 max-w-[calc(100vw-2rem)]
        transition-all duration-400
        ${isVisible && !isLeaving
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4 pointer-events-none'}`}
      role="alert"
      aria-live="polite"
      aria-label="Nuevo logro desbloqueado"
      data-testid="achievement-toast"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Colored top bar */}
        <div className="h-1" style={{ backgroundColor: color }} aria-hidden="true" />

        <div className="flex items-center gap-3 p-4">
          {/* Badge icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-inner"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${color}33, ${color}11)`,
              border: `2px solid ${color}`,
            }}
            aria-hidden="true"
          >
            {achievement.badgeUrl ? (
              <img src={achievement.badgeUrl} alt="" className="w-9 h-9 object-contain" />
            ) : (
              <span>{emoji}</span>
            )}
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-0.5">
              Logro desbloqueado!
            </p>
            <p className="font-black text-gray-900 leading-tight truncate">
              {achievement.nombre}
            </p>
            {achievement.descripcion && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {achievement.descripcion}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs" aria-hidden="true">⭐</span>
              <span className="text-xs font-bold text-amber-600">
                +{achievement.pointsReward} puntos
              </span>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            aria-label="Cerrar notificacion"
            className="shrink-0 p-1.5 rounded-full hover:bg-gray-100 text-gray-400
                       focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar (auto-dismiss countdown) */}
        <div className="h-0.5 bg-gray-100" aria-hidden="true">
          <div
            className="h-full transition-all ease-linear"
            style={{
              backgroundColor: color,
              width: isLeaving ? '0%' : isVisible ? '0%' : '100%',
              transitionDuration: isVisible && !isLeaving ? '4000ms' : '400ms',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default AchievementToast;
