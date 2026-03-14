import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '../../test/test-utils';
import { ARPointCard, ARPointsList, ARPointsMapPreview } from './ARPointCard';
import type { ARPoint, Region } from '../../types/ar';

// ============================================================================
// SMOKE TESTS — ARPointCard components
// ============================================================================

const mockRegion: Region = {
  id: 1,
  codigo: 'VC',
  nombre: 'Valles Centrales',
  colorPrimario: '#E63946',
  ordenDisplay: 1,
  active: true,
};

const mockPoint: ARPoint & { distanceMeters?: number; region?: Region; isWithinActivation?: boolean } = {
  id: 42,
  uuid: 'test-uuid-42',
  codigo: 'MONTE-ALBAN-01',
  nombre: 'Monte Alban',
  descripcion: 'Sitio arqueologico zapoteca en lo alto de un cerro.',
  narrativa: 'Cuenta la leyenda que...',
  tipo: 'monument',
  lat: 17.0467,
  lng: -96.7677,
  activationRadiusMeters: 50,
  trackingType: 'ground',
  isCollectible: true,
  pointsValue: 100,
  active: true,
  featured: true,
  emoji: '🏛️',
  region: mockRegion,
  distanceMeters: 120,
  isWithinActivation: false,
};

describe('ARPointCard — full variant', () => {
  it('renders the point name', () => {
    render(
      <ARPointCard point={mockPoint} isCollected={false} />
    );

    expect(screen.getByText('Monte Alban')).toBeInTheDocument();
  });

  it('renders region name', () => {
    render(
      <ARPointCard point={mockPoint} isCollected={false} />
    );

    expect(screen.getByText('Valles Centrales')).toBeInTheDocument();
  });

  it('renders distance badge', () => {
    render(
      <ARPointCard point={mockPoint} isCollected={false} />
    );

    expect(screen.getByText('120m')).toBeInTheDocument();
  });

  it('shows points badge when not collected', () => {
    render(
      <ARPointCard point={mockPoint} isCollected={false} />
    );

    expect(screen.getByText('+100 pts')).toBeInTheDocument();
  });

  it('shows "Colectado" badge when collected', () => {
    render(
      <ARPointCard point={mockPoint} isCollected={true} />
    );

    expect(screen.getByText('Colectado')).toBeInTheDocument();
    expect(screen.queryByText('+100 pts')).not.toBeInTheDocument();
  });

  it('calls onSelect when "Ver detalles" button is clicked', () => {
    const onSelect = vi.fn();
    render(
      <ARPointCard point={mockPoint} isCollected={false} onSelect={onSelect} />
    );

    fireEvent.click(screen.getByText('Ver detalles'));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 42 }));
  });

  it('does not show "Colectar" button when not within activation radius', () => {
    render(
      <ARPointCard
        point={{ ...mockPoint, isWithinActivation: false }}
        isCollected={false}
      />
    );

    expect(screen.queryByText('Colectar')).not.toBeInTheDocument();
  });

  it('shows "Colectar" button when within activation radius and not collected', () => {
    const onCollect = vi.fn();
    render(
      <ARPointCard
        point={{ ...mockPoint, isWithinActivation: true }}
        isCollected={false}
        onCollect={onCollect}
      />
    );

    const collectBtn = screen.getByText('Colectar');
    expect(collectBtn).toBeInTheDocument();

    fireEvent.click(collectBtn);
    expect(onCollect).toHaveBeenCalledOnce();
  });

  it('expands description when "Ver mas" is clicked', () => {
    const longDescription = 'A'.repeat(150);
    render(
      <ARPointCard
        point={{ ...mockPoint, descripcion: longDescription }}
        isCollected={false}
      />
    );

    const expandBtn = screen.getByText('Ver mas');
    fireEvent.click(expandBtn);

    expect(screen.getByText('Ver menos')).toBeInTheDocument();
  });
});

describe('ARPointCard — compact variant', () => {
  it('renders in compact mode', () => {
    render(
      <ARPointCard point={mockPoint} isCollected={false} compact />
    );

    expect(screen.getByText('Monte Alban')).toBeInTheDocument();
  });

  it('calls onSelect on click in compact mode', () => {
    const onSelect = vi.fn();
    render(
      <ARPointCard point={mockPoint} isCollected={false} onSelect={onSelect} compact />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('shows near label when within activation radius', () => {
    render(
      <ARPointCard
        point={{ ...mockPoint, isWithinActivation: true }}
        isCollected={false}
        compact
      />
    );

    expect(screen.getByText('Cerca')).toBeInTheDocument();
  });
});

describe('ARPointsList', () => {
  it('renders empty state when no points provided', () => {
    render(
      <ARPointsList
        points={[]}
        collectedIds={new Set()}
        emptyMessage="No hay puntos cerca"
      />
    );

    expect(screen.getByText('No hay puntos cerca')).toBeInTheDocument();
  });

  it('renders list of points', () => {
    const points = [
      mockPoint,
      { ...mockPoint, id: 43, nombre: 'Tule Tree' },
    ];

    render(
      <ARPointsList points={points} collectedIds={new Set()} />
    );

    expect(screen.getByText('Monte Alban')).toBeInTheDocument();
    expect(screen.getByText('Tule Tree')).toBeInTheDocument();
  });

  it('renders progress bar with correct counts', () => {
    const points = [mockPoint, { ...mockPoint, id: 43, nombre: 'Tule Tree' }];
    const collectedIds = new Set([42]);

    render(
      <ARPointsList
        points={points}
        collectedIds={collectedIds}
        showProgress
      />
    );

    expect(screen.getByText('1 de 2')).toBeInTheDocument();
  });

  it('hides progress bar when showProgress is false', () => {
    render(
      <ARPointsList
        points={[mockPoint]}
        collectedIds={new Set()}
        showProgress={false}
      />
    );

    expect(screen.queryByText(/de \d/)).not.toBeInTheDocument();
  });
});

describe('ARPointsMapPreview', () => {
  it('renders without crashing', () => {
    render(
      <ARPointsMapPreview
        points={[mockPoint]}
        collectedIds={new Set()}
        userPosition={{ lat: 17.0, lng: -96.7 }}
      />
    );

    expect(screen.getByText('Mapa de Oaxaca')).toBeInTheDocument();
  });

  it('calls onPointClick when a point dot is clicked', () => {
    const onPointClick = vi.fn();
    render(
      <ARPointsMapPreview
        points={[mockPoint]}
        collectedIds={new Set()}
        onPointClick={onPointClick}
      />
    );

    const pointBtn = screen.getByTitle('Monte Alban');
    fireEvent.click(pointBtn);
    expect(onPointClick).toHaveBeenCalledOnce();
  });

  it('renders user position indicator when userPosition is provided', () => {
    const { container } = render(
      <ARPointsMapPreview
        points={[]}
        collectedIds={new Set()}
        userPosition={{ lat: 17.0, lng: -96.7 }}
      />
    );

    // The blue pulsing dot for user position
    const dots = container.querySelectorAll('.animate-pulse');
    expect(dots.length).toBeGreaterThanOrEqual(1);
  });

  it('renders legend items', () => {
    render(
      <ARPointsMapPreview points={[]} collectedIds={new Set()} />
    );

    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByText('Colectado')).toBeInTheDocument();
    expect(screen.getByText('Tu ubicacion')).toBeInTheDocument();
  });
});
