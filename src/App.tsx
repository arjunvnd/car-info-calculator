import { useState, useRef } from "react";
import { useTripFiles, useTripData } from "./hooks/useTripData";
import { SummaryCards } from "./components/SummaryCards";
import { MultiChannelChart } from "./components/MultiChannelChart";
import { AggregateView } from "./components/AggregateView";
import { parseTorqueCsv } from "./utils/parseTorqueCsv";
import { computeMetrics } from "./utils/computeMetrics";
import { pushFileToGitHub } from "./utils/githubUpload";
import type { TripFile, TripSeries, TripMetrics } from "./types";
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

interface LocalData {
  name: string;
  rawText: string;
  series: TripSeries;
  metrics: TripMetrics;
}

interface UploadMsg {
  type: 'success' | 'error';
  text: string;
}

export default function App() {
  const { files, loading: filesLoading, error: filesError } = useTripFiles();
  const [selectedFile, setSelectedFile] = useState<TripFile | null>(null);
  const [activeTab, setActiveTab] = useState<"trip" | "compare">("trip");
  const [localData, setLocalData] = useState<LocalData | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<UploadMsg | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('obd2_gh_token') ?? '');
  const [tokenDraft, setTokenDraft] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    series: githubSeries,
    metrics: githubMetrics,
    loading: dataLoading,
    error: dataError,
  } = useTripData(selectedFile);

  const series = localData?.series ?? githubSeries;
  const metrics = localData?.metrics ?? githubMetrics;
  const activeError = localError ?? dataError;

  function handleLocalFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalError(null);
    setUploadMsg(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const s = parseTorqueCsv(text);
        const m = computeMetrics(s);
        setLocalData({ name: file.name, rawText: text, series: s, metrics: m });
        setSelectedFile(null);
        setActiveTab("trip");
      } catch {
        setLocalError("Failed to parse CSV. Make sure it is a Torque Pro export.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleUpload() {
    if (!localData || !token) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const owner = import.meta.env.VITE_GITHUB_OWNER as string;
      const repo = import.meta.env.VITE_GITHUB_REPO as string;
      const branch = (import.meta.env.VITE_GITHUB_BRANCH as string) || 'master';
      await pushFileToGitHub(owner, repo, branch, `data/${localData.name}`, localData.rawText, token);
      setUploadMsg({ type: 'success', text: `Saved to data/${localData.name}` });
    } catch (e) {
      setUploadMsg({ type: 'error', text: (e as Error).message });
    } finally {
      setUploading(false);
    }
  }

  if (!IS_CONFIGURED) return <SetupGuide />;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="header-icon">⚡</span>
          <h1>OBD2 Dashboard</h1>
        </div>
        <div className="header-right">
          <span className="header-car">2013 Santro Xing</span>
          <button
            className={`settings-btn${token ? ' has-token' : ''}`}
            onClick={() => { setTokenDraft(token); setShowSettings(true); }}
            title="Settings"
          >
            ⚙
          </button>
        </div>
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
                setLocalData(null);
                setLocalError(null);
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
        <div className="local-upload">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleLocalFile}
          />
          {localData ? (
            <div className="local-badge-wrap">
              <div className="local-badge">
                <span>📁 {localData.name}</span>
                <button
                  className="local-clear"
                  onClick={() => { setLocalData(null); setLocalError(null); setUploadMsg(null); }}
                  title="Clear local file"
                >
                  ✕
                </button>
              </div>
              {token && (
                <button
                  className={`upload-btn${uploading ? ' uploading' : ''}`}
                  onClick={handleUpload}
                  disabled={uploading}
                  title="Push this CSV into the data/ folder on GitHub"
                >
                  {uploading ? '⏳…' : '↑ Save to GitHub'}
                </button>
              )}
              {!token && (
                <button className="upload-btn-hint" onClick={() => { setTokenDraft(''); setShowSettings(true); }}>
                  Add token to upload ↗
                </button>
              )}
              {uploadMsg && (
                <span className={`upload-msg ${uploadMsg.type}`}>{uploadMsg.text}</span>
              )}
            </div>
          ) : (
            <button
              className="local-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Load a CSV from your device without uploading to GitHub"
            >
              📁 Local CSV
            </button>
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
            {activeError && <div className="error-msg">⚠ {activeError}</div>}
            {!selectedFile && !localData && !dataLoading && (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <p>
                  Select a trip from the dropdown, or load a CSV directly from
                  your device using the <strong>📁 Local CSV</strong> button.
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

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Settings</span>
              <button className="modal-close" onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <div className="modal-body">
              <label className="modal-label">GitHub Personal Access Token</label>
              <p className="modal-hint">
                Required to upload trips directly to your repo's <code>data/</code> folder.
                Create a <strong>fine-grained PAT</strong> with <strong>Contents: Write</strong>{' '}
                permission scoped to this repository only.
                The token is stored in your browser's localStorage — never in code or the repo.
              </p>
              <input
                type="password"
                className="modal-input"
                placeholder="github_pat_..."
                value={tokenDraft}
                onChange={(e) => setTokenDraft(e.target.value)}
              />
              <div className="modal-actions">
                <button
                  className="modal-save"
                  onClick={() => {
                    const t = tokenDraft.trim();
                    if (t) localStorage.setItem('obd2_gh_token', t);
                    else localStorage.removeItem('obd2_gh_token');
                    setToken(t);
                    setShowSettings(false);
                  }}
                >
                  Save
                </button>
                {token && (
                  <button
                    className="modal-clear-token"
                    onClick={() => {
                      localStorage.removeItem('obd2_gh_token');
                      setToken('');
                      setTokenDraft('');
                      setShowSettings(false);
                    }}
                  >
                    Remove token
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
