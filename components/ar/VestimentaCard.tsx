import React from 'react';
import { Heart, Box } from 'lucide-react';
import type { VestimentaCardProps, VestimentaCategoria } from '../../types/ar';

// ============================================================================
// HELPERS
// ============================================================================

const CATEGORIA_LABELS: Record<VestimentaCategoria, string> = {
  traje_completo: 'Traje Completo',
  cabeza: 'Cabeza',
  torso: 'Torso',
  falda: 'Falda',
  accesorio: 'Accesorio',
  calzado: 'Calzado',
  mano: 'Mano',
};

const CATEGORIA_COLORS: Record<VestimentaCategoria, string> = {
  traje_completo: 'bg-red-100 text-red-800',
  cabeza: 'bg-purple-100 text-purple-800',
  torso: 'bg-blue-100 text-blue-800',
  falda: 'bg-pink-100 text-pink-800',
  accesorio: 'bg-amber-100 text-amber-800',
  calzado: 'bg-green-100 text-green-800',
  mano: 'bg-indigo-100 text-indigo-800',
};

// ============================================================================
// COMPONENT: VestimentaCard
// Product-style card for the vestimenta catalog
// ============================================================================

export function VestimentaCard({
  vestimenta,
  isFavorite = false,
  onSelect,
  onToggleFavorite,
}: VestimentaCardProps) {
  const regionColor = vestimenta.region?.colorPrimario || '#E63946';
  const showTraditionalName =
    vestimenta.nombreTradicional &&
    vestimenta.nombreTradicional !== vestimenta.nombre;

  function handleFavoriteClick(e: React.MouseEvent) {
    e.stopPropagation();
    onToggleFavorite?.(vestimenta);
  }

  function handleSelect() {
    onSelect?.(vestimenta);
  }

  return (
    <article
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden
                 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer
                 focus-within:ring-2 focus-within:ring-red-500"
      data-testid={`vestimenta-card-${vestimenta.id}`}
      aria-label={`Vestimenta: ${vestimenta.nombre}`}
    >
      {/* Thumbnail / gradient placeholder — clickable area */}
      <div
        className="relative w-full cursor-pointer"
        onClick={handleSelect}
        role="button"
        tabIndex={0}
        aria-label={`Ver detalles de ${vestimenta.nombre}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelect();
          }
        }}
      >
        {vestimenta.thumbnailUrl ? (
          <img
            src={vestimenta.thumbnailUrl}
            alt={vestimenta.nombre}
            className="w-full aspect-square object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full aspect-square flex flex-col items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${regionColor}30, ${regionColor}60)`,
            }}
            aria-hidden="true"
          >
            <span className="text-5xl">👘</span>
          </div>
        )}

        {/* Categoria badge */}
        <span
          className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold
            ${CATEGORIA_COLORS[vestimenta.categoria]}`}
          aria-label={`Categoria: ${CATEGORIA_LABELS[vestimenta.categoria]}`}
        >
          {CATEGORIA_LABELS[vestimenta.categoria]}
        </span>

        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors
            focus:outline-none focus:ring-2 focus:ring-red-500
            ${isFavorite ? 'bg-red-600 text-white' : 'bg-white/90 text-gray-400 hover:text-red-600'}`}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={isFavorite}
        >
          <Heart
            className="w-4 h-4"
            fill={isFavorite ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      {/* Info body */}
      <div className="p-3">
        {/* Region badge */}
        {vestimenta.region && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: regionColor }}
              aria-hidden="true"
            />
            <span className="text-xs text-gray-500 truncate">
              {vestimenta.region.nombre}
            </span>
          </div>
        )}

        {/* Name */}
        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
          {vestimenta.nombre}
        </h3>

        {/* Traditional name */}
        {showTraditionalName && (
          <p className="text-xs text-gray-400 italic mt-0.5 truncate">
            {vestimenta.nombreTradicional}
          </p>
        )}

        {/* "Ver en 3D" link */}
        <button
          onClick={handleSelect}
          className="mt-2 flex items-center gap-1 text-xs text-red-600 hover:text-red-700
                     hover:underline focus:outline-none focus:ring-1 focus:ring-red-500 rounded
                     underline-offset-2 transition-colors"
          aria-label={`Ver ${vestimenta.nombre} en 3D`}
        >
          <Box className="w-3.5 h-3.5" aria-hidden="true" />
          Ver en 3D
        </button>
      </div>
    </article>
  );
}

export default VestimentaCard;
