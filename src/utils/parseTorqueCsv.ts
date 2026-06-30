import Papa from "papaparse";
import type { DataPoint, TripSeries } from "../types";

function timeToMs(t: string): number {
  const parts = t.trim().split(":");
  if (parts.length !== 3) return 0;
  const [h, m, secPart] = parts;
  const [s, msStr = "0"] = secPart.split(".");
  return (
    parseInt(h, 10) * 3_600_000 +
    parseInt(m, 10) * 60_000 +
    parseInt(s, 10) * 1_000 +
    parseInt(msStr.padEnd(3, "0").slice(0, 3), 10)
  );
}

export function parseTorqueCsv(csvText: string): TripSeries {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const rows = parsed.data;
  if (rows.length === 0) return {};

  const startMs = timeToMs(rows[0]["time"] ?? "");
  const series: TripSeries = {};

  for (const row of rows) {
    const timeStr = row["time"];
    if (!timeStr?.trim()) continue;

    const rawMs = timeToMs(timeStr);
    // Handle midnight rollover
    const adjustedMs = rawMs < startMs ? rawMs + 86_400_000 : rawMs;
    const timeSec = (adjustedMs - startMs) / 1000;

    for (const [col, raw] of Object.entries(row)) {
      if (!col || col === "time") continue;
      if (!raw?.trim()) continue;
      const value = parseFloat(raw);
      if (!isFinite(value)) continue;

      if (!series[col]) series[col] = [];
      (series[col] as DataPoint[]).push({ timeSec, value });
    }
  }

  return series;
}
