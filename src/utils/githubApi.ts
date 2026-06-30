const OWNER = (import.meta.env.VITE_GITHUB_OWNER as string) || "";
const REPO = (import.meta.env.VITE_GITHUB_REPO as string) || "";
const BRANCH = (import.meta.env.VITE_GITHUB_BRANCH as string) || "main";

interface GithubEntry {
  name: string;
  download_url: string;
  type: string;
}

export async function listTripFiles(): Promise<
  { name: string; downloadUrl: string }[]
> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/data?ref=${BRANCH}`,
  );
  if (res.status === 404) {
    throw new Error(
      "data/ folder not found in repo. Create the folder and push your CSV files into it.",
    );
  }
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  const entries: GithubEntry[] = await res.json();
  return entries
    .filter((e) => e.type === "file" && e.name.toLowerCase().endsWith(".csv"))
    .map((e) => ({ name: e.name, downloadUrl: e.download_url }))
    .sort((a, b) => b.name.localeCompare(a.name)); // newest first
}

export async function fetchCsvText(downloadUrl: string): Promise<string> {
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
  return res.text();
}
