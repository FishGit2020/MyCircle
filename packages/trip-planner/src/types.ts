export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes: string;
  budget: number;
  currency: string;
  itinerary: ItineraryDay[];
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
