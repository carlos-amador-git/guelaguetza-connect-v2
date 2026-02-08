// Push Notifications Service

const API_BASE = ((import.meta as any).env.VITE_API_URL || '') + '/api';

// VAPID public key - this should match the one in the backend
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[Push] Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('[Push] Notifications denied by user');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function subscribeToPush(token?: string): Promise<PushSubscriptionData | null> {
  if (!isPushSupported()) {
    console.warn('[Push] Push notifications not supported');
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn('[Push] VAPID public key not configured');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const p256dh = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    if (!p256dh || !auth) {
      throw new Error('Failed to get subscription keys');
    }

    const data: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(p256dh),
        auth: arrayBufferToBase64(auth),
      },
    };

    // Send subscription to backend
    await sendSubscriptionToServer(data, token);

    console.log('[Push] Successfully subscribed');
    return data;
  } catch (error) {
    console.error('[Push] Error subscribing:', error);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('[Push] Successfully unsubscribed');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Push] Error unsubscribing:', error);
    return false;
  }
}

async function sendSubscriptionToServer(
  subscription: PushSubscriptionData,
  token?: string
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/push/subscribe`, {
    method: 'POST',
    headers,
    body: JSON.stringify(subscription),
  });

  if (!response.ok) {
    throw new Error('Failed to send subscription to server');
  }
}

// Utility functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window.btoa(binary);
}
