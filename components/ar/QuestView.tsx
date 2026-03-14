import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, MapPin, CheckCircle, Circle, Trophy } from 'lucide-react';
import { ViewState } from '../../types';
import type { Quest, ARPoint, UserQuestProgress } from '../../types/ar';
import { useDeviceId } from '../../hooks/ar/useDeviceId';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

// ============================================================================
// TYPES
// ============================================================================

interface QuestDetail extends Quest {
  items: (ARPoint & { regionNombre?: string; regionColor?: string })[];
}

interface QuestViewProps {
  questId: string;
  onNavigate: (view: ViewState, data?: unknown) => void;
  onBack: () => void;
}

// ============================================================================
// SUB-COMPONENT: Progress banner
// ============================================================================

function QuestProgressBanner({
  quest,
  progress,
}: {
  quest: QuestDetail;
  progress: UserQuestProgress | null;
}) {
  const collected = progress?.itemsCollected ?? 0;
  const total = quest.totalItems;
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;
  const isComplete = !!progress?.completedAt;

  return (
    <div
      className={`mx-4 mt-4 rounded-xl p-4 text-white shadow-md
        ${isComplete
          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
          : 'bg-gradient-to-r from-red-600 to-amber-500'}`}
      aria-label="Progreso de la quest"
    >
      {isComplete ? (
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-900" aria-hidden="true" />
          <div>
            <p className="font-bold text-amber-900">Mission completada!</p>
            <p className="text-xs text-amber-900/80">
              Ganaste {quest.rewardPoints} puntos
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Tu progreso</span>
            <span className="text-sm font-bold">
              {collected} / {total}
            </span>
          </div>
          <div
            className="h-3 bg-white/30 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={collected}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${collected} de ${total} items encontrados`}
          >
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-white/80 mt-1.5">{pct}% completado</p>
        </>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: Map section placeholder
// ============================================================================

function QuestMapSection({
  items,
  foundIds,
}: {
  items: QuestDetail['items'];
  foundIds: Set<number>;
}) {
  return (
    <section
      className="mx-4 mt-4 rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-teal-100
                 aspect-video relative border border-gray-200"
      aria-label="Mapa de la quest"
      data-testid="quest-map"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <MapPin className="w-8 h-8 text-gray-300" aria-hidden="true" />
        <span className="sr-only">Mapa de puntos de la quest</span>
      </div>

      {/* Points as dots — relative positioning using index for spread */}
      {items.map((item, idx) => {
        const isFound = foundIds.has(item.id);
        const top = 20 + ((idx * 17) % 55);
        const left = 15 + ((idx * 22) % 70);
        return (
          <div
            key={item.id}
            className={`absolute w-9 h-9 rounded-full border-3 border-white shadow-md
                        flex items-center justify-center text-sm transform -translate-x-1/2 -translate-y-1/2
                        ${isFound ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ top: `${top}%`, left: `${left}%` }}
            title={item.nombre}
            aria-label={`${item.nombre}${isFound ? ', encontrado' : ', no encontrado'}`}
          >
            {isFound ? '✓' : item.emoji || '📍'}
          </div>
        );
      })}
    </section>
  );
}

// ============================================================================
// SUB-COMPONENT: Narrative fragment
// ============================================================================

function NarrativeFragment({ text, index }: { key?: React.Key; text: string; index: number }) {
  return (
    <div
      className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4 mx-4"
      data-testid={`narrative-fragment-${index}`}
    >
      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
        Fragmento {index + 1} desbloqueado
      </p>
      <p className="text-sm text-amber-900 italic leading-relaxed">{text}</p>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: Celebration overlay
// ============================================================================

function CompletionCelebration({ rewardPoints }: { rewardPoints: number }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      data-testid="quest-completion"
      role="dialog"
      aria-modal="true"
      aria-label="Quest completada"
    >
      <div className="bg-white rounded-3xl p-8 mx-6 text-center shadow-2xl max-w-sm">
        <div className="text-7xl mb-4" role="img" aria-label="trofeo">🏆</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Quest completada!</h2>
        <p className="text-gray-600 mb-4">
          Has descubierto todos los items de esta mision.
        </p>
        <div className="inline-flex items-center gap-2 bg-amber-100 rounded-full px-5 py-2 text-amber-800 font-bold text-lg">
          <span aria-hidden="true">⭐</span>
          <span>+{rewardPoints} puntos</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: QuestView
// ============================================================================

export function QuestView({ questId, onNavigate: _onNavigate, onBack }: QuestViewProps) {
  const deviceId = useDeviceId();
  const [quest, setQuest] = useState<QuestDetail | null>(null);
  const [progress, setProgress] = useState<UserQuestProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const fetchQuestData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const questRes = await fetch(`${API_BASE}/ar/quests/${questId}`);
      if (!questRes.ok) throw new Error(`Error ${questRes.status}`);
      const questData: QuestDetail = await questRes.json();
      setQuest(questData);

      if (deviceId) {
        const progressRes = await fetch(
          `${API_BASE}/ar/quests/${questId}/progress?userId=${deviceId}`
        );
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          if (progressData.started) {
            setProgress(progressData as UserQuestProgress);
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar la quest');
    } finally {
      setIsLoading(false);
    }
  }, [questId, deviceId]);

  useEffect(() => {
    fetchQuestData();
  }, [fetchQuestData]);

  // Show celebration when newly completed
  useEffect(() => {
    if (progress?.completedAt) {
      const timeout = setTimeout(() => setShowCelebration(true), 300);
      return () => clearTimeout(timeout);
    }
  }, [progress?.completedAt]);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-gray-50" data-testid="quest-view-loading">
        <div className="h-16 bg-white shadow-sm animate-pulse" />
        <div className="m-4 h-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="mx-4 h-24 bg-gray-200 rounded-xl animate-pulse" />
        <div className="m-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !quest) {
    return (
      <div className="flex flex-col h-full bg-gray-50 items-center justify-center" data-testid="quest-view-error">
        <span className="text-5xl mb-4" role="img" aria-label="error">⚠️</span>
        <p className="text-gray-700 font-semibold">{error || 'Quest no encontrada'}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
        >
          Volver
        </button>
      </div>
    );
  }

  const foundIds = new Set<number>(progress?.itemsFound ?? []);

  // Narrative fragments unlocked for each found item that has narrativa
  const unlockedNarratives = quest.items
    .filter((item) => foundIds.has(item.id) && item.narrativa)
    .map((item) => item.narrativa as string);

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden" data-testid="quest-view">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-3 px-4 pt-8 pb-4 md:pt-5">
          <button
            onClick={onBack}
            aria-label="Volver a misiones"
            className="p-2 -ml-1 rounded-full hover:bg-gray-100 focus:outline-none
                       focus:ring-2 focus:ring-red-500 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{quest.nombre}</h1>
            <p className="text-xs text-gray-500">
              {quest.totalItems} items &bull; {quest.rewardPoints} pts recompensa
            </p>
          </div>
        </div>
      </header>

      {/* ── Scrollable body ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pb-8">
        {/* Banner with narrative intro */}
        <div
          className="mx-4 mt-4 rounded-xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, #E63946, #F4A261)',
            minHeight: '120px',
          }}
          aria-label="Banner de la quest"
        >
          {quest.imagenPortadaUrl && (
            <img
              src={quest.imagenPortadaUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20"
              aria-hidden="true"
            />
          )}
          <div className="relative z-10 p-5 text-white">
            <div className="text-4xl mb-2" role="img" aria-label={quest.nombre}>
              {quest.iconoUrl ? (
                <img src={quest.iconoUrl} alt="" className="w-10 h-10" />
              ) : (
                '🗺️'
              )}
            </div>
            {quest.narrativa && (
              <p className="text-sm text-white/90 leading-relaxed italic">{quest.narrativa}</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <QuestProgressBanner quest={quest} progress={progress} />

        {/* Map */}
        <QuestMapSection items={quest.items} foundIds={foundIds} />

        {/* Items list */}
        <section className="mx-4 mt-4" aria-label="Items de la quest">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
            Items a encontrar
          </h2>
          <div className="space-y-2">
            {quest.items.map((item) => {
              const isFound = foundIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                    ${isFound
                      ? 'bg-green-50 border-green-300'
                      : 'bg-white border-gray-100'}`}
                  data-testid={`quest-item-${item.id}`}
                  aria-label={`${item.nombre}${isFound ? ', encontrado' : ', no encontrado'}`}
                >
                  {isFound ? (
                    <CheckCircle className="w-6 h-6 text-green-500 shrink-0" aria-hidden="true" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300 shrink-0" aria-hidden="true" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${isFound ? 'text-green-800' : 'text-gray-900'}`}>
                      {isFound ? item.nombre : `???`}
                    </p>
                    {item.regionNombre && (
                      <p className="text-xs text-gray-500 truncate">{item.regionNombre}</p>
                    )}
                  </div>

                  {!isFound && (
                    <span
                      className="text-xs text-gray-400 shrink-0 flex items-center gap-1"
                      aria-label={`Vale ${item.pointsValue} puntos`}
                    >
                      <span aria-hidden="true">⭐</span>
                      {item.pointsValue} pts
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Narrative fragments unlocked */}
        {unlockedNarratives.length > 0 && (
          <section aria-label="Fragmentos narrativos desbloqueados">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mx-4 mt-6 mb-1">
              Historia revelada
            </h2>
            {unlockedNarratives.map((text, idx) => (
              <NarrativeFragment key={idx} text={text} index={idx} />
            ))}
          </section>
        )}
      </main>

      {/* Celebration overlay */}
      {showCelebration && quest && (
        <CompletionCelebration rewardPoints={quest.rewardPoints} />
      )}
    </div>
  );
}

export default QuestView;
