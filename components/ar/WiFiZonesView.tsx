import React, { useEffect, useState } from 'react';
import { ChevronLeft, Wifi, Clock, Zap, Info } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ============================================================================
// TYPES
// ============================================================================

export interface WiFiZone {
  id: number;
  nombre: string;
  tipo: 'publico' | 'comercial' | 'cultural';
  horario: string;
  velocidadMbps: number;
  lat: number;
  lng: number;
  direccion?: string;
  active: boolean;
}

interface WiFiZonesViewProps {
  onBack: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const OAXACA_CENTER: [number, number] = [17.0608, -96.725];
const API_BASE = ((import.meta as unknown as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || 'http://localhost:3001') + '/api';

const TIPO_CONFIG: Record<WiFiZone['tipo'], { label: string; color: string; bgColor: string }> = {
  publico:   { label: 'Público',   color: '#2563eb', bgColor: '#dbeafe' },
  comercial: { label: 'Comercial', color: '#7c3aed', bgColor: '#ede9fe' },
  cultural:  { label: 'Cultural',  color: '#d97706', bgColor: '#fef3c7' },
};

// ============================================================================
// SUB-COMPONENT: WiFi zone marker color
// ============================================================================

function zoneColor(tipo: WiFiZone['tipo']): string {
  return TIPO_CONFIG[tipo]?.color ?? '#2563eb';
}

// ============================================================================
// SUB-COMPONENT: WiFiZoneCard
// ============================================================================

const WiFiZoneCard: React.FC<{ zone: WiFiZone; onDownload: (zone: WiFiZone) => void }> = ({ zone, onDownload }) => {
  const config = TIPO_CONFIG[zone.tipo];
  return (
    <article
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
      aria-label={`Zona WiFi: ${zone.nombre}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: config.bgColor }}
          >
            <Wifi className="w-5 h-5" style={{ color: config.color }} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{zone.nombre}</h3>
            {zone.direccion && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{zone.direccion}</p>
            )}
          </div>
        </div>

        <span
          className="text-xs font-medium px-2 py-1 rounded-full shrink-0"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          {config.label}
        </span>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          {zone.horario}
        </span>
        <span className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" aria-hidden="true" />
          {zone.velocidadMbps} Mbps
        </span>
      </div>

      <button
        onClick={() => onDownload(zone)}
        className="mt-3 w-full py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium
                   hover:bg-blue-100 active:scale-95 transition-all border border-blue-200"
        aria-label={`Descargar assets AR desde ${zone.nombre}`}
      >
        Descargar assets de esta zona
      </button>
    </article>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function ZoneCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-3 h-8 bg-gray-200 rounded-lg" />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: WiFiZonesView
// ============================================================================

export function WiFiZonesView({ onBack }: WiFiZonesViewProps) {
  const [zones, setZones] = useState<WiFiZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Fetch zones ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchZones = async () => {
      try {
        const res = await fetch(`${API_BASE}/ar/wifi-zones`);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json() as WiFiZone[];
        if (!cancelled) setZones(data);
      } catch {
        if (!cancelled) setError('No se pudo cargar las zonas WiFi');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchZones();
    return () => { cancelled = true; };
  }, []);

  // ── Toast helper ─────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDownload = (zone: WiFiZone) => {
    showToast('Descarga no disponible aun');
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden" data-testid="wifi-zones-view">
      {/* Header */}
      <header className="bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-3 px-4 pt-8 pb-4 md:pt-5">
          <button
            onClick={onBack}
            aria-label="Volver"
            className="p-2 -ml-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900">Zonas WiFi</h1>
            <p className="text-xs text-gray-500">Descarga assets AR cerca de ti</p>
          </div>
          <Wifi className="w-5 h-5 text-blue-600" aria-hidden="true" />
        </div>
      </header>

      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto pb-8">
        {/* Map */}
        <section className="h-56 relative" aria-label="Mapa de zonas WiFi">
          <MapContainer
            center={OAXACA_CENTER}
            zoom={14}
            className="h-full w-full"
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            {zones.map((zone) => (
              <CircleMarker
                key={zone.id}
                center={[zone.lat, zone.lng]}
                radius={16}
                pathOptions={{
                  color: zoneColor(zone.tipo),
                  fillColor: zoneColor(zone.tipo),
                  fillOpacity: 0.35,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{zone.nombre}</p>
                    <p className="text-gray-600">{zone.velocidadMbps} Mbps</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </section>

        {/* Legend */}
        <div className="flex gap-4 px-4 py-3 bg-white border-b border-gray-100">
          {(Object.entries(TIPO_CONFIG) as [WiFiZone['tipo'], typeof TIPO_CONFIG['publico']][]).map(([tipo, cfg]) => (
            <span key={tipo} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: cfg.color }}
                aria-hidden="true"
              />
              {cfg.label}
            </span>
          ))}
        </div>

        {/* Info note */}
        <div className="mx-4 mt-4 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Conectate a una de estas zonas WiFi para descargar los modelos 3D y contenido AR sin usar datos moviles.
          </p>
        </div>

        {/* Zone list */}
        <section className="px-4 mt-4 space-y-3" aria-label="Lista de zonas WiFi">
          {isLoading ? (
            <>
              <ZoneCardSkeleton />
              <ZoneCardSkeleton />
              <ZoneCardSkeleton />
            </>
          ) : error ? (
            <div className="text-center py-10">
              <Wifi className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
              <p className="text-gray-500 font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Reintentar
              </button>
            </div>
          ) : zones.length === 0 ? (
            <div className="text-center py-10">
              <Wifi className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
              <p className="text-gray-500 font-medium">No hay zonas WiFi disponibles</p>
            </div>
          ) : (
            zones.map((zone: WiFiZone) => (
              <WiFiZoneCard key={zone.id} zone={zone} onDownload={handleDownload} />
            ))
          )}
        </section>
      </main>

      {/* Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm
                     font-medium px-5 py-3 rounded-full shadow-lg z-50 animate-fade-in"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default WiFiZonesView;
