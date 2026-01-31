import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Medal, Crown, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { getLeaderboard, LeaderboardEntry, getMyStats, UserStats, getLevelTitle } from '../services/gamification';
import { useAuth } from '../contexts/AuthContext';

interface LeaderboardViewProps {
  onBack: () => void;
  onUserProfile?: (userId: string) => void;
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onBack, onUserProfile }) => {
  const { token, user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [leaderboard, stats] = await Promise.all([
        getLeaderboard(1, 20),
        token ? getMyStats(token) : null,
      ]);

      setEntries(leaderboard.entries);
      setHasMore(leaderboard.entries.length < leaderboard.total);
      setMyStats(stats);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const leaderboard = await getLeaderboard(nextPage, 20);
      setEntries((prev) => [...prev, ...leaderboard.entries]);
      setPage(nextPage);
      setHasMore(entries.length + leaderboard.entries.length < leaderboard.total);
    } catch (error) {
      console.error('Error loading more:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="text-oaxaca-yellow fill-oaxaca-yellow" size={24} />;
      case 2:
        return <Medal className="text-gray-400 fill-gray-400" size={22} />;
      case 3:
        return <Medal className="text-oaxaca-yellow fill-oaxaca-yellow" size={22} />;
      default:
        return <span className="text-gray-500 font-bold">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-oaxaca-yellow-light to-oaxaca-yellow-light dark:from-oaxaca-yellow/20 dark:to-oaxaca-yellow/10 border-oaxaca-yellow/30 dark:border-oaxaca-yellow/30';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 border-gray-300 dark:border-gray-600';
      case 3:
        return 'bg-gradient-to-r from-oaxaca-yellow-light to-oaxaca-yellow-light dark:from-oaxaca-yellow/20 dark:to-oaxaca-yellow/10 border-oaxaca-yellow/30 dark:border-oaxaca-yellow/30';
      default:
        return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 pb-20 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-br from-oaxaca-purple to-oaxaca-pink p-6 pt-8 pb-20">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 text-white hover:bg-white/10 rounded-full"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-white font-bold text-xl">Tabla de Líderes</h2>
        </div>

        {/* My rank card */}
        {myStats && user && (
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  {myStats.rank <= 3 ? (
                    getRankIcon(myStats.rank)
                  ) : (
                    <span className="text-white font-bold">#{myStats.rank}</span>
                  )}
                </div>
                <div>
                  <p className="text-white font-bold">Tu posición</p>
                  <p className="text-white/70 text-sm">
                    Nivel {myStats.level} • {getLevelTitle(myStats.level)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-oaxaca-yellow">
                  {myStats.xp.toLocaleString()}
                </p>
                <p className="text-white/70 text-sm">XP</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard list */}
      <div className="px-4 -mt-8 relative z-10 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-oaxaca-pink" size={32} />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Trophy size={48} className="mx-auto mb-3 opacity-50" />
            <p>No hay datos aún</p>
          </div>
        ) : (
          <>
            {entries.map((entry) => (
              <button
                key={entry.userId}
                onClick={() => onUserProfile?.(entry.userId)}
                className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all active:scale-[0.98] ${getRankStyle(
                  entry.rank
                )}`}
              >
                {/* Rank */}
                <div className="w-10 h-10 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Avatar */}
                {entry.avatar ? (
                  <img
                    src={entry.avatar}
                    alt={entry.nombre}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-oaxaca-pink flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {entry.nombre.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {entry.nombre}
                    {entry.userId === user?.id && (
                      <span className="ml-2 text-xs bg-oaxaca-pink text-white px-2 py-0.5 rounded-full">
                        Tú
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nivel {entry.level} • {getLevelTitle(entry.level)}
                  </p>
                </div>

                {/* XP */}
                <div className="text-right">
                  <p className="font-bold text-oaxaca-yellow">
                    {entry.xp.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">XP</p>
                </div>
              </button>
            ))}

            {/* Load more button */}
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full py-3 text-oaxaca-pink font-medium disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 className="animate-spin mx-auto" size={20} />
                ) : (
                  'Cargar más'
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LeaderboardView;
