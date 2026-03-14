/**
 * components/ar/TryOnView.tsx
 *
 * Full-screen Try-On experience using MediaPipe FaceLandmarker.
 * Shows vestimenta overlaid on the user's face via camera.
 *
 * Sprint 3.3 — Try-On with MediaPipe
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { ChevronLeft, Camera, FlipHorizontal, Settings, Share2, Download, RotateCcw, Loader2 } from 'lucide-react';
import { useTryOn } from '../../hooks/ar/useTryOn';
import { useVestimentas } from '../../hooks/ar/useVestimentas';
import type { Vestimenta, Region } from '../../types/ar';
import type { NormalizedLandmark } from '../../utils/mediapipe-loader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VestimentaWithRegion = Vestimenta & {
  region?: Region;
  modelUrl?: string;
  modelUrlIos?: string;
};

type QualityMode = 'auto' | 'high' | 'low';

interface TryOnViewProps {
  vestimentaId?: string;
  onNavigate?: (view: string, data?: unknown) => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Constants: MediaPipe face landmark indices
// ---------------------------------------------------------------------------

// Top of head / forehead landmarks
const HEAD_TOP_INDICES = [10, 338, 297, 332, 284];
// Face boundary landmarks: top=10, bottom=152, left=234, right=454
const FACE_BOUNDARY = { top: 10, bottom: 152, left: 234, right: 454 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLandmarkPx(
  landmarks: NormalizedLandmark[],
  idx: number,
  canvasW: number,
  canvasH: number,
): { x: number; y: number } {
  const lm = landmarks[idx];
  if (!lm) return { x: 0, y: 0 };
  return { x: lm.x * canvasW, y: lm.y * canvasH };
}

/**
 * Draws a vestimenta image on the canvas positioned relative to face landmarks.
 */
function drawVestimentaOverlay(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  landmarks: NormalizedLandmark[],
  canvasW: number,
  canvasH: number,
  categoria: Vestimenta['categoria'],
) {
  const left = getLandmarkPx(landmarks, FACE_BOUNDARY.left, canvasW, canvasH);
  const right = getLandmarkPx(landmarks, FACE_BOUNDARY.right, canvasW, canvasH);
  const top = getLandmarkPx(landmarks, FACE_BOUNDARY.top, canvasW, canvasH);

  const faceWidth = Math.abs(right.x - left.x);
  const overlayWidth = faceWidth * 1.4; // Slightly wider than face
  const overlayHeight = (img.naturalHeight / img.naturalWidth) * overlayWidth;

  let drawX = left.x - (overlayWidth - faceWidth) / 2;
  let drawY = top.y;

  // For head/cabeza items: position ABOVE the top forehead landmark
  if (categoria === 'cabeza') {
    // Find average forehead y
    const foreheadY =
      HEAD_TOP_INDICES.reduce(
        (sum, idx) => sum + getLandmarkPx(landmarks, idx, canvasW, canvasH).y,
        0,
      ) / HEAD_TOP_INDICES.length;
    drawY = foreheadY - overlayHeight * 0.85;
  }

  // For accessories / mano: center over face
  if (categoria === 'accesorio' || categoria === 'mano') {
    const bottom = getLandmarkPx(landmarks, FACE_BOUNDARY.bottom, canvasW, canvasH);
    drawY = top.y;
    drawX = left.x - (overlayWidth - faceWidth) / 2;
    const faceH = Math.abs(bottom.y - top.y);
    const scaledH = faceH * 1.1;
    ctx.globalAlpha = 0.85;
    ctx.drawImage(img, drawX, drawY, overlayWidth, scaledH);
    ctx.globalAlpha = 1.0;
    return;
  }

  ctx.globalAlpha = 0.88;
  ctx.drawImage(img, drawX, drawY, overlayWidth, overlayHeight);
  ctx.globalAlpha = 1.0;
}

// ---------------------------------------------------------------------------
// Sub-component: VestimentaCarouselItem
// ---------------------------------------------------------------------------

interface CarouselItemProps {
  vestimenta: VestimentaWithRegion;
  isSelected: boolean;
  onSelect: (v: VestimentaWithRegion) => void;
}

function CarouselItem({ vestimenta, isSelected, onSelect }: CarouselItemProps) {
  return (
    <button
      onClick={() => onSelect(vestimenta)}
      aria-label={`Seleccionar ${vestimenta.nombre}`}
      aria-pressed={isSelected}
      className={`
        flex-shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all
        focus:outline-none focus:ring-2 focus:ring-white
        ${isSelected
          ? 'bg-white/30 ring-2 ring-white scale-105'
          : 'bg-black/30 hover:bg-black/40'
        }
      `}
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/10">
        {vestimenta.thumbnailUrl ? (
          <img
            src={vestimenta.thumbnailUrl}
            alt={vestimenta.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            👘
          </div>
        )}
      </div>
      <span className="text-white text-[10px] font-medium leading-tight text-center max-w-[60px] line-clamp-2">
        {vestimenta.nombre}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: CapturedPhotoPreview
// ---------------------------------------------------------------------------

interface PhotoPreviewProps {
  blob: Blob;
  onRetake: () => void;
}

function CapturedPhotoPreview({ blob, onRetake }: PhotoPreviewProps) {
  const url = URL.createObjectURL(blob);

  const handleShare = useCallback(async () => {
    const file = new File([blob], 'guelaguetza-tryon.jpg', { type: 'image/jpeg' });
    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Mi look Guelaguetza',
          text: 'Mira mi vestimenta tradicional con Guelaguetza Connect',
        });
      } catch {
        // User cancelled share — no-op
      }
    } else {
      // Fallback: download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'guelaguetza-tryon.jpg';
      a.click();
    }
  }, [blob, url]);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guelaguetza-tryon.jpg';
    a.click();
  }, [url]);

  // Revoke object URL when component unmounts
  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <div
      className="absolute inset-0 z-40 bg-black flex flex-col"
      data-testid="photo-preview"
    >
      <img
        src={url}
        alt="Foto capturada"
        className="flex-1 object-contain"
      />
      <div className="flex items-center justify-around px-6 py-6 bg-black/80">
        <button
          onClick={onRetake}
          aria-label="Tomar otra foto"
          className="flex flex-col items-center gap-1.5 text-white"
          data-testid="retake-button"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <RotateCcw className="w-6 h-6" />
          </div>
          <span className="text-xs">Repetir</span>
        </button>

        <button
          onClick={handleShare}
          aria-label="Compartir foto"
          className="flex flex-col items-center gap-1.5 text-white"
          data-testid="share-button"
        >
          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
            <Share2 className="w-6 h-6" />
          </div>
          <span className="text-xs">Compartir</span>
        </button>

        <button
          onClick={handleDownload}
          aria-label="Descargar foto"
          className="flex flex-col items-center gap-1.5 text-white"
          data-testid="download-button"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Download className="w-6 h-6" />
          </div>
          <span className="text-xs">Guardar</span>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component: TryOnView
// ---------------------------------------------------------------------------

export function TryOnView({ vestimentaId, onBack }: TryOnViewProps) {
  // Vestimenta catalog
  const { vestimentas, isLoading: catalogLoading } = useVestimentas({ featuredOnly: false });

  // Currently selected vestimenta (default to vestimentaId prop if provided)
  const [selectedVestimenta, setSelectedVestimenta] = useState<VestimentaWithRegion | null>(null);
  const [qualityMode, setQualityMode] = useState<QualityMode>('auto');
  const [showSettings, setShowSettings] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  // Vestimenta overlay image ref
  const overlayImgRef = useRef<HTMLImageElement | null>(null);

  // Try-on hook
  const {
    videoRef,
    canvasRef,
    isLoading,
    isTracking,
    error,
    faceLandmarks,
    startCamera,
    stopCamera,
    capturePhoto,
    flipCamera,
    isLowEnd,
    facingMode,
  } = useTryOn(
    qualityMode === 'high'
      ? { delegate: 'GPU', maxFps: 30 }
      : qualityMode === 'low'
      ? { delegate: 'CPU', maxFps: 10 }
      : undefined,
  );

  // Typed carousel selection handler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleCarouselSelect: (v: VestimentaWithRegion) => void = useCallback(
    (v: VestimentaWithRegion): void => { setSelectedVestimenta(v); },
    [],
  );

  // ---------------------------------------------------------------------------
  // Auto-select initial vestimenta from prop
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!vestimentas.length) return;
    if (vestimentaId) {
      const found = vestimentas.find((v) => String(v.id) === vestimentaId);
      if (found) {
        setSelectedVestimenta(found);
        return;
      }
    }
    // Default to first vestimenta
    if (!selectedVestimenta) {
      setSelectedVestimenta(vestimentas[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vestimentas, vestimentaId]);

  // ---------------------------------------------------------------------------
  // Start camera on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Pre-load overlay image when selection changes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!selectedVestimenta?.thumbnailUrl) {
      overlayImgRef.current = null;
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = selectedVestimenta.thumbnailUrl;
    img.onload = () => {
      overlayImgRef.current = img;
    };
  }, [selectedVestimenta]);

  // ---------------------------------------------------------------------------
  // Draw vestimenta overlay on canvas each frame
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sync canvas size with video
    if (video.videoWidth && canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const landmarks = faceLandmarks?.faceLandmarks?.[0];
    const img = overlayImgRef.current;

    if (landmarks && img && selectedVestimenta && canvas.width > 0) {
      drawVestimentaOverlay(
        ctx,
        img,
        landmarks,
        canvas.width,
        canvas.height,
        selectedVestimenta.categoria,
      );
    } else if (isLowEnd && img && canvas.width > 0) {
      // Low-end fallback: draw decorative frame border
      ctx.strokeStyle = 'rgba(230, 57, 70, 0.8)';
      ctx.lineWidth = 6;
      const margin = 24;
      ctx.strokeRect(margin, margin, canvas.width - margin * 2, canvas.height - margin * 2);

      // Draw vestimenta image in corner as decoration
      const thumbSize = Math.min(canvas.width * 0.25, 120);
      ctx.globalAlpha = 0.7;
      ctx.drawImage(img, canvas.width - thumbSize - 12, 12, thumbSize, thumbSize);
      ctx.globalAlpha = 1.0;
    }
  }, [faceLandmarks, selectedVestimenta, isLowEnd, canvasRef, videoRef]);

  // ---------------------------------------------------------------------------
  // Capture photo handler
  // ---------------------------------------------------------------------------

  const handleCapture = useCallback(async () => {
    const blob = await capturePhoto();
    if (blob) {
      setCapturedBlob(blob);
    }
  }, [capturePhoto]);

  const handleRetake = useCallback(() => {
    setCapturedBlob(null);
    startCamera();
  }, [startCamera]);

  // ---------------------------------------------------------------------------
  // Quality mode toggle
  // ---------------------------------------------------------------------------

  const cycleQuality = useCallback(() => {
    setQualityMode((prev) => {
      if (prev === 'auto') return 'high';
      if (prev === 'high') return 'low';
      return 'auto';
    });
    setShowSettings(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Render: photo preview
  // ---------------------------------------------------------------------------

  if (capturedBlob) {
    return (
      <div className="relative w-full h-full bg-black" data-testid="tryon-view">
        <CapturedPhotoPreview blob={capturedBlob} onRetake={handleRetake} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: main try-on view
  // ---------------------------------------------------------------------------

  return (
    <div
      className="relative w-full h-full bg-black overflow-hidden flex flex-col"
      data-testid="tryon-view"
    >
      {/* Camera + canvas overlay */}
      <div className="relative flex-1 overflow-hidden">
        {/* Video feed — mirrored for front camera */}
        <video
          ref={videoRef}
          data-testid="camera-video"
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          aria-label="Vista de camara"
        />

        {/* Vestimenta overlay canvas */}
        <canvas
          ref={canvasRef}
          data-testid="overlay-canvas"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          aria-hidden="true"
        />

        {/* Loading overlay */}
        {isLoading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10"
            data-testid="loading-overlay"
            aria-live="polite"
          >
            <Loader2 className="w-10 h-10 text-white animate-spin mb-3" aria-hidden="true" />
            <p className="text-white text-sm font-medium">Cargando detector facial...</p>
          </div>
        )}

        {/* Error overlay */}
        {error && !isLoading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10 px-8"
            data-testid="error-overlay"
            aria-live="assertive"
          >
            <p className="text-white text-center text-sm leading-relaxed">{error}</p>
            <button
              onClick={startCamera}
              className="mt-4 px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Low-end fallback notice */}
        {isLowEnd && !isLoading && !error && (
          <div
            className="absolute bottom-24 left-4 right-4 bg-black/60 rounded-xl px-4 py-3 z-10"
            data-testid="lowend-notice"
            aria-live="polite"
          >
            <p className="text-white/90 text-xs text-center leading-relaxed">
              Tu dispositivo no soporta tracking facial. Usa el marco decorativo.
            </p>
          </div>
        )}

        {/* No face detected — subtle hint */}
        {!isTracking && !isLowEnd && !isLoading && !error && (
          <div
            className="absolute top-20 left-0 right-0 flex justify-center z-10 pointer-events-none"
            aria-live="polite"
          >
            <span className="bg-black/50 text-white/80 text-xs px-4 py-2 rounded-full">
              No se detecta rostro
            </span>
          </div>
        )}

        {/* Settings panel */}
        {showSettings && (
          <div
            className="absolute top-16 right-4 bg-black/80 rounded-xl p-4 z-20 min-w-[160px]"
            data-testid="settings-panel"
          >
            <p className="text-white/60 text-xs mb-3 font-semibold uppercase tracking-wide">Calidad</p>
            {(['auto', 'high', 'low'] as QualityMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => { setQualityMode(mode); setShowSettings(false); }}
                className={`w-full text-left text-sm py-2 px-3 rounded-lg mb-1 transition-colors ${
                  qualityMode === mode
                    ? 'bg-red-600 text-white font-semibold'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {mode === 'auto' ? 'Automático' : mode === 'high' ? 'Alta' : 'Baja'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Top controls bar */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-safe">
        <div className="flex items-center justify-between px-4 pt-8 pb-3">
          <button
            onClick={onBack}
            aria-label="Volver"
            data-testid="back-button"
            className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center
                       focus:outline-none focus:ring-2 focus:ring-white transition-colors hover:bg-black/70"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <h1 className="text-white font-semibold text-sm drop-shadow">
            {selectedVestimenta?.nombre || 'Pruébate'}
          </h1>

          <button
            onClick={() => setShowSettings((s) => !s)}
            aria-label="Configuracion de calidad"
            aria-expanded={showSettings}
            data-testid="settings-button"
            className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center
                       focus:outline-none focus:ring-2 focus:ring-white transition-colors hover:bg-black/70"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20"
        data-testid="bottom-controls"
      >
        {/* Vestimenta carousel */}
        {(vestimentas.length > 0 || catalogLoading) && (
          <div
            className="flex gap-3 px-4 pb-3 overflow-x-auto scrollbar-none"
            data-testid="vestimenta-carousel"
            aria-label="Carrusel de vestimentas"
            role="listbox"
          >
            {catalogLoading && !vestimentas.length && (
              <div className="flex items-center gap-2 text-white/60 text-xs py-4 px-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cargando...</span>
              </div>
            )}
            {vestimentas.map((v) => (
              <CarouselItem
                key={v.id}
                vestimenta={v as VestimentaWithRegion}
                isSelected={selectedVestimenta?.id === v.id}
                onSelect={handleCarouselSelect}
              />
            ))}
          </div>
        )}

        {/* Action buttons row */}
        <div className="flex items-center justify-around px-8 pb-8 pt-2 bg-gradient-to-t from-black/60 to-transparent">
          {/* Flip camera */}
          <button
            onClick={flipCamera}
            aria-label="Voltear camara"
            data-testid="flip-camera-button"
            className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center
                       focus:outline-none focus:ring-2 focus:ring-white hover:bg-white/30 transition-colors"
          >
            <FlipHorizontal className="w-6 h-6 text-white" />
          </button>

          {/* Capture button */}
          <button
            onClick={handleCapture}
            aria-label="Tomar foto"
            data-testid="capture-button"
            disabled={isLoading}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center
                       shadow-lg focus:outline-none focus:ring-4 focus:ring-white/50
                       hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50"
          >
            <Camera className="w-9 h-9 text-gray-900" />
          </button>

          {/* Quality mode indicator (tappable) */}
          <button
            onClick={cycleQuality}
            aria-label={`Calidad: ${qualityMode}`}
            data-testid="quality-indicator"
            className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center
                       focus:outline-none focus:ring-2 focus:ring-white hover:bg-white/30 transition-colors"
          >
            <span className="text-white text-[10px] font-bold uppercase leading-tight text-center">
              {qualityMode === 'auto' ? 'AUTO' : qualityMode === 'high' ? 'HD' : 'ECO'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default TryOnView;
