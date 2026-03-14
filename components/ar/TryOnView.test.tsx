/**
 * components/ar/TryOnView.test.tsx
 *
 * Unit tests for TryOnView — Sprint 3.3
 *
 * Mocks:
 *  - navigator.mediaDevices.getUserMedia (camera)
 *  - useTryOn hook (MediaPipe, face detection loop)
 *  - useVestimentas hook (catalog data)
 *  - mediapipe-loader (CDN — never actually loaded)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/test-utils';
import { TryOnView } from './TryOnView';
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

const mockVestimenta1: Vestimenta & { region?: Region } = {
  id: 1,
  uuid: 'v-uuid-1',
  codigo: 'VST-001',
  nombre: 'Tehuana Tradicional',
  regionId: 1,
  categoria: 'cabeza',
  genero: 'femenino',
  trackingType: 'head',
  tieneFisicaTela: false,
  rigidez: 0.2,
  esSetCompleto: false,
  active: true,
  featured: true,
  thumbnailUrl: '/images/tehuana-thumb.jpg',
  region: mockRegion,
};

const mockVestimenta2: Vestimenta & { region?: Region } = {
  id: 2,
  uuid: 'v-uuid-2',
  codigo: 'VST-002',
  nombre: 'Huipil de Grana',
  regionId: 1,
  categoria: 'torso',
  genero: 'femenino',
  trackingType: 'upper_body',
  tieneFisicaTela: false,
  rigidez: 0.3,
  esSetCompleto: false,
  active: true,
  featured: false,
  region: mockRegion,
};

// ============================================================================
// MOCK: mediapipe-loader — never load the real CDN
// ============================================================================

vi.mock('../../utils/mediapipe-loader', () => ({
  loadMediaPipeVision: vi.fn().mockResolvedValue({
    FaceLandmarker: {},
    FilesetResolver: {},
  }),
  loadFaceLandmarker: vi.fn().mockResolvedValue({
    detectForVideo: vi.fn().mockReturnValue({ faceLandmarks: [] }),
    close: vi.fn(),
  }),
  disposeFaceLandmarker: vi.fn(),
}));

// ============================================================================
// MOCK: useTryOn hook state — mutable per test
// ============================================================================

const defaultTryOnReturn = {
  videoRef: { current: null as HTMLVideoElement | null },
  canvasRef: { current: null as HTMLCanvasElement | null },
  isLoading: false,
  isTracking: false,
  error: null as string | null,
  faceLandmarks: null,
  startCamera: vi.fn().mockResolvedValue(undefined),
  stopCamera: vi.fn(),
  capturePhoto: vi.fn().mockResolvedValue(null),
  flipCamera: vi.fn().mockResolvedValue(undefined),
  isLowEnd: false,
  facingMode: 'user' as const,
};

let tryOnMockReturn = { ...defaultTryOnReturn };

vi.mock('../../hooks/ar/useTryOn', () => ({
  useTryOn: vi.fn(() => tryOnMockReturn),
}));

// ============================================================================
// MOCK: useVestimentas hook
// ============================================================================

const defaultVestimentasReturn = {
  vestimentas: [mockVestimenta1, mockVestimenta2],
  count: 2,
  isLoading: false,
  error: null,
  refresh: vi.fn(),
};

let vestimentasMockReturn = { ...defaultVestimentasReturn };

vi.mock('../../hooks/ar/useVestimentas', () => ({
  useVestimentas: vi.fn(() => vestimentasMockReturn),
}));

// ============================================================================
// MOCK: getUserMedia
// ============================================================================

const mockGetUserMedia = vi.fn().mockResolvedValue({
  getTracks: () => [{ stop: vi.fn() }],
});

Object.defineProperty(navigator, 'mediaDevices', {
  value: { getUserMedia: mockGetUserMedia },
  writable: true,
});

// ============================================================================
// HELPERS
// ============================================================================

const defaultProps = {
  onBack: vi.fn(),
  onNavigate: vi.fn(),
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe('TryOnView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tryOnMockReturn = { ...defaultTryOnReturn };
    vestimentasMockReturn = { ...defaultVestimentasReturn };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // Test 1: Renders loading state
  // --------------------------------------------------------------------------

  it('renders loading state when isLoading=true', () => {
    tryOnMockReturn = { ...defaultTryOnReturn, isLoading: true };

    render(<TryOnView {...defaultProps} />);

    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
    expect(screen.getByText('Cargando detector facial...')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Test 2: Camera video element is rendered (camera permission request implied)
  // --------------------------------------------------------------------------

  it('renders camera video element for camera permission request', () => {
    render(<TryOnView {...defaultProps} />);

    const video = screen.getByTestId('camera-video');
    expect(video).toBeInTheDocument();
    expect(video.tagName).toBe('VIDEO');
  });

  // --------------------------------------------------------------------------
  // Test 3: Low-end fallback message
  // --------------------------------------------------------------------------

  it('shows low-end device fallback message when isLowEnd=true', () => {
    tryOnMockReturn = { ...defaultTryOnReturn, isLowEnd: true };

    render(<TryOnView {...defaultProps} />);

    expect(screen.getByTestId('lowend-notice')).toBeInTheDocument();
    expect(
      screen.getByText(/Tu dispositivo no soporta tracking facial/i),
    ).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Test 4: Low-end fallback does NOT show the no-face message
  // --------------------------------------------------------------------------

  it('does not show "no face detected" on low-end devices', () => {
    tryOnMockReturn = { ...defaultTryOnReturn, isLowEnd: true, isTracking: false };

    render(<TryOnView {...defaultProps} />);

    expect(screen.queryByText('No se detecta rostro')).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Test 5: Shows "no face detected" hint on capable devices without tracking
  // --------------------------------------------------------------------------

  it('shows "no se detecta rostro" when not tracking on capable device', () => {
    tryOnMockReturn = { ...defaultTryOnReturn, isLowEnd: false, isTracking: false };

    render(<TryOnView {...defaultProps} />);

    expect(screen.getByText('No se detecta rostro')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Test 6: Vestimenta carousel renders with all items
  // --------------------------------------------------------------------------

  it('renders vestimenta carousel with all vestimentas', () => {
    render(<TryOnView {...defaultProps} />);

    const carousel = screen.getByTestId('vestimenta-carousel');
    expect(carousel).toBeInTheDocument();

    // Both vestimenta names should appear as aria-labels on carousel items
    expect(screen.getByLabelText('Seleccionar Tehuana Tradicional')).toBeInTheDocument();
    expect(screen.getByLabelText('Seleccionar Huipil de Grana')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Test 7: Capture button exists
  // --------------------------------------------------------------------------

  it('renders the capture photo button', () => {
    render(<TryOnView {...defaultProps} />);

    const captureBtn = screen.getByTestId('capture-button');
    expect(captureBtn).toBeInTheDocument();
    expect(captureBtn).toHaveAttribute('aria-label', 'Tomar foto');
  });

  // --------------------------------------------------------------------------
  // Test 8: Back button calls onBack
  // --------------------------------------------------------------------------

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();

    render(<TryOnView {...defaultProps} onBack={onBack} />);

    const backBtn = screen.getByTestId('back-button');
    fireEvent.click(backBtn);

    expect(onBack).toHaveBeenCalledOnce();
  });

  // --------------------------------------------------------------------------
  // Test 9: Flip camera button exists
  // --------------------------------------------------------------------------

  it('renders the flip camera button', () => {
    render(<TryOnView {...defaultProps} />);

    const flipBtn = screen.getByTestId('flip-camera-button');
    expect(flipBtn).toBeInTheDocument();
    expect(flipBtn).toHaveAttribute('aria-label', 'Voltear camara');
  });

  // --------------------------------------------------------------------------
  // Test 10: Flip camera button calls flipCamera
  // --------------------------------------------------------------------------

  it('calls flipCamera when flip button is clicked', async () => {
    const flipCamera = vi.fn().mockResolvedValue(undefined);
    tryOnMockReturn = { ...defaultTryOnReturn, flipCamera };

    render(<TryOnView {...defaultProps} />);

    fireEvent.click(screen.getByTestId('flip-camera-button'));

    await waitFor(() => {
      expect(flipCamera).toHaveBeenCalledOnce();
    });
  });

  // --------------------------------------------------------------------------
  // Test 11: Settings button toggles settings panel
  // --------------------------------------------------------------------------

  it('toggles settings panel when settings button is clicked', () => {
    render(<TryOnView {...defaultProps} />);

    expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('settings-button'));

    expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Test 12: Capture button is disabled when loading
  // --------------------------------------------------------------------------

  it('disables capture button while loading', () => {
    tryOnMockReturn = { ...defaultTryOnReturn, isLoading: true };

    render(<TryOnView {...defaultProps} />);

    const captureBtn = screen.getByTestId('capture-button');
    expect(captureBtn).toBeDisabled();
  });

  // --------------------------------------------------------------------------
  // Test 13: Error overlay shown when error is present
  // --------------------------------------------------------------------------

  it('shows error overlay when camera access fails', () => {
    tryOnMockReturn = {
      ...defaultTryOnReturn,
      error: 'Permiso de camara denegado.',
      isLoading: false,
    };

    render(<TryOnView {...defaultProps} />);

    expect(screen.getByTestId('error-overlay')).toBeInTheDocument();
    expect(screen.getByText(/Permiso de camara denegado/i)).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Test 14: Photo preview shown after capture
  // --------------------------------------------------------------------------

  it('shows photo preview after successful capture', async () => {
    const fakeBlob = new Blob(['fake-image'], { type: 'image/jpeg' });
    const capturePhoto = vi.fn().mockResolvedValue(fakeBlob);
    tryOnMockReturn = { ...defaultTryOnReturn, capturePhoto };

    // Mock URL.createObjectURL
    const mockUrl = 'blob:http://localhost/fake';
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => mockUrl),
      revokeObjectURL: vi.fn(),
    });

    render(<TryOnView {...defaultProps} />);

    fireEvent.click(screen.getByTestId('capture-button'));

    await waitFor(() => {
      expect(screen.getByTestId('photo-preview')).toBeInTheDocument();
    });

    // Photo preview should have share and download buttons
    expect(screen.getByTestId('share-button')).toBeInTheDocument();
    expect(screen.getByTestId('download-button')).toBeInTheDocument();
    expect(screen.getByTestId('retake-button')).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  // --------------------------------------------------------------------------
  // Test 15: Retake button returns to camera view
  // --------------------------------------------------------------------------

  it('returns to camera view when retake button is clicked', async () => {
    const fakeBlob = new Blob(['fake-image'], { type: 'image/jpeg' });
    const capturePhoto = vi.fn().mockResolvedValue(fakeBlob);
    tryOnMockReturn = { ...defaultTryOnReturn, capturePhoto };

    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:http://localhost/fake'),
      revokeObjectURL: vi.fn(),
    });

    render(<TryOnView {...defaultProps} />);

    // Capture photo
    fireEvent.click(screen.getByTestId('capture-button'));

    await waitFor(() => {
      expect(screen.getByTestId('photo-preview')).toBeInTheDocument();
    });

    // Click retake
    fireEvent.click(screen.getByTestId('retake-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('photo-preview')).not.toBeInTheDocument();
      expect(screen.getByTestId('capture-button')).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  // --------------------------------------------------------------------------
  // Test 16: Overlay canvas is rendered
  // --------------------------------------------------------------------------

  it('renders overlay canvas element', () => {
    render(<TryOnView {...defaultProps} />);

    expect(screen.getByTestId('overlay-canvas')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Test 17: Selecting a vestimenta in carousel marks it as selected
  // --------------------------------------------------------------------------

  it('marks selected vestimenta as pressed in carousel', async () => {
    render(<TryOnView vestimentaId="1" {...defaultProps} />);

    await waitFor(() => {
      const selectedBtn = screen.getByLabelText('Seleccionar Tehuana Tradicional');
      expect(selectedBtn).toHaveAttribute('aria-pressed', 'true');
    });
  });

  // --------------------------------------------------------------------------
  // Test 18: Clicking a carousel item changes the selection
  // --------------------------------------------------------------------------

  it('changes vestimenta selection when carousel item is clicked', async () => {
    render(<TryOnView vestimentaId="1" {...defaultProps} />);

    // Initially Tehuana is selected
    await waitFor(() => {
      expect(screen.getByLabelText('Seleccionar Tehuana Tradicional')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    // Click Huipil
    fireEvent.click(screen.getByLabelText('Seleccionar Huipil de Grana'));

    await waitFor(() => {
      expect(screen.getByLabelText('Seleccionar Huipil de Grana')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByLabelText('Seleccionar Tehuana Tradicional')).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });
  });
});
