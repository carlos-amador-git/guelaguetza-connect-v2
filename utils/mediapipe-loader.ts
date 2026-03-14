/**
 * utils/mediapipe-loader.ts
 *
 * Dynamic loader for MediaPipe Tasks Vision — loaded via CDN script injection
 * to avoid npm bundle bloat (same pattern as model-viewer).
 *
 * Sprint 3.3 — Try-On with MediaPipe
 */

import type { MediaPipeConfig } from './mediapipe-config';

// ---------------------------------------------------------------------------
// Globals augmentation — CDN bundle exposes these on window
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    /** Set to the resolved MediaPipe Vision module after CDN load */
    __mediapipeVision?: MediaPipeVisionModule;
    /** Set to the active FaceLandmarker instance */
    __faceLandmarker?: FaceLandmarkerInstance;
  }
}

export interface MediaPipeVisionModule {
  FaceLandmarker: FaceLandmarkerConstructor;
  FilesetResolver: FilesetResolverConstructor;
}

interface FilesetResolverConstructor {
  forVisionTasks(wasmUrl: string): Promise<FilesetResolver>;
}

interface FilesetResolver {
  // opaque — passed directly to FaceLandmarker.createFromOptions
  [key: string]: unknown;
}

interface FaceLandmarkerConstructor {
  createFromOptions(
    resolver: FilesetResolver,
    options: FaceLandmarkerOptions,
  ): Promise<FaceLandmarkerInstance>;
}

interface FaceLandmarkerOptions {
  baseOptions: {
    modelAssetPath: string;
    delegate: 'GPU' | 'CPU';
  };
  runningMode: 'IMAGE' | 'VIDEO';
  numFaces: number;
  minFaceDetectionConfidence: number;
  minFacePresenceConfidence: number;
  outputFaceBlendshapes: boolean;
  outputFacialTransformationMatrixes: boolean;
}

export interface FaceLandmarkerResult {
  faceLandmarks: NormalizedLandmark[][];
  facialTransformationMatrixes?: { data: Float32Array }[];
}

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface FaceLandmarkerInstance {
  detectForVideo(
    video: HTMLVideoElement,
    timestampMs: number,
  ): FaceLandmarkerResult;
  close(): void;
}

// ---------------------------------------------------------------------------
// CDN constants
// ---------------------------------------------------------------------------

const MEDIAPIPE_VERSION = '0.10.14';
const CDN_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`;
const BUNDLE_URL = `${CDN_BASE}/vision_bundle.js`;
const WASM_URL = `${CDN_BASE}/wasm`;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// ---------------------------------------------------------------------------
// Script injection loader
// ---------------------------------------------------------------------------

/**
 * Injects the MediaPipe Tasks Vision CDN bundle as a script tag.
 * Resolves with the module reference attached to `window.__mediapipeVision`.
 * Subsequent calls return the cached reference immediately.
 */
export async function loadMediaPipeVision(): Promise<MediaPipeVisionModule> {
  if (typeof window === 'undefined') {
    throw new Error('loadMediaPipeVision must be called in a browser environment');
  }

  if (window.__mediapipeVision) {
    return window.__mediapipeVision;
  }

  return new Promise<MediaPipeVisionModule>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-mediapipe-vision]`,
    );

    const handleLoad = () => {
      // The CDN bundle exposes the module as window.vision or window.mediapipeTasksVision
      const mod =
        (window as Window & typeof globalThis & { vision?: MediaPipeVisionModule; mediapipeTasksVision?: MediaPipeVisionModule }).vision ||
        (window as Window & typeof globalThis & { mediapipeTasksVision?: MediaPipeVisionModule }).mediapipeTasksVision;

      if (mod?.FaceLandmarker && mod?.FilesetResolver) {
        window.__mediapipeVision = mod;
        resolve(mod);
      } else {
        reject(new Error('MediaPipe Vision loaded but FaceLandmarker not found on window'));
      }
    };

    if (existing) {
      // Script tag already injected — wait for window property
      if (window.__mediapipeVision) {
        resolve(window.__mediapipeVision);
      } else {
        existing.addEventListener('load', handleLoad, { once: true });
        existing.addEventListener('error', () => reject(new Error('MediaPipe Vision script already failed')), { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = BUNDLE_URL;
    script.setAttribute('data-mediapipe-vision', 'true');
    script.crossOrigin = 'anonymous';

    script.onload = handleLoad;
    script.onerror = () => reject(new Error('Failed to load MediaPipe Vision from CDN'));

    document.head.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// FaceLandmarker singleton
// ---------------------------------------------------------------------------

/**
 * Loads and returns a singleton FaceLandmarker instance configured for
 * real-time video detection. The instance is cached on `window.__faceLandmarker`.
 *
 * @param config MediaPipe config from `getOptimalConfig()` or override.
 */
export async function loadFaceLandmarker(
  config: MediaPipeConfig,
): Promise<FaceLandmarkerInstance> {
  if (typeof window === 'undefined') {
    throw new Error('loadFaceLandmarker must be called in a browser environment');
  }

  if (window.__faceLandmarker) {
    return window.__faceLandmarker;
  }

  const { FaceLandmarker, FilesetResolver } = await loadMediaPipeVision();

  const filesetResolver = await FilesetResolver.forVisionTasks(WASM_URL);

  const instance = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: config.delegate,
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    minFaceDetectionConfidence: config.minDetectionConfidence,
    minFacePresenceConfidence: config.minTrackingConfidence,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: true,
  });

  window.__faceLandmarker = instance;
  return instance;
}

/**
 * Disposes the singleton FaceLandmarker and clears the cache.
 * Call this when the TryOn experience is unmounted.
 */
export function disposeFaceLandmarker(): void {
  if (typeof window === 'undefined') return;

  if (window.__faceLandmarker) {
    try {
      window.__faceLandmarker.close();
    } catch {
      // Ignore errors during cleanup
    }
    window.__faceLandmarker = undefined;
  }
}
