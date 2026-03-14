import { useState, useCallback } from 'react';
import { ChevronLeft, SlidersHorizontal, Heart } from 'lucide-react';
import { ViewState } from '../../types';
import type { Vestimenta, VestimentaCategoria } from '../../types/ar';
import { useVestimentas } from '../../hooks/ar/useVestimentas';
import { useFavorites } from '../../hooks/ar/useFavorites';
import { useDeviceId } from '../../hooks/ar/useDeviceId';
import { VestimentaCard } from './VestimentaCard';

// ============================================================================
// TYPES
// ============================================================================

interface VestimentasViewProps {
  onNavigate: (view: ViewState, data?: unknown) => void;
  onBack: () => void;
}

type GeneroFilter = 'todos' | 'femenino' | 'masculino';

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIAS: { value: VestimentaCategoria | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'traje_completo', label: 'Traje Completo' },
  { value: 'cabeza', label: 'Cabeza' },
  { value: 'torso', label: 'Torso' },
  { value: 'falda', label: 'Falda' },
  { value: 'accesorio', label: 'Accesorio' },
  { value: 'calzado', label: 'Calzado' },
  { value: 'mano', label: 'Mano' },
];

const GENERO_OPTIONS: { value: GeneroFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'masculino', label: 'Masculino' },
];

const OAXACA_REGIONS = [
  { codigo: '', nombre: 'Todas las regiones' },
  { codigo: 'valles-centrales', nombre: 'Valles Centrales' },
  { codigo: 'sierra-norte', nombre: 'Sierra Norte' },
  { codigo: 'sierra-sur', nombre: 'Sierra Sur' },
  { codigo: 'costa', nombre: 'Costa' },
  { codigo: 'istmo', nombre: 'Istmo' },
  { codigo: 'mixteca', nombre: 'Mixteca' },
  { codigo: 'canada', nombre: 'Cañada' },
  { codigo: 'papaloapam', nombre: 'Papaloapam' },
];

// ============================================================================
// SKELETON GRID
// ============================================================================

function VestimentaSkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: VestimentasView
// ============================================================================

export function VestimentasView({ onNavigate, onBack }: VestimentasViewProps) {
  const deviceId = useDeviceId();

  // Filter state
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<VestimentaCategoria | 'todas'>('todas');
  const [selectedGenero, setSelectedGenero] = useState<GeneroFilter>('todos');
  const [showFilters, setShowFilters] = useState(false);

  // Data hooks
  const { vestimentas, count, isLoading, error } = useVestimentas({
    region: selectedRegion || undefined,
    categoria: selectedCategoria !== 'todas' ? selectedCategoria : undefined,
    genero: selectedGenero !== 'todos' ? selectedGenero : undefined,
  });

  const { favoriteIds, toggleFavorite } = useFavorites(deviceId || null);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectVestimenta = useCallback(
    (vestimenta: Vestimenta) => {
      onNavigate(ViewState.AR_VESTIMENTA_DETAIL, { vestimentaId: String(vestimenta.id) });
    },
    [onNavigate]
  );

  const handleToggleFavorite = useCallback(
    (vestimenta: Vestimenta) => {
      toggleFavorite(vestimenta.id);
    },
    [toggleFavorite]
  );

  // ── Derived ────────────────────────────────────────────────────────────────

  const favorites = vestimentas.filter((v) => favoriteIds.has(v.id));
  const nonFavorites = vestimentas.filter((v) => !favoriteIds.has(v.id));
  const hasActiveFilters =
    selectedRegion !== '' || selectedCategoria !== 'todas' || selectedGenero !== 'todos';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden" data-testid="vestimentas-view">
      {/* Header */}
      <header className="bg-white shadow-sm z-10 shrink-0">
        <div className="flex items-center justify-between px-4 pt-8 pb-4 md:pt-5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label="Volver"
              className="p-2 -ml-1 rounded-full hover:bg-gray-100 focus:outline-none
                         focus:ring-2 focus:ring-red-500 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                Vestimentas Tradicionales
              </h1>
              <p className="text-xs text-gray-500 leading-tight">
                Las 8 regiones de Oaxaca
              </p>
            </div>
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2
              focus:ring-red-500 relative
              ${showFilters ? 'bg-red-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
            aria-label="Mostrar filtros"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {hasActiveFilters && !showFilters && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 rounded-full border border-white" />
            )}
          </button>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div
            className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3"
            data-testid="filter-bar"
          >
            {/* Region dropdown */}
            <div>
              <label
                htmlFor="region-select"
                className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block"
              >
                Region
              </label>
              <select
                id="region-select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white
                           focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700"
                aria-label="Filtrar por region"
              >
                {OAXACA_REGIONS.map((r) => (
                  <option key={r.codigo} value={r.codigo}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Genero toggle */}
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Genero
              </p>
              <div
                className="flex rounded-lg bg-gray-200/60 p-0.5"
                role="group"
                aria-label="Filtrar por genero"
              >
                {GENERO_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedGenero(opt.value)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all
                      focus:outline-none focus:ring-2 focus:ring-red-500
                      ${
                        selectedGenero === opt.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    aria-pressed={selectedGenero === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categoria pills */}
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Categoria
              </p>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filtrar por categoria"
                data-testid="categoria-pills"
              >
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategoria(cat.value as VestimentaCategoria | 'todas')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all
                      focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
                      ${
                        selectedCategoria === cat.value
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                      }`}
                    aria-pressed={selectedCategoria === cat.value}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSelectedRegion('');
                  setSelectedCategoria('todas');
                  setSelectedGenero('todos');
                }}
                className="text-xs text-red-600 hover:underline focus:outline-none"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto">
        {/* Results count */}
        {!isLoading && !error && (
          <div className="px-4 pt-4 pb-2">
            <p className="text-sm text-gray-500">
              {count === 1 ? '1 vestimenta' : `${count} vestimentas`}
              {hasActiveFilters && ' encontradas con los filtros seleccionados'}
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            Error al cargar vestimentas: {error}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div
            className="px-4 py-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            data-testid="loading-skeleton"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <VestimentaSkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && vestimentas.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
            data-testid="empty-state"
          >
            <span className="text-6xl mb-4" role="img" aria-label="vestimenta">👘</span>
            <p className="text-gray-700 font-semibold text-lg">Sin vestimentas</p>
            <p className="text-sm text-gray-500 mt-2 max-w-xs">
              {hasActiveFilters
                ? 'Ninguna vestimenta coincide con los filtros seleccionados. Intenta cambiarlos.'
                : 'No hay vestimentas disponibles en este momento.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSelectedRegion('');
                  setSelectedCategoria('todas');
                  setSelectedGenero('todos');
                }}
                className="mt-4 px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold
                           hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Favorites section */}
        {!isLoading && !error && favorites.length > 0 && (
          <section className="px-4 pt-4 pb-2" aria-label="Tus favoritas">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-red-600" fill="currentColor" aria-hidden="true" />
              <h2 className="text-sm font-bold text-gray-800">Tus Favoritas</h2>
              <span className="text-xs text-gray-400">({favorites.length})</span>
            </div>
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
              role="list"
              aria-label="Vestimentas favoritas"
            >
              {favorites.map((vestimenta) => (
                <div key={vestimenta.id} role="listitem">
                  <VestimentaCard
                    vestimenta={vestimenta}
                    isFavorite={true}
                    onSelect={handleSelectVestimenta}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main catalog grid */}
        {!isLoading && !error && nonFavorites.length > 0 && (
          <section
            className="px-4 pt-4 pb-24"
            aria-label="Catalogo de vestimentas"
          >
            {favorites.length > 0 && (
              <h2 className="text-sm font-bold text-gray-800 mb-3">Todas las vestimentas</h2>
            )}
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
              role="list"
              aria-label="Vestimentas"
              data-testid="vestimentas-grid"
            >
              {nonFavorites.map((vestimenta) => (
                <div key={vestimenta.id} role="listitem">
                  <VestimentaCard
                    vestimenta={vestimenta}
                    isFavorite={favoriteIds.has(vestimenta.id)}
                    onSelect={handleSelectVestimenta}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default VestimentasView;
