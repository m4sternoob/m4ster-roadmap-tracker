/**
 * Preload — minimal, context-isolated bridge for the renderer.
 * Exposes deep-link events and platform info; nothing else.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('m4sterDesktop', {
  /** Subscribe to `m4ster-tracker://` deep-link URLs (e.g. OAuth callback). */
  onDeepLink: (callback) => {
    const handler = (_event, url) => callback(url);
    ipcRenderer.on('deep-link-url', handler);
    return () => ipcRenderer.removeListener('deep-link-url', handler);
  },
  /** Deep link (if any) that launched the app, then clears it. */
  getPendingDeepLink: () => ipcRenderer.invoke('get-pending-deep-link'),
  platform: process.platform,
  isDesktop: true,
});
