import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { fetchCsvText } from "../utils/githubApi";
import { parseTorqueCsv } from "../utils/parseTorqueCsv";
import { computeMetrics } from "../utils/computeMetrics";
import type { TripFile } from "../types";

interface TripStat {
  name: string;
  label: string;
  efficiency: number;
  distanceKm: number;
  idlePct: number;
  maxSpeed: number;
  durationMin: number;
  fuelL: number;
}

function formatLabel(filename: string): string {
  const base = filename.replace(".csv", "");
  const [datePart, timePart] = base.split(" ");
  if (!datePart || !timePart) return base;
  const [, m, d] = datePart.split("-");
  const [h, min] = timePart.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)} ${h}:${min}`;
}

interface AggBarProps {
  data: TripStat[];
  dataKey: keyof TripStat;
  title: string;
  color: string;
  unit: string;
}

function AggBar({ data, dataKey, title, color, unit }: AggBarProps) {
  return (
    <div className="agg-chart">
      <div className="agg-chart-title">{title}</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, bottom: 48, left: 0 }}
        >
          <CartesianGrid stroke="#2a2a3a" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#64748b" }}
            angle={-40}
            textAnchor="end"
            interval={0}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            width={48}
            tick={{ fontSize: 10, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1e1e2e",
              border: "1px solid #2a2a3a",
              borderRadius: 6,
              fontSize: 12,
              color: "#e2e8f0",
            }}
            labelStyle={{ color: "#e2e8f0" }}
            itemStyle={{ color: "#e2e8f0" }}
            formatter={(v: unknown) => [
              typeof v === "number" ? `${v.toFixed(2)} ${unit}` : "—",
              title,
            ]}
          />
          <Bar dataKey={dataKey as string} radius={[3, 3, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface Props {
  files: TripFile[];
}

export function AggregateView({ files }: Props) {
  const [stats, setStats] = useState<TripStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  async function loadAll() {
    setLoading(true);
    setProgress(0);
    const results: TripStat[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const text = await fetchCsvText(files[i].downloadUrl);
        const s = parseTorqueCsv(text);
        const m = computeMetrics(s);
        results.push({
          name: files[i].name,
          label: formatLabel(files[i].name),
          efficiency: m.efficiencyKmL ?? 0,
          distanceKm: m.totalDistanceKm,
          idlePct: m.idleTimePct,
          maxSpeed: m.maxSpeedKmh ?? 0,
          durationMin: m.durationMin,
          fuelL: m.totalFuelL,
        });
      } catch {
        // skip files that fail to parse
      }
      setProgress(i + 1);
    }

    setStats(results.sort((a, b) => a.name.localeCompare(b.name)));
    setLoaded(true);
    setLoading(false);
  }

  if (!loaded) {
    return (
      <div className="agg-empty">
        <p>Compare all your trips side by side.</p>
        {loading ? (
          <div>
            <div className="loading-bar">
              <div
                className="loading-bar-fill"
                style={{
                  width: `${(progress / Math.max(files.length, 1)) * 100}%`,
                }}
              />
            </div>
            <p className="loading-text">
              Loading {progress}/{files.length} trips…
            </p>
          </div>
        ) : (
          <button
            className="load-btn"
            onClick={loadAll}
            disabled={files.length === 0}
          >
            Load {files.length} Trip{files.length !== 1 ? "s" : ""}
          </button>
        )}
      </div>
    );
  }

  if (stats.length === 0) {
    return <div className="empty-state">No trip data could be loaded.</div>;
  }

  return (
    <div className="aggregate-view">
      <div className="agg-grid">
        <AggBar
          data={stats}
          dataKey="efficiency"
          title="Fuel Efficiency"
          color="#4ade80"
          unit="km/L"
        />
        <AggBar
          data={stats}
          dataKey="distanceKm"
          title="Distance"
          color="#60a5fa"
          unit="km"
        />
        <AggBar
          data={stats}
          dataKey="idlePct"
          title="Idle Time"
          color="#f472b6"
          unit="%"
        />
        <AggBar
          data={stats}
          dataKey="maxSpeed"
          title="Max Speed"
          color="#fb923c"
          unit="km/h"
        />
        <AggBar
          data={stats}
          dataKey="durationMin"
          title="Duration"
          color="#a78bfa"
          unit="min"
        />
        <AggBar
          data={stats}
          dataKey="fuelL"
          title="Fuel Used"
          color="#34d399"
          unit="L"
        />
      </div>
    </div>
  );
}
