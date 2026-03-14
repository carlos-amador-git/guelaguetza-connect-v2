import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/test-utils';
import { VestimentaCard } from './VestimentaCard';
import { VestimentasView } from './VestimentasView';
import { VestimentaDetailView } from './VestimentaDetailView';
import { ViewState } from '../../types';
import type { Vestimenta, Region } from '../../types/ar';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockRegion: Region = {
  id: 1,
  codigo: 'valles-centrales',
  nombre: 'Valles Centrales',
  colorPrimario: '#E63946',
  ordenDisplay: 1,
  active: true,
};

const mockVestimenta: Vestimenta & { region?: Region; modelUrl?: string; modelUrlIos?: string } = {
  id: 1,
  uuid: 'test-uuid-1',
  codigo: 'VST-001',
  nombre: 'Tehuana Tradicional',
  nombreTradicional: 'Bixaa Guidxilayú',
  descripcion: 'Vestimenta tradicional del Istmo de Tehuantepec',
  datosCulturales: 'Esta vestimenta es símbolo de la identidad zapoteca.',
  regionId: 1,
  categoria: 'traje_completo',
  genero: 'femenino',
  trackingType: 'full_body',
  tieneFisicaTela: true,
  rigidez: 0.4,
  artesanoNombre: 'María López',
  artesanoComunidad: 'Juchitán de Zaragoza',
  artesanoUrl: 'https://example.com/artesano/1',
  precioAproximado: 5000,
  esSetCompleto: false,
  active: true,
  featured: true,
  region: mockRegion,
  modelUrl: undefined,
};

const mockVestimenta2: Vestimenta & { region?: Region } = {
  id: 2,
  uuid: 'test-uuid-2',
  codigo: 'VST-002',
  nombre: 'Huipil de Grana',
  regionId: 1,
  categoria: 'torso',
  genero: 'femenino',
  trackingType: 'upper_body',
  tieneFisicaTela: false,
  rigidez: 0.2,
  esSetCompleto: false,
  active: true,
  featured: false,
  region: mockRegion,
};

// ============================================================================
// MOCK HOOKS — mutable return values via module-level spies
// ============================================================================

// Default mock return values
const defaultVestimentasReturn = {
  vestimentas: [mockVestimenta, mockVestimenta2],
  count: 2,
  isLoading: false,
  error: null,
  refresh: vi.fn(),
};

const defaultFavoritesReturn = {
  favorites: [],
  favoriteIds: new Set<number>(),
  isLoading: false,
  error: null,
  toggleFavorite: vi.fn().mockResolvedValue(true),
  refresh: vi.fn(),
};

// Mutable state holders that tests can override
let vestimentasMockReturn = { ...defaultVestimentasReturn };
let favoritesMockReturn = { ...defaultFavoritesReturn };

vi.mock('../../hooks/ar/useVestimentas', () => ({
  useVestimentas: vi.fn(() => vestimentasMockReturn),
}));

vi.mock('../../hooks/ar/useFavorites', () => ({
  useFavorites: vi.fn(() => favoritesMockReturn),
}));

vi.mock('../../hooks/ar/useDeviceId', () => ({
  useDeviceId: vi.fn(() => 'test-device-id'),
}));

// ============================================================================
// TESTS: VestimentaCard
// ============================================================================

describe('VestimentaCard', () => {
  it('renders vestimenta name and region', () => {
    render(
      <VestimentaCard
        vestimenta={mockVestimenta}
        isFavorite={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    );

    expect(screen.getByText('Tehuana Tradicional')).toBeInTheDocument();
    expect(screen.getByText('Valles Centrales')).toBeInTheDocument();
  });

  it('renders traditional name when different from nombre', () => {
    render(
      <VestimentaCard
        vestimenta={mockVestimenta}
        isFavorite={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    );

    expect(screen.getByText('Bixaa Guidxilayú')).toBeInTheDocument();
  });

  it('renders categoria badge', () => {
    render(
      <VestimentaCard
        vestimenta={mockVestimenta}
        isFavorite={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    );

    expect(screen.getByText('Traje Completo')).toBeInTheDocument();
  });

  it('calls onToggleFavorite when heart button clicked', () => {
    const onToggleFavorite = vi.fn();
    render(
      <VestimentaCard
        vestimenta={mockVestimenta}
        isFavorite={false}
        onSelect={vi.fn()}
        onToggleFavorite={onToggleFavorite}
      />
    );

    const heartButton = screen.getByLabelText('Agregar a favoritos');
    fireEvent.click(heartButton);

    expect(onToggleFavorite).toHaveBeenCalledWith(mockVestimenta);
  });

  it('shows "Quitar de favoritos" label when isFavorite=true', () => {
    render(
      <VestimentaCard
        vestimenta={mockVestimenta}
        isFavorite={true}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Quitar de favoritos')).toBeInTheDocument();
  });

  it('calls onSelect when "Ver en 3D" is clicked', () => {
    const onSelect = vi.fn();
    render(
      <VestimentaCard
        vestimenta={mockVestimenta}
        isFavorite={false}
        onSelect={onSelect}
        onToggleFavorite={vi.fn()}
      />
    );

    const link = screen.getByLabelText(`Ver ${mockVestimenta.nombre} en 3D`);
    fireEvent.click(link);

    expect(onSelect).toHaveBeenCalledWith(mockVestimenta);
  });
});

// ============================================================================
// TESTS: VestimentasView
// ============================================================================

describe('VestimentasView', () => {
  const onNavigate = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vestimentasMockReturn = { ...defaultVestimentasReturn };
    favoritesMockReturn = { ...defaultFavoritesReturn };
  });

  it('renders the catalog with mock data', async () => {
    render(<VestimentasView onNavigate={onNavigate} onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByTestId('vestimentas-view')).toBeInTheDocument();
    });

    expect(screen.getByText('Tehuana Tradicional')).toBeInTheDocument();
    expect(screen.getByText('Huipil de Grana')).toBeInTheDocument();
  });

  it('shows the filter bar when filter button is clicked', async () => {
    render(<VestimentasView onNavigate={onNavigate} onBack={onBack} />);

    const filterBtn = screen.getByLabelText('Mostrar filtros');
    fireEvent.click(filterBtn);

    await waitFor(() => {
      expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Filtrar por region')).toBeInTheDocument();
    expect(screen.getByTestId('categoria-pills')).toBeInTheDocument();
  });

  it('renders results count', async () => {
    render(<VestimentasView onNavigate={onNavigate} onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByText('2 vestimentas')).toBeInTheDocument();
    });
  });

  it('calls onBack when back button is clicked', () => {
    render(<VestimentasView onNavigate={onNavigate} onBack={onBack} />);

    fireEvent.click(screen.getByLabelText('Volver'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('navigates to detail view when a vestimenta card is selected', async () => {
    render(<VestimentasView onNavigate={onNavigate} onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByText('Tehuana Tradicional')).toBeInTheDocument();
    });

    const ver3dButtons = screen.getAllByLabelText(/Ver .* en 3D/);
    fireEvent.click(ver3dButtons[0]);

    expect(onNavigate).toHaveBeenCalledWith(
      ViewState.AR_VESTIMENTA_DETAIL,
      { vestimentaId: '1' }
    );
  });
});

// ============================================================================
// TESTS: VestimentasView — empty state
// ============================================================================

describe('VestimentasView — empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vestimentasMockReturn = {
      vestimentas: [],
      count: 0,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    };
    favoritesMockReturn = { ...defaultFavoritesReturn };
  });

  afterEach(() => {
    vestimentasMockReturn = { ...defaultVestimentasReturn };
  });

  it('renders empty state when no vestimentas match filters', async () => {
    render(<VestimentasView onNavigate={vi.fn()} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    expect(screen.getByText('Sin vestimentas')).toBeInTheDocument();
  });
});

// ============================================================================
// TESTS: VestimentasView — loading state
// ============================================================================

describe('VestimentasView — loading state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vestimentasMockReturn = {
      vestimentas: [],
      count: 0,
      isLoading: true,
      error: null,
      refresh: vi.fn(),
    };
    favoritesMockReturn = { ...defaultFavoritesReturn };
  });

  afterEach(() => {
    vestimentasMockReturn = { ...defaultVestimentasReturn };
  });

  it('renders skeleton grid while loading', async () => {
    render(<VestimentasView onNavigate={vi.fn()} onBack={vi.fn()} />);

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
});

// ============================================================================
// TESTS: VestimentaDetailView
// ============================================================================

describe('VestimentaDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vestimentasMockReturn = { ...defaultVestimentasReturn };
    favoritesMockReturn = { ...defaultFavoritesReturn };

    // Mock fetch for the detail endpoint
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockVestimenta,
    } as Response);
  });

  it('renders loading state initially', () => {
    render(
      <VestimentaDetailView
        vestimentaId="1"
        onNavigate={vi.fn()}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByTestId('vestimenta-detail-loading')).toBeInTheDocument();
  });

  it('renders detail view with model viewer section after loading', async () => {
    render(
      <VestimentaDetailView
        vestimentaId="1"
        onNavigate={vi.fn()}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('vestimenta-detail-view')).toBeInTheDocument();
    });

    expect(screen.getByTestId('vestimenta-viewer-section')).toBeInTheDocument();
  });

  it('shows vestimenta name and description after loading', async () => {
    render(
      <VestimentaDetailView
        vestimentaId="1"
        onNavigate={vi.fn()}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => {
      // Name appears in header h1 and info section h2
      const nameEls = screen.getAllByText('Tehuana Tradicional');
      expect(nameEls.length).toBeGreaterThanOrEqual(1);
    });

    expect(
      screen.getByText('Vestimenta tradicional del Istmo de Tehuantepec')
    ).toBeInTheDocument();
  });

  it('shows datos culturales section', async () => {
    render(
      <VestimentaDetailView
        vestimentaId="1"
        onNavigate={vi.fn()}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('datos-culturales')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Esta vestimenta es símbolo de la identidad zapoteca.')
    ).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not found' }),
    } as Response);

    render(
      <VestimentaDetailView
        vestimentaId="999"
        onNavigate={vi.fn()}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('vestimenta-detail-error')).toBeInTheDocument();
    });

    expect(screen.getByText('No se pudo cargar la vestimenta')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const onBack = vi.fn();

    render(
      <VestimentaDetailView
        vestimentaId="1"
        onNavigate={vi.fn()}
        onBack={onBack}
      />
    );

    // Click back on loading state
    const backBtn = screen.getByLabelText('Volver');
    fireEvent.click(backBtn);

    expect(onBack).toHaveBeenCalledOnce();
  });
});
