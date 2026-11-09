# ADR 0002 — Desktop shell: Tauri 2 + React + TypeScript + Vite

## Status

Accepted

## Context

The NerdHub initial client is a desktop application. It needs a web-based UI
rendered in a native shell, with OS integration (window, menu, auto-update
later), secure IPC, and a small native binary.

## Decision

Use Tauri 2 as the desktop shell, React + TypeScript + Vite for the renderer.
The frontend build (`vite build`) is part of the workspace build; the Rust
Tauri binary is built separately (`cargo build` / `tauri build`) and requires
the Rust toolchain.

## Alternatives considered

- **Electron**: larger runtime and binary size; higher resource use.
- **Progressive Web App / browser-only**: no native shell or OS integration.
- **Wails / other Go-based**: diverges from the TypeScript stack.

## Consequences

- Rust toolchain required to build/run the Tauri binary (not required to
  typecheck or build the React frontend with Vite).
- The renderer is untrusted; all auth, authorization, XP, currency and
  moderation decisions remain server-side (NestJS API).
- Tauri capabilities are least-privilege (see `apps/desktop/src-tauri/capabilities/`).

## Follow-up work

- Record the desktop auth/session strategy (callback scheme, token storage)
  in a follow-up ADR before M1.
- Add Tauri build/release CI job once a Rust toolchain is available in CI.
