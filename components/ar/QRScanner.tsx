/**
 * QRScanner.tsx
 *
 * Fullscreen QR scanner using the native BarcodeDetector API.
 * Parses QR codes pointing to: https://guelaguetzaconnect.com/ar/point/{codigo}
 * and calls onScan with the extracted punto codigo.
 *
 * Fallback: shows a message for browsers without BarcodeDetector support.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, ScanLine, Camera } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface QRScannerProps {
  onScan: (pointCodigo: string) => void;
  onClose: () => void;
}

// BarcodeDetector is not in standard TS lib yet — declare minimal interface
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement | ImageBitmap | HTMLCanvasElement): Promise<{ rawValue: string }[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

const AR_POINT_URL_PATTERN = /\/ar\/point\/([a-z0-9_]+)$/i;

function extractPointCodigo(rawValue: string): string | null {
  const match = AR_POINT_URL_PATTERN.exec(rawValue);
  return match ? match[1] : null;
}

function isBarcodeDetectorSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(0);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const scannedRef = useRef(false); // prevent duplicate scans

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSupported] = useState(isBarcodeDetectorSupported);

  // ── Camera setup ──────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch (err) {
      const message =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Acceso a la cámara denegado. Habilita los permisos en tu navegador.'
          : 'No se pudo acceder a la cámara. Verifica que no esté en uso por otra aplicación.';
      setCameraError(message);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // ── QR scanning loop ──────────────────────────────────────────────────────

  const scan = useCallback(() => {
    if (!detectorRef.current || !videoRef.current || scannedRef.current) return;

    const video = videoRef.current;
    if (video.readyState < video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scan);
      return;
    }

    detectorRef.current
      .detect(video)
      .then((barcodes) => {
        for (const barcode of barcodes) {
          const codigo = extractPointCodigo(barcode.rawValue);
          if (codigo && !scannedRef.current) {
            scannedRef.current = true;
            stopCamera();
            onScan(codigo);
            return;
          }
        }
        animationFrameRef.current = requestAnimationFrame(scan);
      })
      .catch(() => {
        animationFrameRef.current = requestAnimationFrame(scan);
      });
  }, [onScan, stopCamera]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isSupported) return;

    detectorRef.current = new window.BarcodeDetector!({ formats: ['qr_code'] });
    void startCamera();

    return () => {
      stopCamera();
    };
  }, [isSupported, startCamera, stopCamera]);

  useEffect(() => {
    if (isReady && isSupported) {
      animationFrameRef.current = requestAnimationFrame(scan);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isReady, isSupported, scan]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Escáner de códigos QR"
      data-testid="qr-scanner"
    >
      {/* Close button */}
      <button
        onClick={() => {
          stopCamera();
          onClose();
        }}
        aria-label="Cerrar escáner"
        className="absolute right-4 z-10 p-2 rounded-full bg-black/60 text-white
                   hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/60
                   transition-colors"
        style={{ top: 'max(env(safe-area-inset-top, 0px), 16px)' }}
      >
        <X className="w-6 h-6" aria-hidden="true" />
      </button>

      {isSupported && !cameraError ? (
        <>
          <video
            ref={videoRef}
            muted
            playsInline
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
            data-testid="qr-video"
          />

          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <p className="text-white text-center text-sm font-medium mb-8 px-6
                          bg-black/40 py-2 rounded-full backdrop-blur-sm">
              Apunta al código QR del punto AR
            </p>

            {/* Reticle with animated corners */}
            <div
              className="relative w-64 h-64"
              role="img"
              aria-label="Área de escaneo"
              data-testid="qr-reticle"
            >
              <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/90 rounded-tl-lg" aria-hidden="true" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/90 rounded-tr-lg" aria-hidden="true" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/90 rounded-bl-lg" aria-hidden="true" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/90 rounded-br-lg" aria-hidden="true" />

              {/* Scanning line */}
              <div
                className="absolute inset-x-2 h-0.5 bg-red-500/80 rounded-full"
                style={{ animation: 'qr-scan-line 2s ease-in-out infinite', top: '50%' }}
                aria-hidden="true"
              />
            </div>

            <p className="text-white/70 text-xs text-center mt-8 px-8">
              Mantén el código QR dentro del recuadro
            </p>

            {!isReady && (
              <div className="mt-4 flex items-center gap-2 text-white/60 text-sm">
                <Camera className="w-4 h-4 animate-pulse" aria-hidden="true" />
                <span>Iniciando cámara…</span>
              </div>
            )}
          </div>
        </>
      ) : cameraError ? (
        <div className="flex flex-col items-center justify-center h-full px-8 text-center">
          <Camera className="w-16 h-16 text-white/30 mb-6" aria-hidden="true" />
          <p className="text-white font-semibold text-lg mb-3">Sin acceso a cámara</p>
          <p className="text-white/60 text-sm mb-8">{cameraError}</p>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="bg-white text-gray-900 font-semibold px-6 py-3 rounded-xl
                       hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full px-8 text-center">
          <ScanLine className="w-16 h-16 text-white/30 mb-6" aria-hidden="true" />
          <p className="text-white font-semibold text-lg mb-3">
            Escaneo no disponible en este navegador
          </p>
          <p className="text-white/60 text-sm mb-8">
            Tu navegador no soporta escaneo de QR. Usa la app de cámara de tu teléfono.
          </p>
          <button
            onClick={onClose}
            className="bg-white text-gray-900 font-semibold px-6 py-3 rounded-xl
                       hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}

      <style>{`
        @keyframes qr-scan-line {
          0%   { transform: translateY(-60px); opacity: 0.4; }
          50%  { transform: translateY(60px);  opacity: 1; }
          100% { transform: translateY(-60px); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default QRScanner;
