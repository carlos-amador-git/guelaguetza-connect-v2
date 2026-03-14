/**
 * hooks/ar/useTryOn.ts
 *
 * Encapsulates camera access, MediaPipe face detection loop, and photo capture
 * for the Try-On feature. Handles low-end device fallback gracefully.
 *
 * Sprint 3.3 — Try-On with MediaPipe
 */

import { useRef, useState, useCallback, useEffect, type RefObject } from 'react';
import { detectLowEndDevice, getOptimalConfig, createFrameThrottler } from '../../utils/mediapipe-config';
import type { MediaPipeConfig } from '../../utils/mediapipe-config';
import { loadFaceLandmarker, disposeFaceLandmarker } from '../../utils/mediapipe-loader';
import type { FaceLandmarkerResult, FaceLandmarkerInstance } from '../../utils/mediapipe-loader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseTryOnReturn {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isLoading: boolean;
  isTracking: boolean;
  error: string | null;
  faceLandmarks: FaceLandmarkerResult | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => Promise<Blob | null>;
  flipCamera: () => Promise<void>;
  isLowEnd: boolean;
  facingMode: 'user' | 'environment';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTryOn(config?: Partial<MediaPipeConfig>): UseTryOnReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const landmarkerRef = useRef<FaceLandmarkerInstance | null>(null);
  const isRunningRef = useRef(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceLandmarks, setFaceLandmarks] = useState<FaceLandmarkerResult | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isLowEnd] = useState<boolean>(() => detectLowEndDevice());

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Detection loop
  // ---------------------------------------------------------------------------

  const startDetectionLoop = useCallback(
    (landmarker: FaceLandmarkerInstance, maxFps: number) => {
      const throttle = createFrameThrottler(maxFps);
      isRunningRef.current = true;

      const loop = () => {
        if (!isRunningRef.current) return;

        const video = videoRef.current;
        if (video && video.readyState >= 2 /* HAVE_CURRENT_DATA */) {
          throttle(() => {
            try {
              const result = landmarker.detectForVideo(video, performance.now());
              setFaceLandmarks(result);
              const hasLandmarks =
                result.faceLandmarks && result.faceLandmarks.length > 0;
              setIsTracking(hasLandmarks);
            } catch {
              // Detection errors are non-fatal — skip frame
            }
          });
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Start camera
  // ---------------------------------------------------------------------------

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Skip MediaPipe on low-end devices
      if (isLowEnd) {
        setIsLoading(false);
        return;
      }

      // Resolve optimal config and apply any overrides
      const baseConfig = await getOptimalConfig();
      const finalConfig = { ...baseConfig, ...config };

      const landmarker = await loadFaceLandmarker(finalConfig);
      landmarkerRef.current = landmarker;

      startDetectionLoop(landmarker, finalConfig.maxFps);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al acceder a la camara';

      if (message.includes('Permission') || message.includes('NotAllowed') || message.includes('NotFound')) {
        setError('Permiso de camara denegado. Activa la camara en la configuracion de tu navegador.');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, isLowEnd, config, startDetectionLoop]);

  // ---------------------------------------------------------------------------
  // Stop camera
  // ---------------------------------------------------------------------------

  const stopCamera = useCallback(() => {
    isRunningRef.current = false;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    disposeFaceLandmarker();
    landmarkerRef.current = null;
    setIsTracking(false);
    setFaceLandmarks(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Flip camera
  // ---------------------------------------------------------------------------

  const flipCamera = useCallback(async () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);

    // Stop current stream — startCamera will be called by the effect below
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    isRunningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, [facingMode]);

  // Re-start camera when facingMode changes (only if we had an active stream)
  useEffect(() => {
    if (!streamRef.current && videoRef.current) {
      // Only auto-restart if the video element exists (camera was active before)
    }
  }, [facingMode]);

  // ---------------------------------------------------------------------------
  // Capture photo
  // ---------------------------------------------------------------------------

  const capturePhoto = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return null;

    const width = video.videoWidth || canvas.width;
    const height = video.videoHeight || canvas.height;

    // Create an off-screen canvas to merge video + overlay
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d');

    if (!ctx) return null;

    // Mirror the image if using front camera (facingMode === 'user')
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // Draw video frame
    ctx.drawImage(video, 0, 0, width, height);

    if (facingMode === 'user') {
      // Reset transform before drawing overlay
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Draw overlay canvas on top (vestimenta overlay)
    ctx.drawImage(canvas, 0, 0, width, height);

    return new Promise<Blob | null>((resolve) => {
      offscreen.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    });
  }, [facingMode]);

  return {
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
  };
}
