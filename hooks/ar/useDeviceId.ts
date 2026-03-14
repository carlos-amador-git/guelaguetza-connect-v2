import { useState, useEffect } from 'react';

// ============================================================================
// HOOK: DEVICE ID (para usuarios anónimos)
// localStorage-based persistent device identifier
// ============================================================================

export function useDeviceId(): string {
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    let id = localStorage.getItem('ar_device_id');

    if (!id) {
      id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ar_device_id', id);
    }

    setDeviceId(id);
  }, []);

  return deviceId;
}
