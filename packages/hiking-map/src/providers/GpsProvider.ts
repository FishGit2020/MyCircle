export interface GpsPosition {
  lat: number;
  lng: number;
  accuracy: number; // meters
  altitude: number | null;
  heading: number | null;
}

export interface GpsProvider {
  getCurrentPosition(): Promise<GpsPosition>;
  /** Returns a function that stops watching when called. */
  watchPosition(callback: (pos: GpsPosition) => void, onError?: (err: GeolocationPositionError) => void): () => void;
}

function toGpsPosition(p: GeolocationPosition): GpsPosition {
  return {
    lat: p.coords.latitude,
    lng: p.coords.longitude,
    accuracy: p.coords.accuracy,
    altitude: p.coords.altitude,
    heading: p.coords.heading,
  };
}

export function createGpsProvider(): GpsProvider {
  return {
    getCurrentPosition(): Promise<GpsPosition> {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (p) => resolve(toGpsPosition(p)),
          (e) => reject(e),
          { enableHighAccuracy: true, timeout: 10_000 }
        );
      });
    },

    watchPosition(callback, onError) {
      if (!navigator.geolocation) return () => {};
      const id = navigator.geolocation.watchPosition(
        (p) => callback(toGpsPosition(p)),
        (e) => onError?.(e),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(id);
    },
  };
}
