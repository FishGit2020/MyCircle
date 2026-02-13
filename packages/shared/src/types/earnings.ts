export interface EarningsEvent {
  date: string;
  epsActual: number | null;
  epsEstimate: number | null;
  revenueActual: number | null;
  revenueEstimate: number | null;
  symbol: string;
  hour: string | null;
  quarter: number | null;
  year: number | null;
}
