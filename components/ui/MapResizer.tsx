import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Component to trigger a map resize when it loads.
 * This fixes issues where tiles don't load correctly or the map is not centered
 * when the container size changes or it's rendered in a hidden tab/modal.
 */
const MapResizer = () => {
  const map = useMap();

  useEffect(() => {
    // Immediate resize
    map.invalidateSize();

    // Delayed resize to ensure container dimensions are final
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
};

export default MapResizer;
