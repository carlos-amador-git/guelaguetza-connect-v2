import { useState, useEffect, useCallback, useRef } from 'react';
import type { GeoPosition } from '../../types/ar';

// ============================================================================
// HOOK: GEOLOCALIZACIÓN
// ============================================================================

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

interface UseGeolocationReturn {
  position: GeoPosition | null;
  error: string | null;
  isWatching: boolean;
  isLoading: boolean;
  startWatching: () => void;
  stopWatching: () => void;
  getCurrentPosition: () => Promise<GeoPosition | null>;
}

export function useGeolocation(
  options: UseGeolocationOptions = {}
): UseGeolocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watchPosition = false,
  } = options;

  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const watchIdRef = useRef<number | null>(null);

  const geoOptions: PositionOptions = {
    enableHighAccuracy,
    timeout,
    maximumAge,
  };

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setPosition({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading ?? undefined,
      timestamp: pos.timestamp,
    });
    setError(null);
    setIsLoading(false);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    let errorMessage = 'Error de geolocalización';

    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'Permiso de ubicación denegado';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'Ubicación no disponible';
        break;
      case err.TIMEOUT:
        errorMessage = 'Tiempo de espera agotado';
        break;
    }

    setError(errorMessage);
    setIsLoading(false);
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada en este navegador');
      return;
    }

    if (watchIdRef.current !== null) return;

    setIsLoading(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geoOptions
    );
    setIsWatching(true);
  }, [handleSuccess, handleError, geoOptions]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
    }
  }, []);

  const getCurrentPosition = useCallback(async (): Promise<GeoPosition | null> => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada');
      return null;
    }

    setIsLoading(true);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPosition: GeoPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading ?? undefined,
            timestamp: pos.timestamp,
          };
          setPosition(newPosition);
          setError(null);
          setIsLoading(false);
          resolve(newPosition);
        },
        (err) => {
          handleError(err);
          resolve(null);
        },
        geoOptions
      );
    });
  }, [handleError, geoOptions]);

  // Auto-start watching if enabled
  useEffect(() => {
    if (watchPosition) {
      startWatching();
    }

    return () => {
      stopWatching();
    };
  }, [watchPosition, startWatching, stopWatching]);

  return {
    position,
    error,
    isWatching,
    isLoading,
    startWatching,
    stopWatching,
    getCurrentPosition,
  };
}
