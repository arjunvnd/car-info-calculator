import { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TripSeries, DataPoint } from "../types";

export const CHART_COLORS = [
  "#4ade80",
  "#60a5fa",
  "#f472b6",
  "#fb923c",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#f87171",
];

const COLUMN_GROUP: Record<string, string> = {
  "Vehicle speed (km/h)": "Speed",
  "Average speed (km/h)": "Speed",
  "Vehicle acceleration (g)": "Speed",
  "Distance travelled (km)": "Speed",
  "Engine RPM (rpm)": "Engine",
  "Engine RPM x1000 (rpm)": "Engine",
  "Engine coolant temperature (℃)": "Engine",
  "Calculated engine load value (%)": "Engine",
  "Timing advance (°)": "Engine",
  "Intake air temperature (℃)": "Engine",
  "Intake manifold absolute pressure (kPa)": "Engine",
  "Calculated instant fuel rate (L/h)": "Fuel",
  "Average fuel consumption 10 sec (km/L)": "Fuel",
  "Average fuel consumption (km/L)": "Fuel",
  "Calculated instant fuel consumption (km/L)": "Fuel",
  "Fuel used (L)": "Fuel",
  "Instant engine power (based on fuel consumption) (hp)": "Fuel",
  "Short term fuel % trim - Bank 1 (%)": "O2 & Trim",
  "Long term fuel % trim - Bank 1 (%)": "O2 & Trim",
  "Oxygen sensor 1 Bank 1 Voltage (V)": "O2 & Trim",
  "Oxygen sensor 2 Bank 1 Voltage (V)": "O2 & Trim",
  "Oxygen sensor 1 Bank 1 Short term fuel trim (%)": "O2 & Trim",
  "Throttle position (%)": "Controls",
  "OBD Module Voltage (V)": "Controls",
  "Calculated boost (bar)": "Controls",
  "Fuel economizer (based on fuel system status and throttle position) ()":
    "Controls",
};

const DEFAULT_CHANNELS = [
  "Vehicle speed (km/h)",
  "Engine RPM (rpm)",
  "Calculated instant fuel rate (L/h)",
  "Engine coolant temperature (℃)",
];

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function cleanLabel(col: string): string {
  return col.replace(/\s*\([^)]*\)\s*$/, "").trim() || col;
}

function resampleWithGaps(
  series: DataPoint[],
  maxTimeSec: number,
  stepSec = 1,
  maxGapSec = 30,
): { timeSec: number; value: number | null }[] {
  if (series.length === 0) return [];
  const result: { timeSec: number; value: number | null }[] = [];
  let idx = 0;
  let lastTimeSec = -Infinity;
  let lastValue: number | null = null;

  for (let t = 0; t <= maxTimeSec + stepSec; t += stepSec) {
    while (idx < series.length && series[idx].timeSec <= t) {
      lastTimeSec = series[idx].timeSec;
      lastValue = series[idx].value;
      idx++;
    }
    result.push({
      timeSec: t,
      value:
        lastValue !== null && t - lastTimeSec <= maxGapSec ? lastValue : null,
    });
  }
  return result;
}

interface SingleChartProps {
  channel: string;
  data: DataPoint[];
  color: string;
  maxTimeSec: number;
}

function SingleChannelChart({
  channel,
  data,
  color,
  maxTimeSec,
}: SingleChartProps) {
  const chartData = useMemo(
    () => resampleWithGaps(data, maxTimeSec),
    [data, maxTimeSec],
  );

  const yMin = data.reduce((m, p) => Math.min(m, p.value), Infinity);
  const yMax = data.reduce((m, p) => Math.max(m, p.value), -Infinity);
  const pad = (isFinite(yMax - yMin) ? (yMax - yMin) * 0.1 : 0) || 1;

  return (
    <div className="channel-chart">
      <div className="channel-chart-label" style={{ color }}>
        {channel}
      </div>
      <ResponsiveContainer width="100%" height={145}>
        <LineChart
          data={chartData}
          syncId="trip-sync"
          margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke="#2a2a3a" vertical={false} />
          <XAxis
            dataKey="timeSec"
            type="number"
            domain={[0, maxTimeSec]}
            tickFormatter={formatTime}
            tickCount={7}
            tick={{ fontSize: 10, fill: "#64748b" }}
            axisLine={{ stroke: "#2a2a3a" }}
            tickLine={false}
          />
          <YAxis
            width={58}
            domain={[yMin - pad, yMax + pad]}
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
            }}
            labelFormatter={(t: number | string) =>
              `⏱ ${formatTime(typeof t === "number" ? t : parseFloat(String(t)))}`
            }
            formatter={(v: unknown) => [
              typeof v === "number" ? v.toFixed(3) : "—",
              cleanLabel(channel),
            ]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface Props {
  series: TripSeries;
}

export function MultiChannelChart({ series }: Props) {
  const allColumns = useMemo(() => Object.keys(series), [series]);

  const maxTimeSec = useMemo(() => {
    let max = 0;
    for (const col of allColumns) {
      const pts = series[col];
      if (pts && pts.length > 0)
        max = Math.max(max, pts[pts.length - 1].timeSec);
    }
    return max;
  }, [series, allColumns]);

  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const valid = DEFAULT_CHANNELS.filter((c) => allColumns.includes(c));
    setSelected(valid.length > 0 ? valid : allColumns.slice(0, 4));
  }, [allColumns]);

  const grouped = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const col of allColumns) {
      const group = COLUMN_GROUP[col] ?? "Other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(col);
    }
    return groups;
  }, [allColumns]);

  function toggleChannel(col: string) {
    setSelected((prev) =>
      prev.includes(col)
        ? prev.filter((c) => c !== col)
        : prev.length < 8
          ? [...prev, col]
          : prev,
    );
  }

  return (
    <div className="multi-channel-chart">
      <aside className="channel-sidebar">
        <div className="sidebar-header">
          <span>Channels</span>
          <span className="sidebar-hint">{selected.length}/8</span>
        </div>
        {Object.entries(grouped).map(([group, cols]) => (
          <div key={group} className="channel-group">
            <div className="channel-group-title">{group}</div>
            {cols.map((col) => {
              const isSelected = selected.includes(col);
              const colorIdx = selected.indexOf(col);
              const isDisabled = !isSelected && selected.length >= 8;
              return (
                <label
                  key={col}
                  className={`channel-item${isSelected ? " selected" : ""}${isDisabled ? " disabled" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => toggleChannel(col)}
                    style={{
                      accentColor: isSelected
                        ? CHART_COLORS[colorIdx]
                        : "#64748b",
                    }}
                  />
                  <span
                    className="channel-name"
                    title={col}
                    style={{
                      color: isSelected ? CHART_COLORS[colorIdx] : undefined,
                    }}
                  >
                    {cleanLabel(col)}
                  </span>
                </label>
              );
            })}
          </div>
        ))}
      </aside>

      <div className="charts-stack">
        {selected.length === 0 && (
          <div className="empty-state">
            Select channels from the sidebar to plot graphs
          </div>
        )}
        {selected.map((col, idx) =>
          series[col] ? (
            <SingleChannelChart
              key={col}
              channel={col}
              data={series[col]}
              color={CHART_COLORS[idx % CHART_COLORS.length]}
              maxTimeSec={maxTimeSec}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}
