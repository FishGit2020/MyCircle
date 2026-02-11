export interface City {
  id: string;
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export interface SavedCity extends City {
  addedAt: number;
}
