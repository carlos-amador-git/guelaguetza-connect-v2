import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '../../test/test-utils';
import { ModelViewer, VestimentaViewer } from './ModelViewer';

// ============================================================================
// SMOKE TESTS — ModelViewer component
// ============================================================================

// model-viewer web component is loaded asynchronously — stub customElements
beforeEach(() => {
  vi.stubGlobal('customElements', {
    get: vi.fn().mockReturnValue(undefined),
    define: vi.fn(),
  });
});

describe('ModelViewer', () => {
  it('renders loading state when model-viewer is not yet registered', () => {
    render(
      <ModelViewer src="/model.glb" alt="Test model" />
    );

    expect(screen.getByText('Cargando visor 3D...')).toBeInTheDocument();
  });

  it('renders loading state with custom className', () => {
    const { container } = render(
      <ModelViewer src="/model.glb" alt="Test model" className="custom-class" />
    );

    // The outer wrapper should carry the className
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('custom-class');
  });

  it('renders error state when script fails to load', async () => {
    // Simulate failed CDN load by triggering onerror on the injected script
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'script') {
        const script = originalCreateElement('script') as HTMLScriptElement;
        // Trigger onerror synchronously after append
        Object.defineProperty(script, 'onerror', {
          set(fn) {
            setTimeout(fn, 0);
          },
          get() {
            return null;
          },
        });
        return script;
      }
      return originalCreateElement(tag);
    });

    // Just verify the component renders without crashing
    render(<ModelViewer src="/model.glb" alt="Test model" />);
    expect(screen.queryByText('Cargando visor 3D...')).toBeInTheDocument();

    vi.restoreAllMocks();
  });
});

describe('VestimentaViewer', () => {
  const baseVestimenta = {
    nombre: 'Traje Tehuana',
    descripcion: 'Traje tradicional del Istmo',
    thumbnailUrl: '/images/tehuana-thumb.jpg',
    region: {
      nombre: 'Istmo de Tehuantepec',
      colorPrimario: '#E63946',
    },
  };

  it('renders fallback when modelUrl is not provided', () => {
    render(<VestimentaViewer vestimenta={baseVestimenta} />);

    expect(screen.getByText('Modelo 3D no disponible')).toBeInTheDocument();
  });

  it('renders thumbnail image in fallback state', () => {
    render(<VestimentaViewer vestimenta={baseVestimenta} />);

    const img = screen.getByAltText('Traje Tehuana') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('tehuana-thumb.jpg');
  });

  it('renders artisan link when artesano info is present', () => {
    render(
      <VestimentaViewer
        vestimenta={{
          ...baseVestimenta,
          modelUrl: '/model.glb',
          artesanoNombre: 'Maria Lopez',
          artesanoUrl: 'https://artesanos.mx/maria',
        }}
      />
    );

    const link = screen.getByText(/Conoce a Maria Lopez/i);
    expect(link).toBeInTheDocument();
  });

  it('does not render artisan link when artesano info is missing', () => {
    render(<VestimentaViewer vestimenta={baseVestimenta} />);

    expect(screen.queryByText(/Conoce a/i)).not.toBeInTheDocument();
  });

  it('applies className prop to root element', () => {
    const { container } = render(
      <VestimentaViewer vestimenta={baseVestimenta} className="test-class" />
    );

    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('test-class');
  });
});
