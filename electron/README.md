# m4ster-tracker-electron

Windows desktop app for **M4ster Tracker** — an Electron wrapper around the production web app at https://m4ster-tracker.vercel.app/.

Why Electron and not Tauri: no Rust toolchain, no native compile step — just Node.js. The build is a plain `electron-builder` NSIS run on `windows-latest`.

## What's inside

- `main.js` — creates the app window, loads the web app, opens external links in the system browser, registers the `m4ster-tracker://` deep-link protocol (used by the Google OAuth desktop flow) and forwards deep-link URLs to the renderer.
- `preload.js` — context-isolated bridge exposing `window.m4sterDesktop.onDeepLink()` / `getPendingDeepLink()`.
- `assets/icon.ico` — generated MT monogram (dark + violet), 256x256 PNG-in-ICO.
- `.github/workflows/build.yml` — builds the `.exe` installer on every `v*` tag (or manual dispatch).

## Build locally (Windows)

```powershell
npm install
npm run dist:win
# -> dist/M4ster-Tracker-Setup-0.1.0.exe
```

## Release flow

1. Commit to `main`.
2. Tag: `git tag v0.1.0 && git push origin v0.1.0`
3. The workflow builds the NSIS `.exe`, uploads it as an artifact, and attaches it to the GitHub release.

## Config

- App ID: `com.m4ster.tracker`
- Target: NSIS installer (per-user, install dir selectable)
- Override the loaded URL for testing: `M4STER_TRACKER_URL=https://… npm start`
