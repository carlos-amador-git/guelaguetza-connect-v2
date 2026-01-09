/**
 * Haptic Feedback Utilities for Guelaguetza Connect
 *
 * Provides haptic feedback for touch interactions using the Vibration API.
 * Falls back gracefully on devices that don't support vibration.
 */

export type HapticType =
  | 'light'        // Quick, subtle feedback
  | 'medium'       // Standard feedback
  | 'heavy'        // Strong feedback
  | 'success'      // Success pattern
  | 'error'        // Error pattern
  | 'warning'      // Warning pattern
  | 'selection'    // Selection change
  | 'impact'       // Button press
  | 'notification' // Notification arrival
  | 'custom';      // Custom pattern

// Vibration patterns in milliseconds
const HAPTIC_PATTERNS: Record<Exclude<HapticType, 'custom'>, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],         // Quick double tap
  error: [50, 100, 50, 100, 50], // Triple buzz
  warning: [30, 50, 30],         // Double buzz
  selection: 5,                   // Very quick
  impact: 15,                     // Standard button press
  notification: [10, 100, 10, 100], // Notification pattern
};

/**
 * Check if the device supports haptic feedback
 */
export const supportsHaptics = (): boolean => {
  return 'vibrate' in navigator;
};

/**
 * Trigger haptic feedback
 *
 * @param type - The type of haptic feedback
 * @param pattern - Custom pattern (only used when type is 'custom')
 */
export const triggerHaptic = (
  type: HapticType = 'light',
  pattern?: number | number[]
): void => {
  if (!supportsHaptics()) return;

  try {
    if (type === 'custom' && pattern) {
      navigator.vibrate(pattern);
    } else if (type !== 'custom') {
      navigator.vibrate(HAPTIC_PATTERNS[type]);
    }
  } catch (error) {
    // Silently fail - haptics are not critical
    console.debug('Haptic feedback failed:', error);
  }
};

/**
 * Cancel any ongoing vibration
 */
export const cancelHaptic = (): void => {
  if (supportsHaptics()) {
    navigator.vibrate(0);
  }
};

/**
 * React hook for haptic feedback
 */
import { useCallback, useMemo } from 'react';

export const useHaptics = () => {
  const isSupported = useMemo(() => supportsHaptics(), []);

  const haptic = useCallback((type: HapticType = 'light', pattern?: number | number[]) => {
    triggerHaptic(type, pattern);
  }, []);

  const light = useCallback(() => haptic('light'), [haptic]);
  const medium = useCallback(() => haptic('medium'), [haptic]);
  const heavy = useCallback(() => haptic('heavy'), [haptic]);
  const success = useCallback(() => haptic('success'), [haptic]);
  const error = useCallback(() => haptic('error'), [haptic]);
  const warning = useCallback(() => haptic('warning'), [haptic]);
  const selection = useCallback(() => haptic('selection'), [haptic]);
  const impact = useCallback(() => haptic('impact'), [haptic]);
  const notification = useCallback(() => haptic('notification'), [haptic]);
  const cancel = useCallback(() => cancelHaptic(), []);

  return {
    isSupported,
    haptic,
    light,
    medium,
    heavy,
    success,
    error,
    warning,
    selection,
    impact,
    notification,
    cancel,
  };
};

/**
 * Higher-order function to add haptic feedback to an event handler
 *
 * @example
 * <button onClick={withHaptic(() => doSomething(), 'impact')}>Click me</button>
 */
export const withHaptic = <T extends (...args: unknown[]) => unknown>(
  handler: T,
  type: HapticType = 'light'
): ((...args: Parameters<T>) => ReturnType<T>) => {
  return (...args: Parameters<T>): ReturnType<T> => {
    triggerHaptic(type);
    return handler(...args) as ReturnType<T>;
  };
};

/**
 * Create a button click handler with haptic feedback
 *
 * @example
 * <button onClick={createHapticHandler(handleClick)}>Click me</button>
 */
export const createHapticHandler = (
  onClick?: () => void,
  hapticType: HapticType = 'impact'
) => {
  return () => {
    triggerHaptic(hapticType);
    onClick?.();
  };
};

/**
 * Haptic feedback for specific UI interactions
 */
export const hapticFeedback = {
  // Navigation
  tabChange: () => triggerHaptic('selection'),
  pageTransition: () => triggerHaptic('light'),
  backNavigation: () => triggerHaptic('light'),

  // Actions
  buttonPress: () => triggerHaptic('impact'),
  longPress: () => triggerHaptic('medium'),
  toggle: () => triggerHaptic('selection'),
  slider: () => triggerHaptic('light'),

  // Gestures
  swipeAction: () => triggerHaptic('medium'),
  pullToRefresh: () => triggerHaptic('light'),
  dragStart: () => triggerHaptic('light'),
  dragEnd: () => triggerHaptic('medium'),

  // Feedback
  success: () => triggerHaptic('success'),
  error: () => triggerHaptic('error'),
  warning: () => triggerHaptic('warning'),

  // Lists
  itemSelect: () => triggerHaptic('selection'),
  itemDelete: () => triggerHaptic('heavy'),
  reorder: () => triggerHaptic('light'),

  // Forms
  formSubmit: () => triggerHaptic('impact'),
  validationError: () => triggerHaptic('error'),
  inputFocus: () => triggerHaptic('light'),

  // Notifications
  notificationReceived: () => triggerHaptic('notification'),
  messageReceived: () => triggerHaptic('light'),

  // Custom
  custom: (pattern: number | number[]) => triggerHaptic('custom', pattern),
};

export default hapticFeedback;
