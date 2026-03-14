import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test/test-utils';
import { AlebrijeView } from './AlebrijeView';
import * as useAlebrijeModule from '../../hooks/ar/useAlebrije';

// ============================================================================
// MOCKS
// ============================================================================

// react-sketch-canvas uses SVG + pointer events not available in jsdom.
// We replace it with a minimal div that exposes the canvas methods as a ref.
vi.mock('react-sketch-canvas', () => ({
  ReactSketchCanvas: React.forwardRef(
    (
      props: Record<string, unknown>,
      ref: React.Ref<{
        undo: () => void;
        redo: () => void;
        clearCanvas: () => void;
        exportImage: () => Promise<string>;
      }>
    ) => {
      React.useImperativeHandle(ref, () => ({
        undo: vi.fn(),
        redo: vi.fn(),
        clearCanvas: vi.fn(),
        exportImage: vi
          .fn()
          .mockResolvedValue('data:image/png;base64,MOCK_PNG'),
      }));
      return <div data-testid="sketch-canvas" aria-label="Canvas de dibujo" />;
    }
  ),
}));

// useAlebrije hook mock
const mockGenerate = vi.fn().mockResolvedValue('mock-task-id-123');
const mockCheckStatus = vi.fn().mockResolvedValue({
  success: true,
  taskId: 'mock-task-id-123',
  status: 'completed',
  modelUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
});
const mockRefresh = vi.fn();

vi.mock('../../hooks/ar/useAlebrije', () => ({
  useAlebrije: vi.fn(() => ({
    generate: mockGenerate,
    checkStatus: mockCheckStatus,
    gallery: [],
    isLoading: false,
    error: null,
    refresh: mockRefresh,
  })),
}));

// ModelViewer mock
vi.mock('./ModelViewer', () => ({
  ModelViewer: ({ alt }: { alt: string }) => (
    <div data-testid="model-viewer" aria-label={alt} />
  ),
}));

// ============================================================================
// HELPERS
// ============================================================================

const mockOnBack = vi.fn();
const mockOnNavigate = vi.fn();

function renderAlebrije(props: Partial<React.ComponentProps<typeof AlebrijeView>> = {}) {
  return render(
    <AlebrijeView
      onBack={mockOnBack}
      onNavigate={mockOnNavigate}
      userId="test-user-1"
      {...props}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// TEST SUITE
// ============================================================================

// ── 1. Basic render ────────────────────────────────────────────────────────

describe('AlebrijeView — renders', () => {
  it('renders the main view container', () => {
    renderAlebrije();
    expect(screen.getByTestId('alebrije-view')).toBeInTheDocument();
  });

  it('renders the "Crea tu Alebrije" title', () => {
    renderAlebrije();
    expect(screen.getByText('Crea tu Alebrije')).toBeInTheDocument();
  });

  it('renders the back button', () => {
    renderAlebrije();
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', () => {
    renderAlebrije();
    fireEvent.click(screen.getByRole('button', { name: /volver/i }));
    expect(mockOnBack).toHaveBeenCalledOnce();
  });
});

// ── 2. Drawing canvas ──────────────────────────────────────────────────────

describe('AlebrijeView — drawing canvas', () => {
  it('renders the drawing canvas wrapper', () => {
    renderAlebrije();
    expect(screen.getByTestId('drawing-canvas-wrapper')).toBeInTheDocument();
  });

  it('renders the sketch canvas', () => {
    renderAlebrije();
    expect(screen.getByTestId('sketch-canvas')).toBeInTheDocument();
  });
});

// ── 3. Color palette ───────────────────────────────────────────────────────

describe('AlebrijeView — color palette', () => {
  it('renders the color palette', () => {
    renderAlebrije();
    expect(screen.getByTestId('color-palette')).toBeInTheDocument();
  });

  it('shows exactly 8 color swatches', () => {
    renderAlebrije();
    // Each color button has a data-testid starting with "color-"
    const colorButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.getAttribute('data-testid')?.startsWith('color-'));
    expect(colorButtons).toHaveLength(8);
  });

  it('renders rojo color swatch', () => {
    renderAlebrije();
    expect(screen.getByTestId('color-rojo')).toBeInTheDocument();
  });

  it('renders amarillo color swatch', () => {
    renderAlebrije();
    expect(screen.getByTestId('color-amarillo')).toBeInTheDocument();
  });

  it('renders verde color swatch', () => {
    renderAlebrije();
    expect(screen.getByTestId('color-verde')).toBeInTheDocument();
  });

  it('renders azul color swatch', () => {
    renderAlebrije();
    expect(screen.getByTestId('color-azul')).toBeInTheDocument();
  });

  it('renders naranja color swatch', () => {
    renderAlebrije();
    expect(screen.getByTestId('color-naranja')).toBeInTheDocument();
  });

  it('renders rosa color swatch', () => {
    renderAlebrije();
    expect(screen.getByTestId('color-rosa')).toBeInTheDocument();
  });

  it('renders morado color swatch', () => {
    renderAlebrije();
    expect(screen.getByTestId('color-morado')).toBeInTheDocument();
  });

  it('renders turquesa color swatch', () => {
    renderAlebrije();
    expect(screen.getByTestId('color-turquesa')).toBeInTheDocument();
  });
});

// ── 4. Tool bar ────────────────────────────────────────────────────────────

describe('AlebrijeView — tool bar', () => {
  it('renders the tool bar', () => {
    renderAlebrije();
    expect(screen.getByTestId('tool-bar')).toBeInTheDocument();
  });

  it('renders the undo button', () => {
    renderAlebrije();
    expect(screen.getByTestId('btn-undo')).toBeInTheDocument();
  });

  it('renders the redo button', () => {
    renderAlebrije();
    expect(screen.getByTestId('btn-redo')).toBeInTheDocument();
  });

  it('renders the clear button', () => {
    renderAlebrije();
    expect(screen.getByTestId('btn-clear')).toBeInTheDocument();
  });

  it('renders the eraser button', () => {
    renderAlebrije();
    expect(screen.getByTestId('btn-eraser')).toBeInTheDocument();
  });
});

// ── 5. Brush sizes ─────────────────────────────────────────────────────────

describe('AlebrijeView — brush sizes', () => {
  it('renders the brush size selector', () => {
    renderAlebrije();
    expect(screen.getByTestId('brush-sizes')).toBeInTheDocument();
  });

  it('renders 3 brush size buttons', () => {
    renderAlebrije();
    expect(screen.getByTestId('brush-thin')).toBeInTheDocument();
    expect(screen.getByTestId('brush-medium')).toBeInTheDocument();
    expect(screen.getByTestId('brush-thick')).toBeInTheDocument();
  });
});

// ── 6. Submit button ───────────────────────────────────────────────────────

describe('AlebrijeView — submit', () => {
  it('renders the "Dar vida en 3D" submit button', () => {
    renderAlebrije();
    expect(screen.getByTestId('btn-submit')).toBeInTheDocument();
  });

  it('submit button contains the expected label', () => {
    renderAlebrije();
    expect(screen.getByText('Dar vida en 3D')).toBeInTheDocument();
  });

  it('clicking submit transitions to generating mode', async () => {
    renderAlebrije();
    fireEvent.click(screen.getByTestId('btn-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('generation-progress')).toBeInTheDocument();
    });
  });
});

// ── 7. Gallery mode ────────────────────────────────────────────────────────

describe('AlebrijeView — gallery mode', () => {
  it('renders the gallery toggle button', () => {
    renderAlebrije();
    expect(screen.getByTestId('gallery-toggle')).toBeInTheDocument();
  });

  it('clicking gallery toggle switches to gallery mode', () => {
    renderAlebrije();
    fireEvent.click(screen.getByTestId('gallery-toggle'));
    expect(screen.getByTestId('gallery-view')).toBeInTheDocument();
  });

  it('shows empty gallery state when no creations exist', () => {
    renderAlebrije();
    fireEvent.click(screen.getByTestId('gallery-toggle'));
    expect(screen.getByTestId('gallery-empty')).toBeInTheDocument();
  });

  it('empty gallery shows the expected message', () => {
    renderAlebrije();
    fireEvent.click(screen.getByTestId('gallery-toggle'));
    expect(
      screen.getByText('Aun no has creado ningun alebrije')
    ).toBeInTheDocument();
  });

  it('can toggle back from gallery to drawing mode', () => {
    renderAlebrije();
    fireEvent.click(screen.getByTestId('gallery-toggle')); // go to gallery
    fireEvent.click(screen.getByTestId('gallery-toggle')); // back to drawing
    expect(screen.getByTestId('drawing-canvas-wrapper')).toBeInTheDocument();
  });
});

// ── 8. Gallery with items ──────────────────────────────────────────────────

const MOCK_CREATION = {
  id: 1,
  uuid: 'uuid-1',
  nombreCreacion: 'Alebrije Jaguar',
  modelUrlGlb: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
  modelUrlUsdz: undefined,
  thumbnailUrl: undefined,
  imagenOriginalUrl: undefined,
  aiService: undefined,
  aiTaskId: undefined,
  generationTimeSeconds: undefined,
  esPublico: false,
  status: 'completed' as const,
  errorMessage: undefined,
  userId: 'test-user-1',
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
};

describe('AlebrijeView — gallery with items', () => {
  beforeEach(() => {
    vi.spyOn(useAlebrijeModule, 'useAlebrije').mockReturnValue({
      generate: mockGenerate,
      checkStatus: mockCheckStatus,
      gallery: [MOCK_CREATION],
      isLoading: false,
      error: null,
      refresh: mockRefresh,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders gallery grid when creations exist', () => {
    renderAlebrije();
    fireEvent.click(screen.getByTestId('gallery-toggle'));
    expect(screen.getByTestId('gallery-grid')).toBeInTheDocument();
  });

  it('renders creation name in gallery', () => {
    renderAlebrije();
    fireEvent.click(screen.getByTestId('gallery-toggle'));
    expect(screen.getByText('Alebrije Jaguar')).toBeInTheDocument();
  });

  it('clicking a gallery item shows the result view with ModelViewer', () => {
    renderAlebrije();
    fireEvent.click(screen.getByTestId('gallery-toggle'));
    fireEvent.click(screen.getByLabelText('Ver Alebrije Jaguar'));
    expect(screen.getByTestId('result-view')).toBeInTheDocument();
    expect(screen.getByTestId('model-viewer')).toBeInTheDocument();
  });
});
