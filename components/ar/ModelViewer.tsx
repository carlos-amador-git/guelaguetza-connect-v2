import { useEffect, useRef, useState } from 'react';
import type { ModelViewerProps } from '../../types/ar';

// model-viewer types are declared in ./model-viewer.d.ts

// ============================================================================
// COMPONENT: ModelViewer
// Wrapper for Google Model Viewer — supports 3D and native AR
// ============================================================================

export function ModelViewer({
  src,
  iosSrc,
  poster,
  alt,
  autoRotate = true,
  cameraControls = true,
  ar = true,
  arModes = 'webxr scene-viewer quick-look',
  onARStart,
  onAREnd,
  className = '',
  children,
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isARSupported, setIsARSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the model-viewer script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already loaded via npm package — check if element is registered
    if (customElements.get('model-viewer')) {
      setIsLoaded(true);
      return;
    }

    // Fallback: load from CDN if not registered (e.g. during testing)
    const script = document.createElement('script');
    script.type = 'module';
    script.src =
      'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError('Error al cargar el visor 3D');
    document.head.appendChild(script);
  }, []);

  // Check AR support and bind AR event listeners
  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    const modelViewer = containerRef.current.querySelector('model-viewer');
    if (!modelViewer) return;

    const handleARStatus = (event: Event) => {
      const status = (event as CustomEvent).detail?.status;

      if (status === 'session-started') {
        onARStart?.();
      } else if (status === 'not-presenting') {
        onAREnd?.();
      }
    };

    const checkARSupport = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canActivateAR = await (modelViewer as any).canActivateAR;
        setIsARSupported(!!canActivateAR);
      } catch {
        setIsARSupported(false);
      }
    };

    modelViewer.addEventListener('ar-status', handleARStatus);
    checkARSupport();

    return () => {
      modelViewer.removeEventListener('ar-status', handleARStatus);
    };
  }, [isLoaded, onARStart, onAREnd]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
      >
        <p className="text-gray-500 text-center p-4">{error}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg animate-pulse ${className}`}
      >
        <div className="text-center p-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Cargando visor 3D...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <model-viewer
        src={src}
        ios-src={iosSrc}
        poster={poster}
        alt={alt}
        shadow-intensity="1"
        camera-controls={cameraControls}
        touch-action="pan-y"
        auto-rotate={autoRotate}
        ar={ar}
        ar-modes={arModes}
        ar-scale="auto"
        ar-placement="floor"
        loading="lazy"
        reveal="auto"
        style={{ width: '100%', height: '100%', minHeight: '300px' }}
      >
        {/* Custom AR button */}
        {ar && (
          <button
            slot="ar-button"
            className="absolute bottom-4 right-4 px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Ver en AR
          </button>
        )}

        {/* Loading progress bar */}
        <div slot="progress-bar" className="absolute bottom-0 left-0 right-0">
          <div className="h-1 bg-gray-200">
            <div
              className="h-full bg-red-600 transition-all"
              style={{ width: '0%' }}
            />
          </div>
        </div>

        {/* Additional content (overlays, info, etc.) */}
        {children}
      </model-viewer>

      {/* AR support badge */}
      {ar && (
        <div className="absolute top-4 left-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isARSupported
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isARSupported ? 'AR disponible' : 'AR no disponible'}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENT: VestimentaViewer
// Model viewer with cultural overlay information
// ============================================================================

interface VestimentaViewerProps {
  vestimenta: {
    nombre: string;
    descripcion?: string;
    modelUrl?: string;
    modelUrlIos?: string;
    thumbnailUrl?: string;
    region?: {
      nombre: string;
      colorPrimario: string;
    };
    artesanoNombre?: string;
    artesanoUrl?: string;
  };
  onARStart?: () => void;
  onAREnd?: () => void;
  className?: string;
}

export function VestimentaViewer({
  vestimenta,
  onARStart,
  onAREnd,
  className = '',
}: VestimentaViewerProps) {
  if (!vestimenta.modelUrl) {
    return (
      <div className={`bg-gray-100 rounded-xl p-8 text-center ${className}`}>
        <p className="text-gray-500">Modelo 3D no disponible</p>
        {vestimenta.thumbnailUrl && (
          <img
            src={vestimenta.thumbnailUrl}
            alt={vestimenta.nombre}
            className="mt-4 mx-auto max-h-64 rounded-lg"
          />
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <ModelViewer
        src={vestimenta.modelUrl}
        iosSrc={vestimenta.modelUrlIos}
        poster={vestimenta.thumbnailUrl}
        alt={vestimenta.nombre}
        onARStart={onARStart}
        onAREnd={onAREnd}
        className="w-full aspect-square rounded-xl overflow-hidden"
      >
        {/* Cultural info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white pointer-events-none">
          <h3 className="text-xl font-bold mb-1">{vestimenta.nombre}</h3>

          {vestimenta.region && (
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: vestimenta.region.colorPrimario }}
              />
              <span className="text-sm opacity-90">{vestimenta.region.nombre}</span>
            </div>
          )}

          {vestimenta.descripcion && (
            <p className="text-sm opacity-80 line-clamp-2">{vestimenta.descripcion}</p>
          )}
        </div>
      </ModelViewer>

      {/* Artisan link */}
      {vestimenta.artesanoNombre && vestimenta.artesanoUrl && (
        <a
          href={vestimenta.artesanoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-2 text-sm text-amber-600 hover:underline"
        >
          <span>Conoce a {vestimenta.artesanoNombre}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      )}
    </div>
  );
}

export default ModelViewer;
