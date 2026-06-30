export interface DataPoint {
  timeSec: number;
  value: number;
}

export type TripSeries = Record<string, DataPoint[]>;

export interface TripFile {
  name: string;
  downloadUrl: string;
}

export interface TripMetrics {
  durationMin: number;
  totalDistanceKm: number;
  totalFuelL: number;
  efficiencyKmL: number | null;
  avgSpeedKmh: number | null;
  maxSpeedKmh: number | null;
  idleTimeSec: number;
  idleTimePct: number;
  columns: string[];
}
