import { useEffect, useRef, useState } from 'react';
import type maplibregl from 'maplibre-gl';

const DEFAULT_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export interface UseMapLibreOptions {
  center?: [number, number];
  zoom?: number;
  style?: string;
  preserveDrawingBuffer?: boolean;
  maxPitch?: number;
  interactive?: boolean;
}

/**
 * Hook that handles the common MapLibre GL map initialization pattern:
 * - Dynamic import of maplibre-gl + CSS
 * - Container ref management
 * - ResizeObserver setup/cleanup
 * - Map creation with configurable options
 * - Cleanup on unmount (map.remove())
 *
 * Returns `{ map, mapReady }` where `map` is the MapLibre Map instance or null.
 *
 * All GL operations are wrapped in try/catch per project conventions.
 */
export function useMapLibre(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options?: UseMapLibreOptions,
): { map: maplibregl.Map | null; mapReady: boolean } {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Stable reference to options to avoid re-creating the map on every render.
  // The map is created once; callers use map methods (flyTo, setStyle, etc.) to update.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!containerRef.current) return;

    let map: maplibregl.Map | undefined;
    let ro: ResizeObserver | undefined;
    let cancelled = false;

    import('maplibre-gl').then(({ default: ml }) => {
      if (cancelled || !containerRef.current) return;

      // Dynamically load CSS — ignore if it fails (e.g. SSR or already loaded)
      // @ts-expect-error — CSS module has no type declaration
      import('maplibre-gl/dist/maplibre-gl.css').catch(() => {});

      const opts = optionsRef.current;
      map = new ml.Map({
        container: containerRef.current,
        style: opts?.style ?? DEFAULT_STYLE,
        center: opts?.center ?? [0, 20],
        zoom: opts?.zoom ?? 2,
        interactive: opts?.interactive ?? true,
        maxPitch: opts?.maxPitch,
        canvasContextAttributes: {
          preserveDrawingBuffer: opts?.preserveDrawingBuffer ?? true,
        },
      });

      map.on('load', () => {
        if (cancelled) return;
        mapRef.current = map!;
        setMapReady(true);
        try {
          map!.resize();
        } catch {
          // Map may have been destroyed
        }
      });

      // Keep canvas sized to container on orientation/layout changes
      ro = new ResizeObserver(() => {
        try {
          mapRef.current?.resize();
        } catch {
          // Map may have been destroyed
        }
      });
      if (containerRef.current) ro.observe(containerRef.current);
    });

    return () => {
      cancelled = true;
      ro?.disconnect();
      // Null the ref FIRST so any in-flight ResizeObserver / style callbacks
      // that fire during map.remove() won't try to use a half-torn-down map.
      const m = mapRef.current;
      mapRef.current = null;
      setMapReady(false);
      try {
        if (m) m.remove();
        else if (map) map.remove();
      } catch {
        // Safari + MapLibre: map.remove() clears this.style mid-teardown;
        // any pending passive effect that calls map.getLayer() after that
        // throws "undefined is not an object". Swallowing is safe — the map
        // is being destroyed anyway.
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { map: mapRef.current, mapReady };
}
