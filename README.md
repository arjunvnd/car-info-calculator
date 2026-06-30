# OBD2 Dashboard — 2013 Santro Xing

A personal web app for visualising Torque Pro OBD2 trip data. Loads CSV exports from a GitHub repo and plots interactive graphs for speed, RPM, fuel consumption, engine temps, and more.

**Live app:** https://arjunvnd.github.io/car-info-calculator/

---

## Deployment (GitHub Pages)

The app deploys automatically via GitHub Actions every time you push to `master`. One-time setup:

1. Go to your repo on GitHub → **Settings → Pages**
2. Under **Source**, select **"GitHub Actions"**
3. That's it — the next push to `master` will trigger a build and deploy

The workflow file is at `.github/workflows/deploy.yml`.

---

## Adding trip data

Upload Torque Pro CSV exports to the `data/` folder:

- **From your phone:** GitHub mobile app → `data/` folder → `+` → Upload files → pick CSV → Commit
- **From a PC:** drag and drop on `github.com/arjunvnd/car-info-calculator/tree/master/data`
- **Via git:** copy CSV into `data/`, then `git add data/ && git commit -m "Add trip" && git push`

The app auto-discovers all `.csv` files in `data/` on load.

---

## Local development

```bash
# install
npm install

# create .env (copy from .env.example and fill in your GitHub username)
cp .env.example .env

# start dev server
npm run dev
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
