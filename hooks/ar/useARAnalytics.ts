// ============================================================================
// useARAnalytics — Sprint 4.2
// Batched event tracking hook for the AR module.
// Events are queued in memory and flushed every 30 s or on page unload.
// ============================================================================

import { useRef, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type AREventType =
  | 'ar_home_open'
  | 'ar_point_view'
  | 'ar_point_collect'
  | 'ar_model_view'
  | 'ar_model_ar_launch'
  | 'ar_quest_start'
  | 'ar_quest_complete'
  | 'ar_vestimenta_view'
  | 'ar_vestimenta_tryon'
  | 'ar_alebrije_draw'
  | 'ar_alebrije_generate';

export interface ARAnalyticsEvent {
  eventType: AREventType;
  userId?: string;
  pointId?: number;
  metadata?: Record<string, unknown>;
}

export interface UseARAnalyticsReturn {
  /** Queue an analytics event for batch delivery. */
  track: (eventType: AREventType, metadata?: Record<string, unknown>) => void;
  /** Immediately flush all queued events (useful before navigation). */
  flush: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE = ((import.meta as unknown as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || 'http://localhost:3001') + '/api';
const FLUSH_INTERVAL_MS = 30_000;
const MAX_BATCH_SIZE = 50;

// ============================================================================
// HOOK
// ============================================================================

/**
 * useARAnalytics
 *
 * Usage:
 *   const { track } = useARAnalytics(user?.id ?? null);
 *   track('ar_home_open');
 *   track('ar_point_view', { pointId: 42, region: 'Sierra Norte' });
 */
export function useARAnalytics(userId: string | null): UseARAnalyticsReturn {
  // Queue stored as a ref so mutations don't trigger re-renders
  const queueRef = useRef<ARAnalyticsEvent[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef(userId);

  // Keep userId ref current
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // ── Flush function ─────────────────────────────────────────────────────────
  const flush = useCallback(() => {
    if (queueRef.current.length === 0) return;

    const batch = queueRef.current.splice(0, MAX_BATCH_SIZE);

    // Fire-and-forget; ignore errors to never block the UI
    fetch(`${API_BASE}/ar/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      // keepalive allows the request to outlive the page
      keepalive: true,
    }).catch(() => {
      // Silently ignore network failures — analytics are best-effort
    });
  }, []);

  // ── Track function ─────────────────────────────────────────────────────────
  const track = useCallback(
    (eventType: AREventType, metadata?: Record<string, unknown>) => {
      const event: ARAnalyticsEvent = {
        eventType,
        userId: userIdRef.current ?? undefined,
        metadata,
      };
      queueRef.current.push(event);

      // Auto-flush if batch is large enough
      if (queueRef.current.length >= MAX_BATCH_SIZE) {
        flush();
      }
    },
    [flush]
  );

  // ── Periodic flush ─────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(flush, FLUSH_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [flush]);

  // ── Flush on page unload (visibilitychange + beforeunload) ─────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    const handleBeforeUnload = () => flush();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Flush any remaining events on unmount
      flush();
    };
  }, [flush]);

  return { track, flush };
}

export default useARAnalytics;
