import React from 'react';
import { ChevronLeft, Trophy, Medal } from 'lucide-react';
import { ViewState } from '../../types';
import { useAchievements } from '../../hooks/ar/useAchievements';
import { useDeviceId } from '../../hooks/ar/useDeviceId';
import type { LeaderboardEntry } from '../../types/ar';

// ============================================================================
// COMPONENT: ARLeaderboard
// Top users ranked by total AR points — highlights current user's row
// ============================================================================

interface ARLeaderboardProps {
  onNavigate: (view: ViewState, data?: unknown) => void;
  onBack: () => void;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" aria-hidden="true" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" aria-hidden="true" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" aria-hidden="true" />;
  return (
    <span className="text-sm font-bold text-gray-500 w-5 text-center" aria-hidden="true">
      {rank}
    </span>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  key?: React.Key;
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  const initials = entry.displayName
    ? entry.displayName.slice(0, 2).toUpperCase()
    : '??';

  return (
    <tr
      className={`border-b last:border-0 transition-colors
        ${isCurrentUser ? 'bg-red-50 font-semibold' : 'hover:bg-gray-50'}`}
      data-testid={`leaderboard-row-${entry.ranking}`}
      aria-current={isCurrentUser ? 'true' : undefined}
    >
      {/* Rank */}
      <td className="py-3 pl-4 pr-2 w-10">
        <div className="flex items-center justify-center">
          {getRankIcon(entry.ranking)}
        </div>
      </td>

      {/* Avatar + name */}
      <td className="py-3 px-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
              ${isCurrentUser ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}
            aria-hidden="true"
          >
            {entry.avatarUrl ? (
              <img src={entry.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <span
            className={`text-sm truncate max-w-[100px] ${
              isCurrentUser ? 'text-red-700' : 'text-gray-900'
            }`}
            title={entry.displayName ?? entry.userId}
          >
            {entry.displayName ?? `Usuario ${entry.ranking}`}
            {isCurrentUser && <span className="ml-1 text-xs">(Tu)</span>}
          </span>
        </div>
      </td>

      {/* Items collected */}
      <td className="py-3 px-2 text-center">
        <span className="text-sm text-gray-700" aria-label={`${entry.itemsCollected} items`}>
          {entry.itemsCollected}
        </span>
      </td>

      {/* Total points */}
      <td className="py-3 pr-4 pl-2 text-right">
        <span
          className={`text-sm font-bold ${isCurrentUser ? 'text-red-700' : 'text-amber-600'}`}
          aria-label={`${entry.totalPoints} puntos`}
        >
          {entry.totalPoints.toLocaleString()}
        </span>
      </td>
    </tr>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

export function ARLeaderboard({ onNavigate: _onNavigate, onBack }: ARLeaderboardProps) {
  const deviceId = useDeviceId();
  const { leaderboard, isLoading, error } = useAchievements(deviceId || null);

  return (
    <div className="flex flex-col h-full bg-gray-50" data-testid="ar-leaderboard">
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
            <h1 className="text-xl font-bold text-gray-900">Tabla de lideres</h1>
            <p className="text-xs text-gray-500">Los mejores exploradores de Oaxaca</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-8">
        {isLoading ? (
          <LeaderboardSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <span className="text-5xl mb-4" role="img" aria-label="error">⚠️</span>
            <p className="text-gray-700 font-semibold">Error al cargar el ranking</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Trophy className="w-12 h-12 text-gray-300 mb-4" aria-hidden="true" />
            <p className="text-gray-700 font-semibold">Sin datos de ranking aun</p>
            <p className="text-sm text-gray-500 mt-1">
              Se el primero en explorar Oaxaca en AR!
            </p>
          </div>
        ) : (
          <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Column headers */}
            <div className="bg-gray-50 border-b border-gray-100">
              <table className="w-full table-fixed">
                <thead>
                  <tr>
                    <th className="py-2.5 pl-4 pr-2 w-10 text-left">
                      <span className="sr-only">Rango</span>
                    </th>
                    <th className="py-2.5 px-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="py-2.5 px-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="py-2.5 pr-4 pl-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Puntos
                    </th>
                  </tr>
                </thead>
              </table>
            </div>

            <table className="w-full table-fixed" aria-label="Tabla de lideres AR">
              <tbody>
                {leaderboard.map((entry) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    isCurrentUser={!!deviceId && entry.userId === deviceId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default ARLeaderboard;
