export type TripStatus = 'planning' | 'confirmed' | 'completed' | 'cancelled';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Ticket {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'boat' | 'other';
  description: string;
  date: string;
  cost?: number;
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes: string;
  budget: number;
  currency: string;
  lat?: number;
  lon?: number;
  itinerary: ItineraryDay[];
  tickets?: Ticket[];
  checklist?: ChecklistItem[];
  status?: TripStatus;
  createdAt: number;
  updatedAt: number;
}

export interface ItineraryDay {
  date: string;
  activities: Activity[];
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  location: string;
  notes: string;
  cost: number;
}
