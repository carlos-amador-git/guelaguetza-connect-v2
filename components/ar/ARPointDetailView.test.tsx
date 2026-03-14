import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test/test-utils';
import { ARPointDetailView } from './ARPointDetailView';
import { ViewState } from '../../types';
import type { ARPoint, Region } from '../../types/ar';

// ============================================================================
// MOCKS
// ============================================================================

// fetchPointById is used by ARPointDetailView to load point data.
vi.mock('../../services/ar', () => ({
  fetchPointById: vi.fn(),
}));

// useUserCollection — default returns empty collection + no-op collectPoint.
const mockCollectPoint = vi.fn();

vi.mock('../../hooks/ar/useUserCollection', () => ({
  useUserCollection: vi.fn(() => ({
    collected: [],
    totalPoints: 0,
    count: 0,
    collectedIds: new Set<number>(),
    isLoading: false,
    error: null,
    isOffline: false,
    isStale: false,
    collectPoint: mockCollectPoint,
    refresh: vi.fn(),
  })),
}));

vi.mock('../../hooks/ar/useDeviceId', () => ({
  useDeviceId: vi.fn(() => 'test-device-id'),
}));

// ModelViewer — render a simple stub so we don't need the real web component.
vi.mock('./ModelViewer', () => ({
  ModelViewer: ({ alt }: { alt: string }) => (
    <div data-testid="model-viewer" aria-label={alt} />
  ),
  default: ({ alt }: { alt: string }) => (
    <div data-testid="model-viewer" aria-label={alt} />
  ),
}));

// CollectSuccess — lightweight stub.
vi.mock('./CollectSuccess', () => ({
  CollectSuccess: ({ pointsEarned }: { pointsEarned: number }) => (
    <div data-testid="collect-success">+{pointsEarned} pts</div>
  ),
  default: ({ pointsEarned }: { pointsEarned: number }) => (
    <div data-testid="collect-success">+{pointsEarned} pts</div>
  ),
}));

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_REGION: Region = {
  id: 1,
  codigo: 'VC',
  nombre: 'Valles Centrales',
  colorPrimario: '#E63946',
  ordenDisplay: 1,
  active: true,
};

const MOCK_POINT: ARPoint & { region?: Region; modelUrl?: string } = {
  id: 42,
  uuid: 'uuid-42',
  codigo: 'MONTE-01',
  nombre: 'Monte Albán',
  descripcion: 'Ciudad prehispánica zapoteca.',
  narrativa: 'Aquí nació la civilización zapoteca.',
  tipo: 'monument',
  lat: 17.0467,
  lng: -96.7677,
  activationRadiusMeters: 50,
  trackingType: 'ground',
  isCollectible: true,
  pointsValue: 25,
  active: true,
  featured: true,
  emoji: '🏛️',
  color: '#E63946',
  region: MOCK_REGION,
  modelUrl: 'https://example.com/model.glb',
};

const MOCK_POINT_NO_MODEL: ARPoint & { region?: Region; modelUrl?: string } = {
  ...MOCK_POINT,
  id: 43,
  uuid: 'uuid-43',
  nombre: 'Yagul',
  modelUrl: undefined,
  emoji: '🦅',
};

// ============================================================================
// HELPERS
// ============================================================================

import * as arService from '../../services/ar';
import * as useUserCollectionModule from '../../hooks/ar/useUserCollection';

function mockPointLoaded(
  point: ARPoint & { region?: Region; modelUrl?: string }
) {
  vi.mocked(arService.fetchPointById).mockResolvedValue({
    data: point as ARPoint & { region?: Region },
    status: 200,
  });
}

function mockPointError() {
  vi.mocked(arService.fetchPointById).mockResolvedValue({
    status: 500,
    error: 'Server error',
  });
}

function mockCollected(id: number, collectedAt = '2026-01-15T10:30:00Z') {
  vi.mocked(useUserCollectionModule.useUserCollection).mockReturnValue({
    collected: [{ id, collectedAt }],
    totalPoints: 25,
    count: 1,
    collectedIds: new Set([id]),
    isLoading: false,
    error: null,
    isOffline: false,
    isStale: false,
    collectPoint: mockCollectPoint,
    refresh: vi.fn(),
  });
}

function setProximity(
  pointId: number,
  isWithinActivation: boolean,
  distanceMeters = 200
) {
  sessionStorage.setItem(
    `ar_point_proximity_${pointId}`,
    JSON.stringify({ isWithinActivation, distanceMeters })
  );
}

const mockOnNavigate = vi.fn();
const mockOnBack = vi.fn();

function renderDetail(pointId = '42') {
  return render(
    <ARPointDetailView
      pointId={pointId}
      onNavigate={mockOnNavigate}
      onBack={mockOnBack}
    />
  );
}

// ============================================================================
// SETUP / TEARDOWN
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  // Reset collection hook to empty default
  vi.mocked(useUserCollectionModule.useUserCollection).mockReturnValue({
    collected: [],
    totalPoints: 0,
    count: 0,
    collectedIds: new Set<number>(),
    isLoading: false,
    error: null,
    isOffline: false,
    isStale: false,
    collectPoint: mockCollectPoint,
    refresh: vi.fn(),
  });
  mockCollectPoint.mockResolvedValue({ success: true, pointsEarned: 25 });
});

afterEach(() => {
  sessionStorage.clear();
});

// ============================================================================
// TEST SUITES
// ============================================================================

// ── 1. Renders with mock point data ────────────────────────────────────────

describe('ARPointDetailView — renders with mock point data', () => {
  it('shows the loading skeleton initially', () => {
    mockPointLoaded(MOCK_POINT);
    renderDetail();
    expect(screen.getByTestId('detail-skeleton')).toBeInTheDocument();
  });

  it('renders the point name once data loads', async () => {
    mockPointLoaded(MOCK_POINT);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByText('Monte Albán')).toBeInTheDocument()
    );
  });

  it('renders the region name', async () => {
    mockPointLoaded(MOCK_POINT);
    renderDetail();
    await waitFor(() =>
      expect(screen.getAllByText('Valles Centrales').length).toBeGreaterThanOrEqual(1)
    );
  });

  it('renders the point description', async () => {
    mockPointLoaded(MOCK_POINT);
    renderDetail();
    await waitFor(() =>
      expect(
        screen.getByText('Ciudad prehispánica zapoteca.')
      ).toBeInTheDocument()
    );
  });

  it('renders the narrativa in a styled card', async () => {
    mockPointLoaded(MOCK_POINT);
    renderDetail();
    await waitFor(() =>
      expect(
        screen.getByText('Aquí nació la civilización zapoteca.')
      ).toBeInTheDocument()
    );
  });

  it('renders the point type badge (Monumento)', async () => {
    mockPointLoaded(MOCK_POINT);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByText('Monumento')).toBeInTheDocument()
    );
  });

  it('renders the points value badge', async () => {
    mockPointLoaded(MOCK_POINT);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByText(/25 pts/i)).toBeInTheDocument()
    );
  });
});

// ── 2. Shows ModelViewer when model URL exists ─────────────────────────────

describe('ARPointDetailView — ModelViewer', () => {
  it('renders ModelViewer when the point has a model URL', async () => {
    mockPointLoaded(MOCK_POINT);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByTestId('model-viewer')).toBeInTheDocument()
    );
  });

  it('does NOT show the model placeholder when a model URL exists', async () => {
    mockPointLoaded(MOCK_POINT);
    renderDetail();
    await waitFor(() =>
      expect(screen.queryByTestId('model-placeholder')).not.toBeInTheDocument()
    );
  });
});

// ── 3. Shows placeholder when no model URL ─────────────────────────────────

describe('ARPointDetailView — Model placeholder', () => {
  it('renders the placeholder when there is no model URL', async () => {
    mockPointLoaded(MOCK_POINT_NO_MODEL);
    renderDetail('43');
    await waitFor(() =>
      expect(screen.getByTestId('model-placeholder')).toBeInTheDocument()
    );
  });

  it('does NOT render ModelViewer when there is no model URL', async () => {
    mockPointLoaded(MOCK_POINT_NO_MODEL);
    renderDetail('43');
    await waitFor(() =>
      expect(screen.queryByTestId('model-viewer')).not.toBeInTheDocument()
    );
  });

  it('shows the point emoji inside the placeholder', async () => {
    mockPointLoaded(MOCK_POINT_NO_MODEL);
    renderDetail('43');
    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'Yagul' })).toBeInTheDocument()
    );
  });
});

// ── 4. Shows "Colectar" button when within radius and not collected ─────────

describe('ARPointDetailView — Colectar button (within radius)', () => {
  it('renders the collect button when within activation radius', async () => {
    mockPointLoaded(MOCK_POINT);
    setProximity(42, true, 20);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByTestId('collect-button')).toBeInTheDocument()
    );
  });

  it('the collect button includes the points value in its label', async () => {
    mockPointLoaded(MOCK_POINT);
    setProximity(42, true, 20);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByTestId('collect-button')).toHaveAccessibleName(
        /25 puntos/i
      )
    );
  });

  it('calls collectPoint when the collect button is clicked', async () => {
    mockPointLoaded(MOCK_POINT);
    setProximity(42, true, 20);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByTestId('collect-button')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByTestId('collect-button'));
    await waitFor(() =>
      expect(mockCollectPoint).toHaveBeenCalledWith(42)
    );
  });

  it('shows CollectSuccess after a successful collection', async () => {
    mockCollectPoint.mockResolvedValue({ success: true, pointsEarned: 25 });
    mockPointLoaded(MOCK_POINT);
    setProximity(42, true, 20);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByTestId('collect-button')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByTestId('collect-button'));
    await waitFor(() =>
      expect(screen.getByTestId('collect-success')).toBeInTheDocument()
    );
  });
});

// ── 5. Shows "Colectado" when already collected ───────────────────────────

describe('ARPointDetailView — already collected', () => {
  it('renders the "Colectado" badge when already collected', async () => {
    mockPointLoaded(MOCK_POINT);
    mockCollected(42);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByTestId('collected-badge')).toBeInTheDocument()
    );
  });

  it('shows "Colectado" text in the badge', async () => {
    mockPointLoaded(MOCK_POINT);
    mockCollected(42);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByText('Colectado')).toBeInTheDocument()
    );
  });

  it('does NOT render the collect button when already collected', async () => {
    mockPointLoaded(MOCK_POINT);
    mockCollected(42);
    renderDetail();
    await waitFor(() =>
      expect(screen.queryByTestId('collect-button')).not.toBeInTheDocument()
    );
  });

  it('does NOT render the approach button when already collected', async () => {
    mockPointLoaded(MOCK_POINT);
    mockCollected(42);
    renderDetail();
    await waitFor(() =>
      expect(screen.queryByTestId('approach-button')).not.toBeInTheDocument()
    );
  });
});

// ── 6. Shows "Acércate" when not in radius ────────────────────────────────

describe('ARPointDetailView — not within radius', () => {
  it('renders the disabled "Acércate" button when outside radius', async () => {
    mockPointLoaded(MOCK_POINT);
    setProximity(42, false, 350);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByTestId('approach-button')).toBeInTheDocument()
    );
  });

  it('approach button is disabled', async () => {
    mockPointLoaded(MOCK_POINT);
    setProximity(42, false, 350);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByTestId('approach-button')).toBeDisabled()
    );
  });

  it('shows the distance in the approach button', async () => {
    mockPointLoaded(MOCK_POINT);
    setProximity(42, false, 350);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByTestId('approach-button')).toHaveTextContent(/350 m/i)
    );
  });

  it('does NOT render the collect button when outside radius', async () => {
    mockPointLoaded(MOCK_POINT);
    setProximity(42, false, 350);
    renderDetail();
    await waitFor(() =>
      expect(screen.queryByTestId('collect-button')).not.toBeInTheDocument()
    );
  });
});

// ── 7. Back button ───────────────────────────────────────────────────────

describe('ARPointDetailView — back button', () => {
  it('calls onBack when the header back button is clicked', async () => {
    mockPointLoaded(MOCK_POINT);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /volver al mapa ar/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /volver al mapa ar/i }));
    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  it('calls onBack from the error state back button', async () => {
    mockPointError();
    renderDetail('999');
    await waitFor(() =>
      expect(screen.getByText('No se pudo cargar este punto')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /volver/i }));
    expect(mockOnBack).toHaveBeenCalledOnce();
  });
});

// ── 8. Error state ───────────────────────────────────────────────────────

describe('ARPointDetailView — error state', () => {
  it('renders the error state when fetchPointById fails', async () => {
    mockPointError();
    renderDetail('999');
    await waitFor(() =>
      expect(
        screen.getByText('No se pudo cargar este punto')
      ).toBeInTheDocument()
    );
  });

  it('renders the error state for an invalid (non-numeric) pointId', async () => {
    renderDetail('not-a-number');
    await waitFor(() =>
      expect(
        screen.getByText('No se pudo cargar este punto')
      ).toBeInTheDocument()
    );
  });
});
