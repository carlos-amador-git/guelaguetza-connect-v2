import { ChevronLeft, Trophy } from 'lucide-react';
import { ViewState } from '../../types';
import { useAchievements } from '../../hooks/ar/useAchievements';
import { useDeviceId } from '../../hooks/ar/useDeviceId';
import { AchievementCard } from './AchievementCard';
import type { AchievementType } from '../../types/ar';

// ============================================================================
// COMPONENT: AchievementsView
// Grid of all achievements — unlocked (color) and locked (gray)
// ============================================================================

interface AchievementsViewProps {
  onNavigate: (view: ViewState, data?: unknown) => void;
  onBack: () => void;
}

// Category groupings for display
const CATEGORY_LABELS: Record<AchievementType, string> = {
  collect_count: 'Coleccion',
  collect_all: 'Coleccion',
  collect_region: 'Regiones',
  complete_quest: 'Misiones',
  first_action: 'Primeras veces',
  time_based: 'Tiempo',
  creation: 'Creacion',
};

function AchievementsGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

export function AchievementsView({ onNavigate: _onNavigate, onBack }: AchievementsViewProps) {
  const deviceId = useDeviceId();
  const { allAchievements, userAchievements, isLoading, error, isUnlocked } =
    useAchievements(deviceId || null);

  const totalPointsEarned = userAchievements.reduce(
    (sum, ua) => sum + (ua.achievement?.pointsReward ?? 0),
    0
  );

  // Group achievements by category type
  const grouped = allAchievements.reduce<Record<string, typeof allAchievements>>(
    (acc, ach) => {
      const cat = CATEGORY_LABELS[ach.tipo] ?? 'Otros';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(ach);
      return acc;
    },
    {}
  );

  return (
    <div className="flex flex-col h-full bg-gray-50" data-testid="achievements-view">
      {/* Header */}
      <header className="bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-3 px-4 pt-8 pb-4 md:pt-5">
          <button
            onClick={onBack}
            aria-label="Volver"
            className="p-2 -ml-1 rounded-full hover:bg-gray-100 focus:outline-none
                       focus:ring-2 focus:ring-red-500 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Logros</h1>
            <p className="text-xs text-gray-500">
              {userAchievements.length} / {allAchievements.length} desbloqueados
            </p>
          </div>

          {/* Points earned badge */}
          {totalPointsEarned > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200
                            rounded-full px-3 py-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
              <span className="text-xs font-bold text-amber-700">
                {totalPointsEarned.toLocaleString()} pts
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-8">
        {isLoading ? (
          <AchievementsGridSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4" role="img" aria-label="error">⚠️</span>
            <p className="text-gray-700 font-semibold">Error al cargar logros</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        ) : allAchievements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy className="w-12 h-12 text-gray-300 mb-4" aria-hidden="true" />
            <p className="text-gray-700 font-semibold">Sin logros disponibles</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, achievements]) => (
              <section key={category} aria-label={`Categoria: ${category}`}>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  {category}
                  <span className="ml-2 text-gray-400 font-normal">
                    ({achievements.filter((a) => isUnlocked(a.id)).length}/{achievements.length})
                  </span>
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {achievements.map((ach) => {
                    const userAch = userAchievements.find((ua) => ua.achievementId === ach.id);
                    return (
                      <AchievementCard
                        key={ach.id}
                        achievement={ach}
                        isUnlocked={isUnlocked(ach.id)}
                        unlockedAt={userAch?.unlockedAt}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default AchievementsView;
