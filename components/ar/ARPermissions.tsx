import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';

// ============================================================================
// COMPONENT: ARPermissions
// Geolocation permission onboarding overlay for the AR module.
// Shown before the map when permission is not yet granted.
// Handles iOS Safari quirks (permissions API absent or always 'prompt').
// ============================================================================

type PermissionState = 'checking' | 'granted' | 'denied' | 'prompt' | 'unavailable';

interface ARPermissionsProps {
  /** Called when permission is granted or the user chooses to skip. */
  onReady: (hasLocation: boolean) => void;
}

export function ARPermissions({ onReady }: ARPermissionsProps) {
  const [state, setState] = useState<PermissionState>('checking');
  const [isRequesting, setIsRequesting] = useState(false);

  // On mount, check current permission state without triggering a browser prompt.
  useEffect(() => {
    let cancelled = false;

    async function checkPermission() {
      if (!navigator.geolocation) {
        if (!cancelled) setState('unavailable');
        return;
      }

      // Permissions API is not available in all browsers (notably iOS Safari < 16).
      // Fall back to 'prompt' so we always show the friendly UI.
      if (!navigator.permissions) {
        if (!cancelled) setState('prompt');
        return;
      }

      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        if (cancelled) return;

        if (result.state === 'granted') {
          // Already granted — skip overlay entirely.
          onReady(true);
        } else {
          setState(result.state as PermissionState);
        }

        // Listen for live changes (user may flip in Settings while page is open).
        result.addEventListener('change', () => {
          if (result.state === 'granted') {
            onReady(true);
          } else {
            setState(result.state as PermissionState);
          }
        });
      } catch {
        // Permissions API threw (e.g., Firefox private mode) — show prompt UI.
        if (!cancelled) setState('prompt');
      }
    }

    checkPermission();
    return () => {
      cancelled = true;
    };
  }, [onReady]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleActivar() {
    if (!navigator.geolocation) {
      setState('unavailable');
      return;
    }

    setIsRequesting(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setIsRequesting(false);
        onReady(true);
      },
      () => {
        setIsRequesting(false);
        setState('denied');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleSkip() {
    onReady(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // While checking we render nothing (avoid flash).
  if (state === 'checking') {
    return null;
  }

  // Denied state — different copy, no "Activar" button (browser blocks re-request).
  if (state === 'denied') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ar-perms-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
          </div>

          <h2
            id="ar-perms-title"
            className="text-xl font-bold text-gray-900 mb-3"
          >
            Ubicacion bloqueada
          </h2>

          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Tu navegador bloqueo el acceso a la ubicacion. Para activarla, ve a{' '}
            <strong>Ajustes {'>'} Privacidad {'>'} Ubicacion</strong> y permite
            el acceso a esta pagina.
          </p>

          <button
            onClick={handleSkip}
            className="w-full py-3 px-6 rounded-xl bg-gray-100 text-gray-700 font-semibold
                       hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400
                       transition-colors"
          >
            Continuar sin ubicacion
          </button>
        </div>
      </div>
    );
  }

  // Unavailable state (device has no geolocation API).
  if (state === 'unavailable') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ar-perms-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-amber-500" aria-hidden="true" />
          </div>

          <h2
            id="ar-perms-title"
            className="text-xl font-bold text-gray-900 mb-3"
          >
            GPS no disponible
          </h2>

          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Tu dispositivo no soporta GPS. Puedes explorar el mapa y ver los puntos
            AR, pero no veremos tu posicion en tiempo real.
          </p>

          <button
            onClick={handleSkip}
            className="w-full py-3 px-6 rounded-xl bg-amber-500 text-white font-semibold
                       hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400
                       transition-colors"
          >
            Continuar de todas formas
          </button>
        </div>
      </div>
    );
  }

  // Default: 'prompt' state — the main onboarding CTA.
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ar-perms-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-amber-500 rounded-full
                        flex items-center justify-center mx-auto mb-6 shadow-lg">
          <MapPin className="w-10 h-10 text-white" aria-hidden="true" />
        </div>

        <h2
          id="ar-perms-title"
          className="text-2xl font-bold text-gray-900 mb-3"
        >
          Activa tu ubicacion
        </h2>

        <p className="text-sm text-gray-600 leading-relaxed mb-8">
          Para descubrir puntos AR cercanos y medir tu distancia a cada sitio
          arqueologico, necesitamos acceder a tu ubicacion.
        </p>

        {/* Primary CTA */}
        <button
          onClick={handleActivar}
          disabled={isRequesting}
          aria-busy={isRequesting}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-600 to-amber-500
                     text-white font-semibold shadow-md
                     hover:opacity-90 active:scale-95
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                     disabled:opacity-60 disabled:cursor-not-allowed
                     transition-all duration-150 mb-3"
        >
          {isRequesting ? 'Solicitando acceso...' : 'Activar ubicacion'}
        </button>

        {/* Secondary option */}
        <button
          onClick={handleSkip}
          disabled={isRequesting}
          className="w-full py-2.5 px-6 rounded-xl text-gray-500 text-sm font-medium
                     hover:text-gray-700 hover:bg-gray-50
                     focus:outline-none focus:ring-2 focus:ring-gray-300
                     disabled:opacity-60 disabled:cursor-not-allowed
                     transition-colors"
        >
          Continuar sin ubicacion
        </button>

        <p className="text-xs text-gray-400 mt-4 leading-relaxed">
          Tu ubicacion solo se usa dentro de la app y no se almacena en nuestros servidores.
        </p>
      </div>
    </div>
  );
}

export default ARPermissions;
