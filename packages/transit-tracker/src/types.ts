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
