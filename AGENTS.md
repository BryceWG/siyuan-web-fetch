# Repository Guidelines

## Project Structure & Module Organization

- `src/`: plugin source (TypeScript + SCSS).
  - `src/index.ts`: webpack entry; exports `src/plugin.ts`.
  - `src/components/`: UI (fetch dialog, settings panel).
  - `src/services/`: scraping backends (Firecrawl/Jina).
  - `src/api/`: SiYuan HTTP helpers.
  - `src/utils/`: shared helpers (Markdown, notebooks).
  - `src/i18n/`: locale JSON (`en_US.json`, `zh_CN.json`).
- `dist/`, `index.js`, `index.css`, `package.zip`: build outputs (gitignored; don’t edit/commit).
- `plugin.json`: SiYuan plugin manifest (versioned for releases).
- `.github/workflows/release.yml`: builds and publishes `package.zip` when `plugin.json` version changes on `main`.

## Build, Test, and Development Commands

- `pnpm i`: install dependencies (CI uses Node 20 + pnpm 9).
- `pnpm run dev`: webpack watch build for local testing.
- `pnpm run build`: production build; generates `dist/` + `package.zip`.
- `pnpm run lint`: ESLint (auto-fixes where possible).

## Coding Style & Naming Conventions

- TypeScript: 4-space indentation, double quotes, semicolons; keep `noImplicitAny` clean (`tsconfig.json`).
- File names: `kebab-case` in `src/` (e.g., `fetch-dialog.ts`); types/classes `PascalCase`, functions/vars `camelCase`.
- SCSS: BEM-style class names (e.g., `.web-fetch__field` in `src/index.scss`).
- When adding UI text, update both `src/i18n/en_US.json` and `src/i18n/zh_CN.json`.

## Testing Guidelines

- No automated test suite yet. Manual smoke test:
  1. `pnpm run dev`
  2. Copy the repo into `{SiYuanWorkspace}/data/plugins/siyuan-web-fetch/`
  3. Enable the plugin and run `Web Fetch: Capture URL`
  4. Verify note creation and both backends (Firecrawl requires an API key).

## Commit & Pull Request Guidelines

- Use Conventional Commits (examples in history): `feat(ui): ...`, `refactor(services): ...`, `chore(meta): ...`.
- PRs: include a clear description, manual test steps, and screenshots for UI changes. If changing releases, bump `plugin.json` (and keep `package.json` in sync).

## Security & Configuration Tips

- Never commit API keys. Firecrawl keys should be provided via the plugin settings UI.
- When adding a new backend, document the endpoint and required setup in `README.md` and keep it opt-in.

## Agent-Specific Instructions

- If using Codex CLI skills, only open the relevant `SKILL.md` and keep context minimal; use `skill-creator`/`skill-installer` only when requested.
