import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, Download, Trash2, CheckCircle, XCircle, Loader2, HardDrive } from 'lucide-react';
import { getARDB, clearAllARCache, cachePoints, cacheVestimentas } from '../../services/ar-offline';
import type { ARPoint, Vestimenta } from '../../types/ar';

// ============================================================================
// TYPES
// ============================================================================

type CacheStatus = 'unknown' | 'cached' | 'not_cached' | 'loading';

interface CategoryStatus {
  points: CacheStatus;
  vestimentas: CacheStatus;
}

interface OfflineBundleManagerProps {
  onBack: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE = ((import.meta as unknown as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || 'http://localhost:3001') + '/api';

// ============================================================================
// HELPERS
// ============================================================================

/** Estimate bytes used by a given object store in the AR IndexedDB. */
async function estimateStoreCount(storeName: 'ar-points' | 'ar-vestimentas'): Promise<number> {
  try {
    const db = await getARDB();
    const count = await db.count(storeName);
    return count;
  } catch {
    return 0;
  }
}

/** Rough size estimate from navigator.storage API (bytes). */
async function estimateStorageBytes(): Promise<number | null> {
  try {
    if (!navigator.storage?.estimate) return null;
    const { usage } = await navigator.storage.estimate();
    return usage ?? null;
  } catch {
    return null;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// SUB-COMPONENT: StatusBadge
// ============================================================================

function StatusBadge({ status }: { status: CacheStatus }) {
  if (status === 'loading') {
    return (
      <span className="flex items-center gap-1 text-xs text-blue-600">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Verificando...
      </span>
    );
  }
  if (status === 'cached') {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        En cache
      </span>
    );
  }
  if (status === 'not_cached') {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <XCircle className="w-3.5 h-3.5" />
        Sin cache
      </span>
    );
  }
  return null;
}

// ============================================================================
// SUB-COMPONENT: BundleRow
// ============================================================================

interface BundleRowProps {
  label: string;
  description: string;
  status: CacheStatus;
  isDownloading: boolean;
  onDownload: () => void;
}

function BundleRow({ label, description, status, isDownloading, onDownload }: BundleRowProps) {
  return (
    <div className="flex items-center gap-3 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        <div className="mt-1.5">
          <StatusBadge status={isDownloading ? 'loading' : status} />
        </div>
      </div>
      <button
        onClick={onDownload}
        disabled={isDownloading || status === 'loading'}
        aria-label={`Descargar ${label}`}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-oaxaca-red/10 text-oaxaca-red
                   text-xs font-medium hover:bg-oaxaca-red/20 active:scale-95 transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      >
        {isDownloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Descargar
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: OfflineBundleManager
// ============================================================================

export function OfflineBundleManager({ onBack }: OfflineBundleManagerProps) {
  const [categoryStatus, setCategoryStatus] = useState<CategoryStatus>({
    points: 'unknown',
    vestimentas: 'unknown',
  });
  const [downloadingPoints, setDownloadingPoints] = useState(false);
  const [downloadingVestimentas, setDownloadingVestimentas] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [storageBytes, setStorageBytes] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // ── Check cache status ────────────────────────────────────────────────────
  const checkStatus = useCallback(async () => {
    setCategoryStatus({ points: 'loading', vestimentas: 'loading' });

    const [pointCount, vestCount, bytes] = await Promise.all([
      estimateStoreCount('ar-points'),
      estimateStoreCount('ar-vestimentas'),
      estimateStorageBytes(),
    ]);

    setCategoryStatus({
      points: pointCount > 0 ? 'cached' : 'not_cached',
      vestimentas: vestCount > 0 ? 'cached' : 'not_cached',
    });
    setStorageBytes(bytes);
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // ── Download AR points ────────────────────────────────────────────────────
  const handleDownloadPoints = useCallback(async () => {
    setDownloadingPoints(true);
    try {
      const res = await fetch(`${API_BASE}/ar/points`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const { points } = await res.json() as { points: ARPoint[] };
      await cachePoints(points);
      setCategoryStatus((prev) => ({ ...prev, points: 'cached' }));
      const bytes = await estimateStorageBytes();
      setStorageBytes(bytes);
      showToast(`${points.length} puntos AR descargados`);
    } catch {
      showToast('Error al descargar puntos AR');
    } finally {
      setDownloadingPoints(false);
    }
  }, [showToast]);

  // ── Download vestimentas ──────────────────────────────────────────────────
  const handleDownloadVestimentas = useCallback(async () => {
    setDownloadingVestimentas(true);
    try {
      const res = await fetch(`${API_BASE}/ar/vestimentas`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json() as Vestimenta[] | { vestimentas: Vestimenta[] };
      const vestimentas = Array.isArray(data) ? data : (data as { vestimentas: Vestimenta[] }).vestimentas ?? [];
      await cacheVestimentas(vestimentas);
      setCategoryStatus((prev) => ({ ...prev, vestimentas: 'cached' }));
      const bytes = await estimateStorageBytes();
      setStorageBytes(bytes);
      showToast(`${vestimentas.length} vestimentas descargadas`);
    } catch {
      showToast('Error al descargar vestimentas');
    } finally {
      setDownloadingVestimentas(false);
    }
  }, [showToast]);

  // ── Clear all cache ───────────────────────────────────────────────────────
  const handleClearCache = useCallback(async () => {
    setClearing(true);
    try {
      await clearAllARCache();
      setCategoryStatus({ points: 'not_cached', vestimentas: 'not_cached' });
      const bytes = await estimateStorageBytes();
      setStorageBytes(bytes);
      showToast('Cache eliminado correctamente');
    } catch {
      showToast('Error al limpiar cache');
    } finally {
      setClearing(false);
    }
  }, [showToast]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col h-full bg-gray-50 overflow-hidden"
      data-testid="offline-bundle-manager"
    >
      {/* Header */}
      <header className="bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-3 px-4 pt-8 pb-4 md:pt-5">
          <button
            onClick={onBack}
            aria-label="Volver"
            className="p-2 -ml-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-oaxaca-red transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900">Modo Offline</h1>
            <p className="text-xs text-gray-500">Gestiona los datos descargados</p>
          </div>
          <HardDrive className="w-5 h-5 text-gray-400" aria-hidden="true" />
        </div>
      </header>

      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto pb-8 px-4 pt-4 space-y-4">
        {/* Storage summary card */}
        <section
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          aria-label="Resumen de almacenamiento"
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-900">Datos en cache</h2>
            {storageBytes !== null && (
              <span className="text-xs font-medium text-oaxaca-red bg-oaxaca-red/10 px-2 py-0.5 rounded-full">
                ~{formatBytes(storageBytes)} usados
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Los datos cacheados permiten usar el modulo AR sin conexion a internet.
          </p>
        </section>

        {/* Downloads section */}
        <section
          className="bg-white rounded-xl shadow-sm border border-gray-100 px-4"
          aria-label="Descargas disponibles"
        >
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-4 pb-2">
            Descargas
          </h2>

          <BundleRow
            label="Puntos AR"
            description="Marcadores y contenido de puntos coleccionables"
            status={categoryStatus.points}
            isDownloading={downloadingPoints}
            onDownload={handleDownloadPoints}
          />

          <BundleRow
            label="Vestimentas"
            description="Modelos 3D de trajes tradicionales oaxaquenos"
            status={categoryStatus.vestimentas}
            isDownloading={downloadingVestimentas}
            onDownload={handleDownloadVestimentas}
          />
        </section>

        {/* Clear cache section */}
        <section
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          aria-label="Limpiar cache"
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Limpiar cache</h2>
          <p className="text-xs text-gray-500 mb-3">
            Elimina todos los datos descargados. Necesitaras conexion para volver a usarlos.
          </p>
          <button
            onClick={handleClearCache}
            disabled={clearing}
            aria-label="Limpiar todo el cache AR"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200
                       text-red-600 text-sm font-medium hover:bg-red-50 active:scale-95
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clearing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Limpiar cache
          </button>
        </section>
      </main>

      {/* Toast notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm
                     font-medium px-5 py-3 rounded-full shadow-lg z-50"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default OfflineBundleManager;
