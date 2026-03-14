import { useState } from 'react';
import type { ARPoint, Region } from '../../types/ar';

// ============================================================================
// COMPONENT: ARPointCard
// Card for displaying a single AR collectible point
// ============================================================================

interface ARPointCardProps {
  point: ARPoint & {
    distanceMeters?: number;
    region?: Region;
    isWithinActivation?: boolean;
  };
  isCollected: boolean;
  onSelect?: (point: ARPoint) => void;
  onCollect?: (point: ARPoint) => void;
  compact?: boolean;
}

export function ARPointCard({
  point,
  isCollected,
  onSelect,
  onCollect,
  compact = false,
}: ARPointCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDistance = (meters?: number) => {
    if (!meters) return null;
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const regionColor = point.region?.colorPrimario || point.color || '#E63946';

  // Compact variant — single row
  if (compact) {
    return (
      <button
        onClick={() => onSelect?.(point)}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all w-full text-left
          ${
            isCollected
              ? 'bg-green-50 border-2 border-green-500'
              : point.isWithinActivation
              ? 'bg-yellow-50 border-2 border-yellow-500'
              : 'bg-white border border-gray-200 hover:border-gray-300'
          }`}
      >
        {/* Emoji / icon */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: `${regionColor}20` }}
        >
          {isCollected ? '\u2713' : point.emoji || '\uD83D\uDCCD'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{point.nombre}</h4>
          <p className="text-sm text-gray-500 truncate">
            {point.region?.nombre || point.tipo}
          </p>
        </div>

        {/* Distance */}
        {point.distanceMeters !== undefined && (
          <div className="text-right shrink-0">
            <span
              className={`text-sm font-medium ${
                point.isWithinActivation ? 'text-yellow-600' : 'text-gray-500'
              }`}
            >
              {formatDistance(point.distanceMeters)}
            </span>
            {point.isWithinActivation && !isCollected && (
              <p className="text-xs text-yellow-600 font-medium">Cerca</p>
            )}
          </div>
        )}
      </button>
    );
  }

  // Full / expanded card variant
  return (
    <div
      className={`rounded-xl overflow-hidden transition-all
        ${
          isCollected
            ? 'bg-green-50 border-2 border-green-500'
            : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
        }`}
    >
      {/* Header with color */}
      <div
        className="h-24 relative flex items-center justify-center"
        style={{ backgroundColor: regionColor }}
      >
        <span className="text-5xl filter drop-shadow-lg">
          {isCollected ? '\u2713' : point.emoji || '\uD83D\uDCCD'}
        </span>

        {/* Type badge */}
        <span className="absolute top-2 left-2 px-2 py-1 bg-white/90 rounded-full text-xs font-medium capitalize">
          {point.tipo.replace('_', ' ')}
        </span>

        {/* Points badge */}
        {point.isCollectible && !isCollected && (
          <span className="absolute top-2 right-2 px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
            +{point.pointsValue} pts
          </span>
        )}

        {/* Collected badge */}
        {isCollected && (
          <span className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
            Colectado
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-lg text-gray-900">{point.nombre}</h3>
          {point.distanceMeters !== undefined && (
            <span
              className={`shrink-0 px-2 py-1 rounded-lg text-sm font-medium ${
                point.isWithinActivation
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {formatDistance(point.distanceMeters)}
            </span>
          )}
        </div>

        {point.region && (
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: regionColor }}
            />
            <span className="text-sm text-gray-600">{point.region.nombre}</span>
          </div>
        )}

        {point.descripcion && (
          <p className={`text-sm text-gray-600 mb-3 ${isExpanded ? '' : 'line-clamp-2'}`}>
            {point.descripcion}
          </p>
        )}

        {point.descripcion && point.descripcion.length > 100 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-red-600 hover:underline mb-3"
          >
            {isExpanded ? 'Ver menos' : 'Ver mas'}
          </button>
        )}

        {/* Narrative (when expanded) */}
        {isExpanded && point.narrativa && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-700 italic">{point.narrativa}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onSelect?.(point)}
            className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Ver detalles
          </button>

          {point.isCollectible && !isCollected && point.isWithinActivation && (
            <button
              onClick={() => onCollect?.(point)}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Colectar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: ARPointsList
// Renders a list of AR points with optional progress bar
// ============================================================================

interface ARPointsListProps {
  points: (ARPoint & {
    distanceMeters?: number;
    region?: Region;
    isWithinActivation?: boolean;
  })[];
  collectedIds: Set<number>;
  onSelect?: (point: ARPoint) => void;
  onCollect?: (point: ARPoint) => void;
  emptyMessage?: string;
  showProgress?: boolean;
  compact?: boolean;
}

export function ARPointsList({
  points,
  collectedIds,
  onSelect,
  onCollect,
  emptyMessage = 'No hay puntos disponibles',
  showProgress = true,
  compact = false,
}: ARPointsListProps) {
  const collectiblePoints = points.filter((p) => p.isCollectible);
  const collectedCount = collectiblePoints.filter((p) => collectedIds.has(p.id)).length;

  if (points.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-5xl mb-4">🗺️</div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {showProgress && collectiblePoints.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Tu progreso</span>
            <span className="text-sm text-gray-500">
              {collectedCount} de {collectiblePoints.length}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-500"
              style={{
                width: `${(collectedCount / collectiblePoints.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Points list */}
      <div className={compact ? 'space-y-2' : 'grid gap-4 sm:grid-cols-2'}>
        {points.map((point) => (
          <ARPointCard
            key={point.id}
            point={point}
            isCollected={collectedIds.has(point.id)}
            onSelect={onSelect}
            onCollect={onCollect}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: ARPointsMapPreview
// Visual placeholder map showing AR point locations
// ============================================================================

interface ARPointsMapPreviewProps {
  points: (ARPoint & { region?: Region })[];
  collectedIds: Set<number>;
  userPosition?: { lat: number; lng: number };
  onPointClick?: (point: ARPoint) => void;
}

export function ARPointsMapPreview({
  points,
  collectedIds,
  userPosition,
  onPointClick,
}: ARPointsMapPreviewProps) {
  return (
    <div className="relative bg-gradient-to-br from-green-100 to-blue-100 rounded-xl overflow-hidden aspect-video">
      {/* Map placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Mapa de Oaxaca</p>
      </div>

      {/* Points as dots */}
      {points.map((point, index) => {
        const isCollected = collectedIds.has(point.id);
        const top = 20 + ((index * 15) % 60);
        const left = 10 + ((index * 20) % 80);

        return (
          <button
            key={point.id}
            onClick={() => onPointClick?.(point)}
            className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-sm transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 ${
              isCollected ? 'bg-green-500' : 'bg-red-600'
            }`}
            style={{
              top: `${top}%`,
              left: `${left}%`,
              backgroundColor: isCollected ? '#22c55e' : point.region?.colorPrimario,
            }}
            title={point.nombre}
          >
            {isCollected ? '\u2713' : point.emoji?.[0] || '\uD83D\uDCCD'}
          </button>
        );
      })}

      {/* User position dot */}
      {userPosition && (
        <div
          className="absolute w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-600" />
          Disponible
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          Colectado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          Tu ubicacion
        </span>
      </div>
    </div>
  );
}

export default ARPointCard;
