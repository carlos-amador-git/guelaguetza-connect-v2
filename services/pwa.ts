// PWA Service - Registration and utilities

export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        if (import.meta.env.DEV) console.log('[PWA] Service Worker registered:', registration.scope);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              window.dispatchEvent(new CustomEvent('swUpdate', { detail: registration }));
            }
          });
        });
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    });
  }
}

export function checkOnlineStatus(): boolean {
  return navigator.onLine;
}

export function subscribeToOnlineStatus(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

export function subscribeToSWUpdate(callback: (registration: ServiceWorkerRegistration) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<ServiceWorkerRegistration>;
    callback(customEvent.detail);
  };

  window.addEventListener('swUpdate', handler);
  return () => window.removeEventListener('swUpdate', handler);
}

export async function skipWaiting(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}
