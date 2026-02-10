# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

stimulus-use-actions is a zero-dependency ES module that lets Stimulus controllers declare `data-action` bindings programmatically in JavaScript instead of HTML markup. Requires Stimulus v3+. No build step.

Root files: `index.js` (library entry), `package.json` (metadata/scripts). Place future sources in `src/` and re-export from `index.js`; put tests in `tests/`.

## Commands

- `bun install` — install dependencies (currently no runtime deps)
- `bun run test` — run tests once (vitest)
- `bun run test:watch` — run tests in watch mode
- `bun run coverage` — run tests with coverage report
- `bun run vitest run tests/integration.test.js` — run a single test file

## Architecture

The entire library is in `index.js` (~55 lines) with three exports:

1. **`useActions(controller, actions)`** (default export) — binds action descriptors to controller targets. Uses Stimulus internals (`context.bindingObserver.parseValueForToken()` and `connectAction()`).
2. **`withActions(BaseController)`** — higher-order wrapper that auto-calls `useActions(this)` in `connect()`, reading from `static actions = {}`.
3. **`Controller`** — base class extending Stimulus's Controller that auto-binds `static actions` on connect.

Action descriptor syntax: `"event->method"` (explicit event) or `"method"` (inferred). Arrays supported for multiple actions per target. Special `window` key binds to `@window`.

## Testing

- **Framework:** Vitest with happy-dom environment
- **Location:** `tests/*.test.js`
- **Coverage:** 100% enforced on lines, functions, branches, and statements
- **Scope:** cover multiple targets, `window` target, and event prefixes like `click->`
- Tests create real Stimulus Applications with happy-dom, register controllers, and assert against DOM mutations

## Code Style

- 2 spaces, no semicolons, double quotes
- Default export is the library entry; keep API surface small
- Naming: reflect Stimulus conventions — keys in the `actions` map should match controller properties (e.g., `buttonTarget`, `buttonTargets`, or `window`)
- Conventional Commits preferred (e.g., `feat:`, `fix:`)

## Example Usage

```js
import useActions from "./index.js"
// Inside a Stimulus controller
connect() {
  useActions(this, {
    buttonTargets: ["click->submit", "keyup->preview"],
    window: "resize->reflow",
  })
}
```
