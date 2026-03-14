/**
 * Haptic Feedback Service
 *
 * Thin wrapper over utils/haptics — single source of truth.
 * All haptic logic lives in utils/haptics.ts.
 */
export { triggerHaptic, cancelHaptic, supportsHaptics, useHaptics, withHaptic, createHapticHandler, hapticFeedback } from '../utils/haptics';

// Convenience object matching the legacy API used by Navigation, Onboarding, etc.
import { triggerHaptic } from '../utils/haptics';

const haptics = {
  tap: () => triggerHaptic('light'),
  click: () => triggerHaptic('impact'),
  success: () => triggerHaptic('success'),
  error: () => triggerHaptic('error'),
  warning: () => triggerHaptic('warning'),
  selection: () => triggerHaptic('selection'),
};

export default haptics;
