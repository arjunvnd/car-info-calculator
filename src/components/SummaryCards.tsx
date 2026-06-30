import type { TripMetrics } from "../types";

interface Props {
  metrics: TripMetrics;
}

function fmt(n: number | null, decimals = 1): string {
  return n !== null && isFinite(n) ? n.toFixed(decimals) : "—";
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

function formatIdleTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function SummaryCards({ metrics }: Props) {
  const cards = [
    { label: "Duration", value: formatDuration(metrics.durationMin), unit: "" },
    { label: "Distance", value: fmt(metrics.totalDistanceKm, 2), unit: "km" },
    { label: "Fuel Used", value: fmt(metrics.totalFuelL, 3), unit: "L" },
    {
      label: "Efficiency",
      value: fmt(metrics.efficiencyKmL),
      unit: "km/L",
      accent: true,
    },
    { label: "Avg Speed", value: fmt(metrics.avgSpeedKmh), unit: "km/h" },
    { label: "Max Speed", value: fmt(metrics.maxSpeedKmh, 0), unit: "km/h" },
    {
      label: "Idle Time",
      value: formatIdleTime(metrics.idleTimeSec),
      unit: "",
    },
    { label: "Idle %", value: fmt(metrics.idleTimePct), unit: "%" },
  ];

  return (
    <div className="summary-cards">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`summary-card${card.accent ? " accent" : ""}`}
        >
          <span className="card-label">{card.label}</span>
          <span className="card-value">{card.value}</span>
          {card.unit && <span className="card-unit">{card.unit}</span>}
        </div>
      ))}
    </div>
  );
}
