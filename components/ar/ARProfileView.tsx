import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, Trophy, MapPin, Star, Award } from 'lucide-react';
import { ViewState } from '../../types';
import { useDeviceId } from '../../hooks/ar/useDeviceId';
import { AchievementCard } from './AchievementCard';
import type { Achievement, UserAchievement } from '../../types/ar';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

// ============================================================================
// TYPES
// ============================================================================

interface ARUserProfile {
  userId: string;
  totalCollected: number;
  totalAvailable: number;
  percentageComplete: number;
  totalPoints: number;
  achievementsUnlocked: number;
  ranking: number | null;
  collectionByRegion: {
    regionId: number;
    regionNombre: string;
    regionColor: string;
    collected: number;
    total: number;
  }[];
  achievements: (UserAchievement & { achievement?: Achievement })[];
  questProgress: {
    questId: number;
    questNombre: string;
    itemsCollected: number;
    totalItems: number;
    completedAt?: string;
  }[];
}

interface ARProfileViewProps {
  onNavigate: (view: ViewState, data?: unknown) => void;
  onBack: () => void;
}

// ============================================================================
// SUB-COMPONENT: Stat pill
// ============================================================================

function StatPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="text-red-600" aria-hidden="true">{icon}</div>
      <span className="text-xl font-black text-gray-900">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: ARProfileView
// ============================================================================

export function ARProfileView({ onNavigate, onBack }: ARProfileViewProps) {
  const deviceId = useDeviceId();
  const [profile, setProfile] = useState<ARUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!deviceId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/ar/user/profile?userId=${deviceId}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: ARUserProfile = await res.json();
      setProfile(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar perfil');
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-gray-50" data-testid="ar-profile-loading">
        <div className="h-16 bg-white shadow-sm animate-pulse" />
        <div className="p-4 space-y-4">
          <div className="h-28 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col h-full bg-gray-50 items-center justify-center"
        data-testid="ar-profile-error">
        <span className="text-5xl mb-4" role="img" aria-label="error">⚠️</span>
        <p className="text-gray-700 font-semibold">{error || 'No se pudo cargar el perfil'}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
        >
          Volver
        </button>
      </div>
    );
  }

  const recentAchievements = profile.achievements.slice(0, 6);

  return (
    <div className="flex flex-col h-full bg-gray-50" data-testid="ar-profile-view">
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
          <h1 className="text-xl font-bold text-gray-900">Mi Perfil AR</h1>
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto p-4 pb-8 space-y-5">
        {/* ── Avatar + rank card ─────────────────────────────────────────── */}
        <section
          className="bg-gradient-to-br from-red-600 to-amber-500 rounded-2xl p-5 text-white
                     shadow-md"
          aria-label="Perfil del usuario"
        >
          <div className="flex items-center gap-4">
            {/* Avatar placeholder */}
            <div
              className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/50
                         flex items-center justify-center text-2xl font-black"
              aria-label="Avatar"
            >
              🦚
            </div>

            <div className="flex-1">
              <p className="text-xs text-white/70 mb-0.5">Explorador de Oaxaca</p>
              <p className="font-black text-lg truncate">
                {profile.userId.slice(0, 12)}...
              </p>
              {profile.ranking !== null && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Trophy className="w-3.5 h-3.5 text-yellow-300" aria-hidden="true" />
                  <span className="text-sm font-semibold text-yellow-300">
                    Rango #{profile.ranking}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Stats grid ─────────────────────────────────────────────────── */}
        <section
          className="grid grid-cols-3 gap-3"
          aria-label="Estadisticas AR"
        >
          <StatPill
            icon={<Star className="w-5 h-5" />}
            value={profile.totalPoints.toLocaleString()}
            label="Puntos"
          />
          <StatPill
            icon={<MapPin className="w-5 h-5" />}
            value={profile.totalCollected}
            label="Items"
          />
          <StatPill
            icon={<Award className="w-5 h-5" />}
            value={profile.achievementsUnlocked}
            label="Logros"
          />
        </section>

        {/* ── Collection by region ───────────────────────────────────────── */}
        {profile.collectionByRegion.length > 0 && (
          <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
            aria-label="Coleccion por region">
            <h2 className="text-sm font-bold text-gray-700 mb-3">Progreso por region</h2>
            <div className="space-y-3">
              {profile.collectionByRegion.map((r) => (
                <div key={r.regionId}>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span className="truncate">{r.regionNombre}</span>
                    <span className="shrink-0 ml-2 text-gray-400">
                      {r.collected}/{r.total}
                    </span>
                  </div>
                  <div
                    className="h-2 bg-gray-100 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={r.collected}
                    aria-valuemin={0}
                    aria-valuemax={r.total}
                    aria-label={`${r.regionNombre}: ${r.collected} de ${r.total}`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: r.total > 0 ? `${(r.collected / r.total) * 100}%` : '0%',
                        backgroundColor: r.regionColor,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Quest progress ─────────────────────────────────────────────── */}
        {profile.questProgress.length > 0 && (
          <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
            aria-label="Progreso en misiones">
            <h2 className="text-sm font-bold text-gray-700 mb-3">Misiones</h2>
            <div className="space-y-3">
              {profile.questProgress.map((qp) => {
                const pct = qp.totalItems > 0
                  ? Math.round((qp.itemsCollected / qp.totalItems) * 100)
                  : 0;
                return (
                  <div key={qp.questId}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700 truncate">
                        {qp.questNombre}
                      </span>
                      <span className="shrink-0 ml-2 text-gray-400">
                        {qp.itemsCollected}/{qp.totalItems}
                        {qp.completedAt && (
                          <span className="ml-1 text-amber-500 font-semibold"> ✓</span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500
                          ${qp.completedAt
                            ? 'bg-amber-400'
                            : 'bg-gradient-to-r from-red-600 to-amber-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Recent achievements ────────────────────────────────────────── */}
        {recentAchievements.length > 0 && (
          <section aria-label="Logros recientes">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700">Logros recientes</h2>
              <button
                onClick={() => onNavigate(ViewState.BADGES)}
                className="text-xs text-red-600 font-semibold hover:underline
                           focus:outline-none focus:ring-1 focus:ring-red-500 rounded"
              >
                Ver todos
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {recentAchievements.map((ua) =>
                ua.achievement ? (
                  <AchievementCard
                    key={ua.achievementId}
                    achievement={ua.achievement}
                    isUnlocked
                    unlockedAt={ua.unlockedAt}
                  />
                ) : null
              )}
            </div>
          </section>
        )}

        {/* ── Leaderboard link ───────────────────────────────────────────── */}
        <button
          onClick={() => onNavigate(ViewState.LEADERBOARD)}
          className="w-full flex items-center justify-between bg-white rounded-2xl p-4
                     border border-gray-100 shadow-sm hover:shadow-md transition-all
                     focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Ver tabla de lideres"
        >
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-500" aria-hidden="true" />
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-sm">Tabla de lideres</p>
              <p className="text-xs text-gray-500">Compite con otros exploradores</p>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" aria-hidden="true" />
        </button>
      </main>
    </div>
  );
}

export default ARProfileView;
