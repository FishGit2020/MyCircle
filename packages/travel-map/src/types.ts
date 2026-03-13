export type PinType = 'lived' | 'visited' | 'wishlist';

export interface TravelPin {
  id: string;
  type: PinType;
  name: string;
  notes?: string;
  dateRange?: { start: string; end: string };
  lat: number;
  lon: number;
  createdAt: number;
}

export const PIN_COLORS: Record<PinType, string> = {
  lived: '#ef4444',    // red
  visited: '#3b82f6',  // blue
  wishlist: '#eab308', // gold/yellow
};
