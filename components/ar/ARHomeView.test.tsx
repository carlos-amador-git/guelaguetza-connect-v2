import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test/test-utils';
import { ARHomeView } from './ARHomeView';
import { ViewState } from '../../types';
import * as useNearbyPointsModule from '../../hooks/ar/useNearbyPoints';

// ============================================================================
// MOCKS
// ============================================================================

// react-leaflet and leaflet require real browser canvas APIs not available in
// jsdom. We stub them with minimal HTML so the component renders without error.
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="leaflet-map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="leaflet-tile-layer" />,
  CircleMarker: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="leaflet-circle-marker">{children}</div>
  ),
  Marker: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="leaflet-marker">{children}</div>
  ),
  Popup: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="leaflet-popup">{children}</div>
  ),
  useMap: () => ({ flyTo: vi.fn(), setView: vi.fn() }),
}));

vi.mock('leaflet', () => ({
  default: { divIcon: vi.fn(() => ({})), icon: vi.fn(() => ({})) },
  divIcon: vi.fn(() => ({})),
}));

vi.mock('leaflet/dist/leaflet.css', () => ({}));

// ── AR Hooks ──────────────────────────────────────────────────────────────

vi.mock('../../hooks/ar/useGeolocation', () => ({
  useGeolocation: vi.fn(() => ({
    position: null,
    error: null,
    isWatching: false,
    isLoading: false,
    startWatching: vi.fn(),
    stopWatching: vi.fn(),
    getCurrentPosition: vi.fn(),
  })),
}));

vi.mock('../../hooks/ar/useNearbyPoints', () => ({
  useNearbyPoints: vi.fn(() => ({
    points: [],
    count: 0,
    error: null,
    isLoading: false,
    refresh: vi.fn(),
  })),
}));

vi.mock('../../hooks/ar/useUserCollection', () => ({
  useUserCollection: vi.fn(() => ({
    collected: [],
    totalPoints: 0,
    count: 0,
    collectedIds: new Set<number>(),
    isLoading: false,
    error: null,
    collectPoint: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock('../../hooks/ar/useDeviceId', () => ({
  useDeviceId: vi.fn(() => 'test-device-id'),
}));

// ARPermissions — exposes grant/skip buttons so tests can drive the flow.
vi.mock('./ARPermissions', () => ({
  ARPermissions: ({ onReady }: { onReady: (granted: boolean) => void }) => (
    <div data-testid="ar-permissions-overlay">
      <button data-testid="grant-location" onClick={() => onReady(true)}>
        Activar ubicacion
      </button>
      <button data-testid="skip-location" onClick={() => onReady(false)}>
        Continuar sin ubicacion
      </button>
    </div>
  ),
}));

// ============================================================================
// HELPERS
// ============================================================================

function grantLocation(container: HTMLElement) {
  const btn = container.querySelector('[data-testid="grant-location"]') as HTMLButtonElement | null;
  if (btn) fireEvent.click(btn);
}

function skipLocation(container: HTMLElement) {
  const btn = container.querySelector('[data-testid="skip-location"]') as HTMLButtonElement | null;
  if (btn) fireEvent.click(btn);
}

const mockOnNavigate = vi.fn();
const mockOnBack = vi.fn();

function renderARHome() {
  return render(
    <ARHomeView onNavigate={mockOnNavigate} onBack={mockOnBack} />
  );
}

// ============================================================================
// SHARED MOCK POINT (for nearby-points tests)
// ============================================================================

const MOCK_POINT = {
  id: 1,
  uuid: 'uuid-1',
  codigo: 'MONTE-01',
  nombre: 'Monte Alban',
  tipo: 'monument' as const,
  lat: 17.0467,
  lng: -96.7677,
  activationRadiusMeters: 50,
  trackingType: 'ground' as const,
  isCollectible: true,
  pointsValue: 100,
  active: true,
  featured: true,
  emoji: '🏛️',
  distanceMeters: 200,
  isWithinActivation: false,
  region: {
    id: 1,
    codigo: 'VC',
    nombre: 'Valles Centrales',
    colorPrimario: '#E63946',
    ordenDisplay: 1,
    active: true,
  },
};

// ============================================================================
// TESTS
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
});

// ── 1. Renders without crashing ────────────────────────────────────────────

describe('ARHomeView — renders without crashing', () => {
  it('renders the permissions overlay initially', () => {
    const { container } = renderARHome();
    expect(container.querySelector('[data-testid="ar-permissions-overlay"]')).toBeInTheDocument();
  });

  it('renders the main view after permission is granted', () => {
    const { container } = renderARHome();
    grantLocation(container);
    expect(screen.getByTestId('ar-home-view')).toBeInTheDocument();
  });

  it('renders the main view after skipping permission', () => {
    const { container } = renderARHome();
    skipLocation(container);
    expect(screen.getByTestId('ar-home-view')).toBeInTheDocument();
  });
});

// ── 2. Map container ───────────────────────────────────────────────────────

describe('ARHomeView — map', () => {
  it('shows the map section after permission is granted', () => {
    const { container } = renderARHome();
    grantLocation(container);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('shows the Leaflet MapContainer component', () => {
    const { container } = renderARHome();
    grantLocation(container);
    expect(screen.getByTestId('leaflet-map-container')).toBeInTheDocument();
  });
});

// ── 3. Header elements ─────────────────────────────────────────────────────

describe('ARHomeView — header', () => {
  it('renders the "Guelaguetza AR" title', () => {
    const { container } = renderARHome();
    grantLocation(container);
    expect(screen.getByText('Guelaguetza AR')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    const { container } = renderARHome();
    grantLocation(container);
    expect(screen.getByText('Explora las 8 regiones de Oaxaca')).toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', () => {
    const { container } = renderARHome();
    grantLocation(container);
    fireEvent.click(screen.getByRole('button', { name: /volver/i }));
    expect(mockOnBack).toHaveBeenCalledOnce();
  });
});

// ── 4. Tabs ────────────────────────────────────────────────────────────────

describe('ARHomeView — tabs', () => {
  it('renders both Explorar and Mi Coleccion tabs', () => {
    const { container } = renderARHome();
    grantLocation(container);
    expect(screen.getByRole('tab', { name: /explorar/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /coleccion/i })).toBeInTheDocument();
  });

  it('"Explorar" tab is selected by default', () => {
    const { container } = renderARHome();
    grantLocation(container);
    expect(screen.getByRole('tab', { name: /explorar/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('switching to "Mi Coleccion" tab shows empty collection state', async () => {
    const { container } = renderARHome();
    grantLocation(container);
    fireEvent.click(screen.getByRole('tab', { name: /coleccion/i }));
    await waitFor(() => {
      expect(screen.getByTestId('coleccion-empty')).toBeInTheDocument();
    });
  });

  it('empty collection displays correct copy', async () => {
    const { container } = renderARHome();
    grantLocation(container);
    fireEvent.click(screen.getByRole('tab', { name: /coleccion/i }));
    await waitFor(() => {
      expect(screen.getByText('Tu coleccion esta vacia')).toBeInTheDocument();
    });
  });
});

// ── 5. Quick action cards ──────────────────────────────────────────────────

describe('ARHomeView — quick action cards', () => {
  it('renders "Probador Virtual" card', () => {
    const { container } = renderARHome();
    grantLocation(container);
    expect(screen.getByText('Probador Virtual')).toBeInTheDocument();
  });

  it('renders "Crea tu Alebrije" card', () => {
    const { container } = renderARHome();
    grantLocation(container);
    expect(screen.getByText('Crea tu Alebrije')).toBeInTheDocument();
  });

  it('clicking "Probador Virtual" navigates to AR_VESTIMENTAS', () => {
    const { container } = renderARHome();
    grantLocation(container);
    fireEvent.click(screen.getByText('Probador Virtual'));
    expect(mockOnNavigate).toHaveBeenCalledWith(ViewState.AR_VESTIMENTAS);
  });

  it('clicking "Crea tu Alebrije" navigates to AR_ALEBRIJE', () => {
    const { container } = renderARHome();
    grantLocation(container);
    fireEvent.click(screen.getByText('Crea tu Alebrije'));
    expect(mockOnNavigate).toHaveBeenCalledWith(ViewState.AR_ALEBRIJE);
  });
});

// ── 6. Quest banner ────────────────────────────────────────────────────────

describe('ARHomeView — quest banner', () => {
  it('renders the quest banner', () => {
    const { container } = renderARHome();
    grantLocation(container);
    expect(screen.getByTestId('quest-banner')).toBeInTheDocument();
  });

  it('renders the quest name "La Busqueda de Donaji"', () => {
    const { container } = renderARHome();
    grantLocation(container);
    expect(screen.getByText('La Busqueda de Donaji')).toBeInTheDocument();
  });

  it('clicking "Ver quest" navigates to AR_QUEST', () => {
    const { container } = renderARHome();
    grantLocation(container);
    fireEvent.click(screen.getByText('Ver quest'));
    expect(mockOnNavigate).toHaveBeenCalledWith(ViewState.AR_QUEST);
  });
});

// ── 7. Explorar tab empty state ────────────────────────────────────────────

describe('ARHomeView — Explorar tab empty state', () => {
  it('shows the "Sin puntos AR cerca" message when there are no nearby points', () => {
    const { container } = renderARHome();
    grantLocation(container);
    // Default hook mock returns [] so empty state renders immediately.
    expect(screen.getByText('Sin puntos AR cerca')).toBeInTheDocument();
  });
});

// ── 8. Bottom nav hint ─────────────────────────────────────────────────────

describe('ARHomeView — bottom scanner hint', () => {
  it('renders the "Escaner AR" link', () => {
    const { container } = renderARHome();
    grantLocation(container);
    expect(screen.getByText('Escaner AR')).toBeInTheDocument();
  });

  it('clicking "Escaner AR" navigates to AR_SCANNER', () => {
    const { container } = renderARHome();
    grantLocation(container);
    fireEvent.click(screen.getByText('Escaner AR'));
    expect(mockOnNavigate).toHaveBeenCalledWith(ViewState.AR_SCANNER);
  });
});

// ── 9. No-location mode ────────────────────────────────────────────────────

describe('ARHomeView — no location mode', () => {
  it('shows the "Explora sin ubicacion" hint when location was skipped', () => {
    const { container } = renderARHome();
    skipLocation(container);
    expect(screen.getByText(/Explora sin ubicacion/i)).toBeInTheDocument();
  });
});

// ── 10. Nearby points — with data ─────────────────────────────────────────

describe('ARHomeView — nearby points rendered', () => {
  beforeEach(() => {
    vi.spyOn(useNearbyPointsModule, 'useNearbyPoints').mockReturnValue({
      points: [MOCK_POINT],
      count: 1,
      error: null,
      isLoading: false,
      refresh: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a nearby point card in the Explorar tab', async () => {
    const { container } = renderARHome();
    grantLocation(container);
    await waitFor(() => {
      // Point name appears in both the list card and the map popup; either is fine.
      expect(screen.getAllByText('Monte Alban').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('clicking a nearby point navigates to AR_POINT_DETAIL', async () => {
    const { container } = renderARHome();
    grantLocation(container);
    await waitFor(() => {
      expect(screen.getAllByText('Monte Alban').length).toBeGreaterThanOrEqual(1);
    });
    // The list card button has aria-label that includes the point name.
    // We query by aria-label directly.
    const pointBtn = container.querySelector(
      '[aria-label*="Monte Alban"]'
    ) as HTMLButtonElement;
    expect(pointBtn).not.toBeNull();
    fireEvent.click(pointBtn);
    expect(mockOnNavigate).toHaveBeenCalledWith(
      ViewState.AR_POINT_DETAIL,
      expect.objectContaining({ pointId: 1 })
    );
  });
});
