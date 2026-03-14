import { ChevronLeft, Scroll } from 'lucide-react';
import { ViewState } from '../../types';
import { useQuests } from '../../hooks/ar/useQuests';
import { useDeviceId } from '../../hooks/ar/useDeviceId';
import { QuestCard } from './QuestCard';
import type { Quest } from '../../types/ar';

// ============================================================================
// COMPONENT: QuestListView
// Displays all available quests with start/continue actions
// ============================================================================

interface QuestListViewProps {
  onNavigate: (view: ViewState, data?: unknown) => void;
  onBack: () => void;
}

function QuestListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-36 bg-gray-100 rounded-xl animate-pulse"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function QuestListView({ onNavigate, onBack }: QuestListViewProps) {
  const deviceId = useDeviceId();
  const { quests, isLoading, error, getProgress, startQuest } = useQuests(deviceId || null);

  function handleSelectQuest(quest: Quest) {
    onNavigate(ViewState.AR_QUEST, { questId: String(quest.id), quest });
  }

  return (
    <div className="flex flex-col h-full bg-gray-50" data-testid="quest-list-view">
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
          <div>
            <h1 className="text-xl font-bold text-gray-900">Misiones AR</h1>
            <p className="text-xs text-gray-500">
              {quests.length > 0 ? `${quests.length} misiones disponibles` : 'Explora Oaxaca'}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-8">
        {isLoading ? (
          <QuestListSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4" role="img" aria-label="error">⚠️</span>
            <p className="text-gray-700 font-semibold">Error al cargar misiones</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        ) : quests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Scroll className="w-12 h-12 text-gray-300 mb-4" aria-hidden="true" />
            <p className="text-gray-700 font-semibold">Sin misiones disponibles</p>
            <p className="text-sm text-gray-500 mt-1">
              Las misiones se activaran durante el festival.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                progress={getProgress(quest.id)}
                onSelect={handleSelectQuest}
                onStart={startQuest}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default QuestListView;
