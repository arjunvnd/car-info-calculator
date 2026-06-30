import { useState } from "react";
import { useTripFiles, useTripData } from "./hooks/useTripData";
import { SummaryCards } from "./components/SummaryCards";
import { MultiChannelChart } from "./components/MultiChannelChart";
import { AggregateView } from "./components/AggregateView";
import type { TripFile } from "./types";
import "./App.css";

const IS_CONFIGURED =
  !!(import.meta.env.VITE_GITHUB_OWNER as string) &&
  !!(import.meta.env.VITE_GITHUB_REPO as string);

function formatTripOption(name: string): string {
  const base = name.replace(".csv", "");
  const [datePart, timePart] = base.split(" ");
  if (!datePart || !timePart) return base;
  const [y, m, d] = datePart.split("-");
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
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}  —  ${h}:${min}`;
}

function SetupGuide() {
  return (
    <div className="setup-guide">
      <div className="setup-card">
        <div className="setup-icon">⚡</div>
        <h2>OBD2 Dashboard</h2>
        <p>
          Create a <code>.env</code> file in the project root:
        </p>
        <pre>{`VITE_GITHUB_OWNER=your-github-username\nVITE_GITHUB_REPO=car-info-calculator\nVITE_GITHUB_BRANCH=main`}</pre>
        <p>
          Then place your Torque Pro CSV exports in the <code>data/</code>{" "}
          folder and push to GitHub. The app will auto-discover all trips.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const { files, loading: filesLoading, error: filesError } = useTripFiles();
  const [selectedFile, setSelectedFile] = useState<TripFile | null>(null);
  const [activeTab, setActiveTab] = useState<"trip" | "compare">("trip");
  const {
    series,
    metrics,
    loading: dataLoading,
    error: dataError,
  } = useTripData(selectedFile);

  if (!IS_CONFIGURED) return <SetupGuide />;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="header-icon">⚡</span>
          <h1>OBD2 Dashboard</h1>
        </div>
        <span className="header-car">2013 Santro Xing</span>
      </header>

      <div className="app-controls">
        <div className="selector-wrap">
          {filesLoading && <span className="status-text">Loading trips…</span>}
          {filesError && <span className="status-error">⚠ {filesError}</span>}
          {!filesLoading && !filesError && (
            <select
              className="trip-select"
              value={selectedFile?.name ?? ""}
              onChange={(e) => {
                const f = files.find((x) => x.name === e.target.value) ?? null;
                setSelectedFile(f);
              }}
            >
              <option value="">— Select a trip —</option>
              {files.map((f) => (
                <option key={f.name} value={f.name}>
                  {formatTripOption(f.name)}
                </option>
              ))}
            </select>
          )}
        </div>
        <nav className="tab-nav">
          <button
            className={`tab${activeTab === "trip" ? " active" : ""}`}
            onClick={() => setActiveTab("trip")}
          >
            Trip Analysis
          </button>
          <button
            className={`tab${activeTab === "compare" ? " active" : ""}`}
            onClick={() => setActiveTab("compare")}
          >
            Compare Trips
          </button>
        </nav>
      </div>

      <main className="app-main">
        {activeTab === "trip" && (
          <>
            {dataLoading && (
              <div className="loading-spinner">Loading trip data…</div>
            )}
            {dataError && <div className="error-msg">⚠ {dataError}</div>}
            {!selectedFile && !dataLoading && (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <p>
                  Select a trip from the dropdown to view analysis and graphs.
                </p>
              </div>
            )}
            {metrics && series && !dataLoading && (
              <>
                <SummaryCards metrics={metrics} />
                <MultiChannelChart series={series} />
              </>
            )}
          </>
        )}
        {activeTab === "compare" && <AggregateView files={files} />}
      </main>
    </div>
  );
}
