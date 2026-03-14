import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  Heart,
  ExternalLink,
  Loader2,
  Shirt,
  Info,
  AlertCircle,
} from 'lucide-react';
import { ViewState } from '../../types';
import type { Vestimenta, Region, TrackingType, VestimentaCategoria } from '../../types/ar';
import { useDeviceId } from '../../hooks/ar/useDeviceId';
import { useFavorites } from '../../hooks/ar/useFavorites';
import { VestimentaViewer } from './ModelViewer';

// ============================================================================
// TYPES
// ============================================================================

interface VestimentaDetailViewProps {
  vestimentaId: string;
  onNavigate: (view: ViewState, data?: unknown) => void;
  onBack: () => void;
}

type LoadState = 'loading' | 'loaded' | 'error';

// ============================================================================
// CONSTANTS
// ============================================================================

const TRACKING_LABELS: Record<TrackingType, string> = {
  head:       'Cabeza',
  face:       'Rostro',
  upper_body: 'Torso superior',
  full_body:  'Cuerpo completo',
  hand:       'Mano',
  ground:     'Suelo',
  vertical:   'Superficie vertical',
};

const CATEGORIA_LABELS: Record<VestimentaCategoria, string> = {
  traje_completo: 'Traje Completo',
  cabeza:         'Cabeza',
  torso:          'Torso',
  falda:          'Falda',
  accesorio:      'Accesorio',
  calzado:        'Calzado',
  mano:           'Mano',
};

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

// ============================================================================
// HELPER: rigidez label
// ============================================================================

function rigidezLabel(value: number): string {
  if (value <= 0.3) return 'Tela fluida';
  if (value <= 0.6) return 'Tela semirígida';
  return 'Tela rígida';
}

// ============================================================================
// SUB-COMPONENT: InfoRow
// ============================================================================

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-800 text-right">{value}</span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: VestimentaDetailView
// ============================================================================

export function VestimentaDetailView({
  vestimentaId,
  onNavigate,
  onBack,
}: VestimentaDetailViewProps) {
  const deviceId = useDeviceId();
  const { favoriteIds, toggleFavorite } = useFavorites(deviceId || null);

  const [vestimenta, setVestimenta] = useState<
    (Vestimenta & { region?: Region; modelUrl?: string; modelUrlIos?: string }) | null
  >(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [arActive, setArActive] = useState(false);

  // Fetch single vestimenta by ID
  useEffect(() => {
    if (!vestimentaId) return;

    const controller = new AbortController();
    setLoadState('loading');

    fetch(`${API_BASE}/ar/vestimentas/${vestimentaId}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setVestimenta(data);
        setLoadState('loaded');
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setLoadState('error');
      });

    return () => controller.abort();
  }, [vestimentaId]);

  // Favorite toggle
  const isFavorite = vestimenta ? favoriteIds.has(vestimenta.id) : false;

  const handleToggleFavorite = useCallback(() => {
    if (vestimenta) toggleFavorite(vestimenta.id);
  }, [vestimenta, toggleFavorite]);

  // AR callbacks
  const handleARStart = useCallback(() => setArActive(true), []);
  const handleAREnd = useCallback(() => setArActive(false), []);

  // Navigate to set item
  const handleSetItemSelect = useCallback(
    (itemId: number) => {
      onNavigate(ViewState.AR_VESTIMENTA_DETAIL, { vestimentaId: String(itemId) });
    },
    [onNavigate]
  );

  // ── Derived ────────────────────────────────────────────────────────────────

  const regionColor = vestimenta?.region?.colorPrimario || '#E63946';

  // ── Render: loading ─────────────────────────────────────────────────────────

  if (loadState === 'loading') {
    return (
      <div className="flex flex-col h-full bg-gray-50" data-testid="vestimenta-detail-loading">
        {/* Skeleton header */}
        <div className="bg-white shadow-sm px-4 pt-8 pb-4 md:pt-5 flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Volver"
            className="p-2 -ml-1 rounded-full hover:bg-gray-100 focus:outline-none
                       focus:ring-2 focus:ring-red-500"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
        </div>

        {/* Skeleton viewer */}
        <div className="w-full aspect-square bg-gray-200 animate-pulse" />

        {/* Skeleton body */}
        <div className="p-4 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
          <div className="h-16 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" aria-label="Cargando" />
        </div>
      </div>
    );
  }

  // ── Render: error ──────────────────────────────────────────────────────────

  if (loadState === 'error' || !vestimenta) {
    return (
      <div className="flex flex-col h-full bg-gray-50" data-testid="vestimenta-detail-error">
        <div className="bg-white shadow-sm px-4 pt-8 pb-4 md:pt-5 flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Volver"
            className="p-2 -ml-1 rounded-full hover:bg-gray-100 focus:outline-none
                       focus:ring-2 focus:ring-red-500"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Vestimenta</h1>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" aria-hidden="true" />
          <p className="text-gray-700 font-semibold">No se pudo cargar la vestimenta</p>
          <p className="text-sm text-gray-500 mt-2">
            Verifica tu conexion e intenta de nuevo.
          </p>
          <button
            onClick={onBack}
            className="mt-6 px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold
                       hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Volver al catalogo
          </button>
        </div>
      </div>
    );
  }

  // ── Render: loaded ─────────────────────────────────────────────────────────

  const showTraditionalName =
    vestimenta.nombreTradicional && vestimenta.nombreTradicional !== vestimenta.nombre;

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden" data-testid="vestimenta-detail-view">
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
            <div className="min-w-0">
              <h1
                className="text-lg font-bold text-gray-900 leading-tight truncate max-w-[220px]"
                title={vestimenta.nombre}
              >
                {vestimenta.nombre}
              </h1>
              {showTraditionalName && (
                <p className="text-xs text-gray-400 italic leading-tight truncate max-w-[220px]">
                  {vestimenta.nombreTradicional}
                </p>
              )}
            </div>
          </div>

          {/* Favorite button (large) */}
          <button
            onClick={handleToggleFavorite}
            className={`p-2.5 rounded-full transition-colors focus:outline-none focus:ring-2
              focus:ring-red-500
              ${isFavorite ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            aria-pressed={isFavorite}
          >
            <Heart
              className="w-6 h-6"
              fill={isFavorite ? 'currentColor' : 'none'}
            />
          </button>
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto pb-8">
        {/* 3D Viewer */}
        <section aria-label="Visor 3D" data-testid="vestimenta-viewer-section">
          <VestimentaViewer
            vestimenta={{
              nombre: vestimenta.nombre,
              descripcion: vestimenta.descripcion,
              modelUrl: vestimenta.modelUrl,
              modelUrlIos: vestimenta.modelUrlIos,
              thumbnailUrl: vestimenta.thumbnailUrl,
              region: vestimenta.region
                ? { nombre: vestimenta.region.nombre, colorPrimario: vestimenta.region.colorPrimario }
                : undefined,
              artesanoNombre: vestimenta.artesanoNombre,
              artesanoUrl: vestimenta.artesanoUrl,
            }}
            onARStart={handleARStart}
            onAREnd={handleAREnd}
            className="w-full"
          />
        </section>

        {/* AR active indicator */}
        {arActive && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-2 text-center">
            <p className="text-sm text-green-700 font-medium">Modo AR activo</p>
          </div>
        )}

        {/* Info section */}
        <div className="px-4 mt-4 space-y-4">
          {/* Name + description */}
          <section aria-label="Informacion general">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{vestimenta.nombre}</h2>
                {showTraditionalName && (
                  <p className="text-sm text-gray-500 italic">{vestimenta.nombreTradicional}</p>
                )}
              </div>
              {/* Categoria badge */}
              <span className="shrink-0 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                {CATEGORIA_LABELS[vestimenta.categoria]}
              </span>
            </div>

            {vestimenta.descripcion && (
              <p className="text-sm text-gray-700 leading-relaxed">{vestimenta.descripcion}</p>
            )}
          </section>

          {/* Datos culturales */}
          {vestimenta.datosCulturales && (
            <section
              className="bg-amber-50 border border-amber-200 rounded-xl p-4"
              aria-label="Datos culturales"
              data-testid="datos-culturales"
            >
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                <h3 className="text-sm font-bold text-amber-800">Datos Culturales</h3>
              </div>
              <p className="text-sm text-amber-900 italic leading-relaxed">
                {vestimenta.datosCulturales}
              </p>
            </section>
          )}

          {/* Region info */}
          {vestimenta.region && (
            <section
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
              aria-label="Region"
            >
              <h3 className="text-sm font-bold text-gray-700 mb-2">Region de Origen</h3>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: regionColor }}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {vestimenta.region.nombre}
                  </p>
                  {vestimenta.region.descripcion && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {vestimenta.region.descripcion}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Artisan info */}
          {vestimenta.artesanoNombre && (
            <section
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
              aria-label="Artesano"
            >
              <h3 className="text-sm font-bold text-gray-700 mb-2">Artesano</h3>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {vestimenta.artesanoNombre}
                  </p>
                  {vestimenta.artesanoComunidad && (
                    <p className="text-xs text-gray-500">{vestimenta.artesanoComunidad}</p>
                  )}
                  {vestimenta.precioAproximado && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Precio aproximado:{' '}
                      <span className="font-semibold text-gray-700">
                        ${vestimenta.precioAproximado.toLocaleString('es-MX')} MXN
                      </span>
                    </p>
                  )}
                </div>
                {vestimenta.artesanoUrl && (
                  <a
                    href={vestimenta.artesanoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700
                               border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-100
                               focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                    aria-label={`Ver perfil de ${vestimenta.artesanoNombre}`}
                  >
                    Ver perfil
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Physical properties */}
          <section
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
            aria-label="Propiedades tecnicas"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shirt className="w-4 h-4 text-gray-500" aria-hidden="true" />
              <h3 className="text-sm font-bold text-gray-700">Propiedades</h3>
            </div>
            <div className="space-y-0">
              <InfoRow
                label="Tipo de tracking"
                value={TRACKING_LABELS[vestimenta.trackingType] || vestimenta.trackingType}
              />
              <InfoRow
                label="Simulacion de tela"
                value={vestimenta.tieneFisicaTela ? 'Si' : 'No'}
              />
              {vestimenta.tieneFisicaTela && (
                <InfoRow
                  label="Rigidez"
                  value={`${rigidezLabel(vestimenta.rigidez)} (${vestimenta.rigidez.toFixed(2)})`}
                />
              )}
              <InfoRow
                label="Genero"
                value={
                  vestimenta.genero === 'masculino'
                    ? 'Masculino'
                    : vestimenta.genero === 'femenino'
                    ? 'Femenino'
                    : 'Unisex'
                }
              />
              {vestimenta.esSetCompleto && (
                <InfoRow label="Tipo" value="Set completo" />
              )}
            </div>
          </section>

          {/* Set items (if esSetCompleto) */}
          {vestimenta.esSetCompleto && vestimenta.setItems && vestimenta.setItems.length > 0 && (
            <section aria-label="Items del set" data-testid="set-items">
              <h3 className="text-sm font-bold text-gray-700 mb-3">
                Items del Set ({vestimenta.setItems.length})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {vestimenta.setItems.map((itemId) => (
                  <button
                    key={itemId}
                    onClick={() => handleSetItemSelect(itemId)}
                    className="flex flex-col items-center justify-center gap-1.5 p-3
                               bg-white rounded-xl border border-gray-100 shadow-sm
                               hover:shadow-md hover:border-gray-200 transition-all
                               focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Ver item ${itemId} del set`}
                  >
                    <span className="text-2xl" aria-hidden="true">👘</span>
                    <span className="text-xs text-gray-500 text-center">Pieza {itemId}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Notas tecnicas (for devs/artisans, shown subtly) */}
          {vestimenta.notasTecnicas && (
            <details className="bg-gray-50 rounded-xl border border-gray-100 p-3">
              <summary className="text-xs font-semibold text-gray-500 cursor-pointer select-none">
                Notas tecnicas
              </summary>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {vestimenta.notasTecnicas}
              </p>
            </details>
          )}
        </div>
      </main>
    </div>
  );
}

export default VestimentaDetailView;
