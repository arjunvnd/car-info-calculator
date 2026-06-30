import { useState, useEffect } from "react";
import { listTripFiles, fetchCsvText } from "../utils/githubApi";
import { parseTorqueCsv } from "../utils/parseTorqueCsv";
import { computeMetrics } from "../utils/computeMetrics";
import type { TripFile, TripSeries, TripMetrics } from "../types";

export function useTripFiles() {
  const [files, setFiles] = useState<TripFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const owner = import.meta.env.VITE_GITHUB_OWNER;
    const repo = import.meta.env.VITE_GITHUB_REPO;
    if (!owner || !repo) {
      setError("GitHub owner/repo not configured. Check your .env file.");
      setLoading(false);
      return;
    }
    listTripFiles()
      .then(setFiles)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { files, loading, error };
}

export function useTripData(file: TripFile | null) {
  const [series, setSeries] = useState<TripSeries | null>(null);
  const [metrics, setMetrics] = useState<TripMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setSeries(null);
      setMetrics(null);
      return;
    }
    setLoading(true);
    setError(null);
    setSeries(null);
    setMetrics(null);
    fetchCsvText(file.downloadUrl)
      .then((text) => {
        const s = parseTorqueCsv(text);
        const m = computeMetrics(s);
        setSeries(s);
        setMetrics(m);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [file]);

  return { series, metrics, loading, error };
}
