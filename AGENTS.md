# Repository Guidelines

## Project Structure & Module Organization
- Root files: `index.js` (library entry), `package.json` (metadata/scripts).
- No build step; the module exports an ES module function for Stimulus controllers.
- Suggested growth: place future sources in `src/` and re-export from `index.js`; put tests in `tests/`.

## Build, Test, and Development Commands
- `npm install`: installs dev tools if added later. Currently no runtime deps.
- `npm test`: placeholder that exits with error. If you add tests, replace with a real runner (e.g., `vitest` or `jest`).
- Local check: import `index.js` in a small sandbox app to validate Stimulus behavior.

## Coding Style & Naming Conventions
- Indentation: 2 spaces; avoid semicolons; prefer double quotes for strings; use template literals where helpful.
- Exports: default export is the library entry. Keep API surface small and documented in JSDoc.
- Naming: reflect Stimulus conventions. Keys in the `actions` map should match controller properties (e.g., `buttonTarget`, `buttonTargets`, or `window`). Action strings may be "click->method" or "method".

## Testing Guidelines
- Framework: prefer Vitest or Jest. Name files `*.test.js`.
- Location: co-locate tests next to files or under `tests/`.
- Coverage: target meaningful branches (multiple targets, `window` target, and prefixed events like `click->`).
- Run: configure `npm test` to run your chosen framework and ensure it exits non-zero on failures.

## Commit & Pull Request Guidelines
- Commits: use Conventional Commits when possible (e.g., `feat: add window target support`, `fix: handle single target elements`). Keep commits focused.
- PRs: include a concise description, rationale, example usage, and any behavioral changes. Link issues. Add before/after snippets when touching the API.

## Example Usage (for sanity checks)
```js
import useActions from "./index.js";
// Inside a Stimulus controller
connect() {
  useActions(this, {
    buttonTargets: ["click->submit", "keyup->preview"],
    window: "resize->reflow",
  });
}
```
