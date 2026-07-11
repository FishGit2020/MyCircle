export interface TransitRegion {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
}

export interface TransitStop {
  id: string;
  name: string;
  direction: string;
  lat: number;
  lon: number;
  routeIds: string[];
}

export interface ArrivalDeparture {
  routeId: string;
  routeShortName: string;
  routeLongName: string;
  tripHeadsign: string;
  predictedArrivalTime: number;
  scheduledArrivalTime: number;
  predicted: boolean;
  status: string;
  vehicleId: string;
  distanceFromStop: number;
  /** When true, the arrival's effective time is in the recent past (≤ 60s).
   *  UI renders a "departed" label instead of a negative-minute ETA. */
  departed?: boolean;
}

export interface RecentStopEntry {
  stopId: string;
  name: string;
  direction: string;
  routeIds: string[];
  lastSeenAt: number;
}

export interface TransitArrivalsResponse {
  stop: TransitStop;
  arrivalsAndDepartures: ArrivalDeparture[];
}

export interface NearbyStop {
  id: string;
  name: string;
  direction: string;
  lat: number;
  lon: number;
  distance: number;
}
