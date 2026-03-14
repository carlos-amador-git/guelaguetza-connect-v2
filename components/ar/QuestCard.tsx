import React from 'react';
import type { Quest, UserQuestProgress } from '../../types/ar';

// ============================================================================
// COMPONENT: QuestCard
// Compact card for quest listings with progress and start/continue action
// ============================================================================

interface QuestCardProps {
  key?: React.Key;
  quest: Quest;
  progress?: UserQuestProgress | null;
  onSelect?: (quest: Quest) => void;
  onStart?: (questId: number) => Promise<boolean>;
}

export function QuestCard({ quest, progress, onSelect, onStart }: QuestCardProps) {
  const itemsCollected = progress?.itemsCollected ?? 0;
  const isStarted = !!progress;
  const isCompleted = !!progress?.completedAt;
  const percentage = quest.totalItems > 0
    ? Math.round((itemsCollected / quest.totalItems) * 100)
    : 0;

  async function handleAction(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isStarted && onStart) {
      await onStart(quest.id);
    } else {
      onSelect?.(quest);
    }
  }

  return (
    <div
      className={`relative bg-white rounded-xl border shadow-sm hover:shadow-md transition-all
        cursor-pointer overflow-hidden
        ${isCompleted ? 'border-amber-400' : 'border-gray-100'}`}
      onClick={() => onSelect?.(quest)}
      data-testid={`quest-card-${quest.id}`}
      role="article"
      aria-label={`Quest: ${quest.nombre}`}
    >
      {/* Completed ribbon */}
      {isCompleted && (
        <div
          className="absolute top-0 right-0 bg-amber-400 text-amber-900
                     text-xs font-bold px-2 py-0.5 rounded-bl-lg"
          aria-label="Quest completada"
        >
          Completada
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0
                       bg-gradient-to-br from-red-50 to-amber-50 border border-red-100"
            aria-hidden="true"
          >
            {quest.iconoUrl ? (
              <img src={quest.iconoUrl} alt="" className="w-8 h-8 object-contain" />
            ) : (
              '🗺️'
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 leading-tight truncate">{quest.nombre}</h3>
            {quest.descripcion && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{quest.descripcion}</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3" aria-label={`${itemsCollected} de ${quest.totalItems} items encontrados`}>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>
              {itemsCollected} / {quest.totalItems} items
            </span>
            <span>{percentage}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden" role="progressbar"
            aria-valuenow={itemsCollected} aria-valuemin={0} aria-valuemax={quest.totalItems}>
            <div
              className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Reward + action */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
            <span aria-hidden="true">⭐</span>
            <span>{quest.rewardPoints} pts al completar</span>
          </div>

          <button
            onClick={handleAction}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
              focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500
              ${
                isCompleted
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : isStarted
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            aria-label={isCompleted ? 'Ver quest' : isStarted ? 'Continuar quest' : 'Iniciar quest'}
          >
            {isCompleted ? 'Ver' : isStarted ? 'Continuar' : 'Iniciar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuestCard;
