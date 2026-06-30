import type { DataPoint, TripSeries, TripMetrics } from "../types";

const SPEED_COL = "Vehicle speed (km/h)";
const DIST_COL = "Distance travelled (km)";
const FUEL_COL = "Fuel used (L)";
const AVG_SPEED_COL = "Average speed (km/h)";
const IDLE_GAP_THRESHOLD_SEC = 30;

function last(pts: DataPoint[]): number | null {
  return pts.length > 0 ? pts[pts.length - 1].value : null;
}
function first(pts: DataPoint[]): number | null {
  return pts.length > 0 ? pts[0].value : null;
}

export function computeMetrics(series: TripSeries): TripMetrics {
  const columns = Object.keys(series);

  let maxTimeSec = 0;
  for (const col of columns) {
    const pts = series[col];
    if (pts && pts.length > 0) {
      maxTimeSec = Math.max(maxTimeSec, pts[pts.length - 1].timeSec);
    }
  }

  const distSeries = series[DIST_COL] ?? [];
  const totalDistanceKm = Math.max(
    0,
    (last(distSeries) ?? 0) - (first(distSeries) ?? 0),
  );

  const fuelSeries = series[FUEL_COL] ?? [];
  const totalFuelL = Math.max(
    0,
    (last(fuelSeries) ?? 0) - (first(fuelSeries) ?? 0),
  );

  const efficiencyKmL =
    totalFuelL > 0.001 ? totalDistanceKm / totalFuelL : null;

  const speedSeries = series[SPEED_COL] ?? [];
  const maxSpeedKmh =
    speedSeries.length > 0
      ? speedSeries.reduce((m, p) => Math.max(m, p.value), -Infinity)
      : null;

  let avgSpeedKmh: number | null = null;
  const avgSpeedSeries = series[AVG_SPEED_COL] ?? [];
  if (avgSpeedSeries.length > 0) {
    avgSpeedKmh = last(avgSpeedSeries);
  } else if (speedSeries.length > 0) {
    const movingPts = speedSeries.filter((p) => p.value > 0);
    avgSpeedKmh =
      movingPts.length > 0
        ? movingPts.reduce((s, p) => s + p.value, 0) / movingPts.length
        : 0;
  }

  let idleTimeSec = 0;
  for (let i = 1; i < speedSeries.length; i++) {
    const prev = speedSeries[i - 1];
    const curr = speedSeries[i];
    const gapSec = curr.timeSec - prev.timeSec;
    if (
      prev.value === 0 &&
      curr.value === 0 &&
      gapSec < IDLE_GAP_THRESHOLD_SEC
    ) {
      idleTimeSec += gapSec;
    }
  }

  const idleTimePct = maxTimeSec > 0 ? (idleTimeSec / maxTimeSec) * 100 : 0;

  return {
    durationMin: maxTimeSec / 60,
    totalDistanceKm,
    totalFuelL,
    efficiencyKmL,
    avgSpeedKmh,
    maxSpeedKmh,
    idleTimeSec,
    idleTimePct,
    columns,
  };
}
