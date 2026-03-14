import React, { useRef, useState, useCallback } from 'react';
import { ReactSketchCanvas, type ReactSketchCanvasRef } from 'react-sketch-canvas';
import {
  ArrowLeft,
  Sparkles,
  Undo2,
  Redo2,
  Trash2,
  Eraser,
  Pencil,
  Share2,
  Download,
  ImageOff,
  ChevronRight,
} from 'lucide-react';
import { ModelViewer } from './ModelViewer';
import { useAlebrije } from '../../hooks/ar/useAlebrije';
import type { UserCreation } from '../../types/ar';

// ============================================================================
// CONSTANTS — Oaxacan color palette
// ============================================================================

const OAXACAN_COLORS = [
  { name: 'rojo',      hex: '#E63946' },
  { name: 'amarillo',  hex: '#FFB703' },
  { name: 'verde',     hex: '#2A9D8F' },
  { name: 'azul',      hex: '#264653' },
  { name: 'naranja',   hex: '#F77F00' },
  { name: 'rosa',      hex: '#FF006E' },
  { name: 'morado',    hex: '#7209B7' },
  { name: 'turquesa',  hex: '#00BBF9' },
] as const;

const BRUSH_SIZES = [
  { label: 'thin',   px: 3,  display: 'S' },
  { label: 'medium', px: 8,  display: 'M' },
  { label: 'thick',  px: 20, display: 'L' },
] as const;

type BrushLabel = (typeof BRUSH_SIZES)[number]['label'];

const GENERATION_STAGES = [
  { label: 'Analizando dibujo...',    from: 0,  to: 30  },
  { label: 'Generando modelo 3D...',  from: 30, to: 80  },
  { label: 'Aplicando colores...',    from: 80, to: 100 },
] as const;

const PLACEHOLDER_GLB =
  'https://modelviewer.dev/shared-assets/models/Astronaut.glb';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'drawing' | 'generating' | 'gallery' | 'result' | 'fallback';

interface AlebrijeViewProps {
  onNavigate?: (view: string, data?: unknown) => void;
  onBack: () => void;
  /** Optional userId — gallery & save require it */
  userId?: string | null;
}

// ============================================================================
// SUB-COMPONENT: GenerationProgress
// ============================================================================

interface GenerationProgressProps {
  progress: number; // 0–100
}

function GenerationProgress({ progress }: GenerationProgressProps) {
  const stageIdx =
    progress < 30 ? 0 : progress < 80 ? 1 : 2;
  const stage = GENERATION_STAGES[stageIdx];

  return (
    <div
      data-testid="generation-progress"
      className="flex flex-col items-center gap-6 px-6 py-10"
    >
      {/* Spinning alebrije icon */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-[#FFB703]/30 animate-spin" />
        <div
          className="absolute inset-2 rounded-full border-4 border-t-[#E63946] border-r-[#FFB703] border-b-[#2A9D8F] border-l-[#7209B7] animate-spin"
          style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
        />
        <Sparkles className="w-10 h-10 text-[#FFB703]" />
      </div>

      {/* Stage label */}
      <p className="text-lg font-semibold text-gray-800 text-center">
        {stage.label}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background:
                'linear-gradient(90deg, #E63946, #FFB703, #2A9D8F)',
            }}
          />
        </div>
        <p className="text-right text-sm text-gray-500 mt-1">{progress}%</p>
      </div>

      {/* Stage dots */}
      <div className="flex gap-3" data-testid="stage-dots">
        {GENERATION_STAGES.map((s, i) => (
          <div
            key={s.label}
            className={`w-3 h-3 rounded-full transition-colors ${
              i <= stageIdx ? 'bg-[#E63946]' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: DrawingCanvas
// ============================================================================

interface DrawingCanvasProps {
  canvasRef: React.RefObject<ReactSketchCanvasRef>;
  strokeColor: string;
  strokeWidth: number;
  eraserMode: boolean;
}

function DrawingCanvas({
  canvasRef,
  strokeColor,
  strokeWidth,
  eraserMode,
}: DrawingCanvasProps) {
  return (
    <div
      data-testid="drawing-canvas-wrapper"
      className="flex-1 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-white"
    >
      <ReactSketchCanvas
        ref={canvasRef}
        strokeColor={eraserMode ? '#FFFFFF' : strokeColor}
        strokeWidth={eraserMode ? strokeWidth * 2 : strokeWidth}
        canvasColor="#FFFFFF"
        style={{ width: '100%', height: '100%' }}
        withTimestamp={false}
        data-testid="sketch-canvas"
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: FallbackFrame
// Oaxacan-style decorative frame for when the API is unavailable
// ============================================================================

interface FallbackFrameProps {
  drawingDataUrl: string;
  nombreCreacion: string;
}

function FallbackFrame({ drawingDataUrl, nombreCreacion }: FallbackFrameProps) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = drawingDataUrl;
    a.download = `${nombreCreacion.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      const res = await fetch(drawingDataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'mi-alebrije.png', { type: 'image/png' });
      await navigator.share({ title: nombreCreacion, files: [file] });
    } catch {
      // share not available
    }
  };

  return (
    <div
      data-testid="fallback-frame"
      className="flex flex-col items-center gap-6 px-4 py-6"
    >
      {/* Decorative Oaxacan border frame */}
      <div
        className="relative p-4 rounded-2xl"
        style={{
          background:
            'linear-gradient(135deg, #E63946 0%, #FFB703 25%, #2A9D8F 50%, #7209B7 75%, #E63946 100%)',
          padding: '4px',
        }}
      >
        <div className="bg-white rounded-xl p-3">
          <img
            src={drawingDataUrl}
            alt={nombreCreacion}
            className="rounded-lg max-h-72 w-auto mx-auto"
          />
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900">{nombreCreacion}</h3>
        <p className="text-gray-500 text-sm mt-1">Tu Alebrije</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Descargar
        </button>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-3 bg-[#E63946] text-white rounded-xl font-medium hover:bg-[#c62e3c] transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Compartir
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: GalleryGrid
// ============================================================================

interface GalleryGridProps {
  creations: UserCreation[];
  onSelect: (creation: UserCreation) => void;
}

function GalleryGrid({ creations, onSelect }: GalleryGridProps) {
  if (creations.length === 0) {
    return (
      <div
        data-testid="gallery-empty"
        className="flex flex-col items-center justify-center gap-4 py-20 text-center px-6"
      >
        <ImageOff className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500 font-medium">
          Aun no has creado ningun alebrije
        </p>
        <p className="text-gray-400 text-sm">
          Dibuja algo y dale vida en 3D
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="gallery-grid"
      className="grid grid-cols-2 gap-3 p-4"
    >
      {creations.map((creation) => (
        <button
          key={creation.uuid}
          onClick={() => onSelect(creation)}
          className="group relative rounded-xl overflow-hidden bg-gray-100 aspect-square hover:shadow-md transition-shadow"
          aria-label={`Ver ${creation.nombreCreacion ?? 'Mi Alebrije'}`}
        >
          {creation.thumbnailUrl ? (
            <img
              src={creation.thumbnailUrl}
              alt={creation.nombreCreacion ?? 'Alebrije'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E63946]/20 to-[#7209B7]/20">
              <Sparkles className="w-8 h-8 text-[#7209B7]/50" />
            </div>
          )}

          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <p className="text-white text-xs font-medium truncate">
              {creation.nombreCreacion ?? 'Mi Alebrije'}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: AlebrijeView
// ============================================================================

export function AlebrijeView({ onBack, userId = null }: AlebrijeViewProps) {
  // ── Canvas ref & drawing state
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [strokeColor, setStrokeColor] = useState<string>(OAXACAN_COLORS[0].hex);
  const [brushSize, setBrushSize] = useState<BrushLabel>('medium');
  const [eraserMode, setEraserMode] = useState(false);

  // ── View mode
  const [viewMode, setViewMode] = useState<ViewMode>('drawing');

  // ── Generation state
  const [progress, setProgress] = useState(0);
  const [drawingDataUrl, setDrawingDataUrl] = useState<string>('');
  const [resultModelUrl, setResultModelUrl] = useState<string | undefined>(
    undefined
  );
  const [nombreCreacion] = useState('Mi Alebrije');

  // ── Selected gallery item
  const [selectedCreation, setSelectedCreation] = useState<UserCreation | null>(
    null
  );

  // ── Hook
  const { generate, checkStatus, gallery, isLoading: galleryLoading, refresh } =
    useAlebrije(userId);

  // ── Brush size in px
  const strokeWidth =
    BRUSH_SIZES.find((b) => b.label === brushSize)?.px ?? 8;

  // ---------------------------------------------------------------------------
  // Drawing toolbar actions
  // ---------------------------------------------------------------------------
  const handleUndo = () => canvasRef.current?.undo();
  const handleRedo = () => canvasRef.current?.redo();
  const handleClear = () => canvasRef.current?.clearCanvas();
  const handleToggleEraser = () => setEraserMode((prev) => !prev);

  // ---------------------------------------------------------------------------
  // Submit drawing → start generation
  // ---------------------------------------------------------------------------
  const handleSubmit = useCallback(async () => {
    if (!canvasRef.current) return;

    let dataUrl = '';
    try {
      dataUrl = await canvasRef.current.exportImage('png');
    } catch {
      // canvas might be empty; fall through to fallback
    }

    setDrawingDataUrl(dataUrl);
    setViewMode('generating');
    setProgress(0);

    try {
      // Extract base64 payload (strip data:image/png;base64, prefix)
      const base64 = dataUrl.split(',')[1] ?? dataUrl;
      const taskId = await generate(base64, 'cartoon', nombreCreacion);

      // Simulate progress while polling
      let currentProgress = 0;
      const interval = setInterval(async () => {
        currentProgress = Math.min(currentProgress + 5, 95);
        setProgress(currentProgress);

        try {
          const statusResult = await checkStatus(taskId);
          if (statusResult.status === 'completed') {
            clearInterval(interval);
            setProgress(100);
            setResultModelUrl(statusResult.modelUrl ?? PLACEHOLDER_GLB);
            setTimeout(() => setViewMode('result'), 500);
          } else if (statusResult.status === 'failed') {
            clearInterval(interval);
            setViewMode('fallback');
          }
        } catch {
          // Network hiccup — keep polling
        }
      }, 1_500);

      // Safety timeout: after 60 s show result with placeholder
      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        setResultModelUrl(PLACEHOLDER_GLB);
        setViewMode('result');
      }, 60_000);
    } catch {
      // API unavailable — show fallback with the drawing
      setViewMode('fallback');
    }
  }, [generate, checkStatus, nombreCreacion]);

  // ---------------------------------------------------------------------------
  // Gallery item selection
  // ---------------------------------------------------------------------------
  const handleSelectCreation = (creation: UserCreation) => {
    setSelectedCreation(creation);
    setResultModelUrl(creation.modelUrlGlb ?? PLACEHOLDER_GLB);
    setViewMode('result');
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      data-testid="alebrije-view"
      className="flex flex-col h-screen bg-gray-50 overflow-hidden"
    >
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-3 bg-white shadow-sm shrink-0">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Volver</span>
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#FFB703]" />
          <h1 className="text-base font-bold text-gray-900">Crea tu Alebrije</h1>
        </div>

        {/* Gallery toggle */}
        <button
          data-testid="gallery-toggle"
          onClick={() =>
            setViewMode((prev) => (prev === 'gallery' ? 'drawing' : 'gallery'))
          }
          className="text-sm text-[#E63946] font-medium hover:underline"
          aria-label={viewMode === 'gallery' ? 'Dibujar' : 'Ver galeria'}
        >
          {viewMode === 'gallery' ? 'Dibujar' : 'Galeria'}
        </button>
      </header>

      {/* ── Body ── */}
      <main className="flex-1 overflow-y-auto">

        {/* DRAWING MODE */}
        {viewMode === 'drawing' && (
          <div className="flex flex-col h-full p-4 gap-3">

            {/* Canvas */}
            <DrawingCanvas
              canvasRef={canvasRef}
              strokeColor={strokeColor}
              strokeWidth={strokeWidth}
              eraserMode={eraserMode}
            />

            {/* Color palette */}
            <div
              data-testid="color-palette"
              className="flex justify-center gap-2 flex-wrap"
              aria-label="Paleta de colores"
            >
              {OAXACAN_COLORS.map((color) => (
                <button
                  key={color.hex}
                  data-testid={`color-${color.name}`}
                  onClick={() => {
                    setStrokeColor(color.hex);
                    setEraserMode(false);
                  }}
                  aria-label={color.name}
                  className={`w-9 h-9 rounded-full border-4 transition-transform hover:scale-110 ${
                    strokeColor === color.hex && !eraserMode
                      ? 'border-gray-900 scale-110'
                      : 'border-white shadow-md'
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>

            {/* Brush size + tool bar */}
            <div className="flex items-center justify-between gap-2">
              {/* Brush sizes */}
              <div
                data-testid="brush-sizes"
                className="flex gap-2 items-center"
                aria-label="Tamano de brocha"
              >
                {BRUSH_SIZES.map((b) => (
                  <button
                    key={b.label}
                    data-testid={`brush-${b.label}`}
                    onClick={() => {
                      setBrushSize(b.label);
                      setEraserMode(false);
                    }}
                    aria-label={`Brocha ${b.display}`}
                    className={`flex items-center justify-center rounded-full transition-colors font-bold text-xs ${
                      brushSize === b.label && !eraserMode
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                    style={{ width: 36, height: 36 }}
                  >
                    {b.display}
                  </button>
                ))}
              </div>

              {/* Tool bar */}
              <div
                data-testid="tool-bar"
                className="flex gap-2"
                aria-label="Herramientas"
              >
                <button
                  data-testid="btn-undo"
                  onClick={handleUndo}
                  aria-label="Deshacer"
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <Undo2 className="w-5 h-5" />
                </button>
                <button
                  data-testid="btn-redo"
                  onClick={handleRedo}
                  aria-label="Rehacer"
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <Redo2 className="w-5 h-5" />
                </button>
                <button
                  data-testid="btn-clear"
                  onClick={handleClear}
                  aria-label="Limpiar"
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-red-50 text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  data-testid="btn-eraser"
                  onClick={handleToggleEraser}
                  aria-label="Borrador"
                  className={`p-2 rounded-lg border transition-colors ${
                    eraserMode
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {eraserMode ? (
                    <Pencil className="w-5 h-5" />
                  ) : (
                    <Eraser className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              data-testid="btn-submit"
              onClick={handleSubmit}
              className="w-full py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
              style={{
                background:
                  'linear-gradient(135deg, #E63946 0%, #FFB703 50%, #2A9D8F 100%)',
              }}
            >
              <Sparkles className="w-5 h-5" />
              Dar vida en 3D
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* GENERATING MODE */}
        {viewMode === 'generating' && (
          <div className="flex flex-col h-full">
            {/* Drawing preview */}
            {drawingDataUrl && (
              <div className="px-4 pt-4">
                <img
                  src={drawingDataUrl}
                  alt="Tu dibujo"
                  data-testid="drawing-preview"
                  className="w-full max-h-48 object-contain rounded-xl border border-gray-200 bg-white"
                />
              </div>
            )}

            <GenerationProgress progress={progress} />
          </div>
        )}

        {/* RESULT MODE */}
        {viewMode === 'result' && (
          <div
            data-testid="result-view"
            className="flex flex-col items-center gap-4 p-4"
          >
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCreation?.nombreCreacion ?? nombreCreacion}
            </h2>

            <ModelViewer
              src={resultModelUrl ?? PLACEHOLDER_GLB}
              alt="Tu Alebrije 3D"
              autoRotate
              ar
              className="w-full aspect-square rounded-xl overflow-hidden"
            />

            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setViewMode('drawing');
                  setSelectedCreation(null);
                  setResultModelUrl(undefined);
                  setProgress(0);
                  canvasRef.current?.clearCanvas();
                }}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Crear otro
              </button>
              <button
                onClick={refresh}
                className="flex-1 py-3 rounded-xl bg-[#E63946] text-white font-medium hover:bg-[#c62e3c] transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </button>
            </div>
          </div>
        )}

        {/* FALLBACK MODE — no API, show drawing in decorative frame */}
        {viewMode === 'fallback' && (
          <FallbackFrame
            drawingDataUrl={drawingDataUrl}
            nombreCreacion={nombreCreacion}
          />
        )}

        {/* GALLERY MODE */}
        {viewMode === 'gallery' && (
          <div data-testid="gallery-view">
            {galleryLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#E63946] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <GalleryGrid
                creations={gallery}
                onSelect={handleSelectCreation}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AlebrijeView;
