import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// When building for GitHub Pages, set base to /<repo-name>/
// GITHUB_PAGES and VITE_GITHUB_REPO are injected by the GitHub Actions workflow.
const base =
  process.env.GITHUB_PAGES && process.env.VITE_GITHUB_REPO
    ? `/${process.env.VITE_GITHUB_REPO}/`
    : '/'

export default defineConfig({
  plugins: [react()],
  base,
})
