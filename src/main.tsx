import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/index.css';
import { initPWA } from './utils/pwa';
import { IS_TEST_BUILD } from './lib/build';

// Test deployments carry "Test" in the tab title; production stays clean.
if (IS_TEST_BUILD && !document.title.includes('Test')) {
  document.title = `${document.title} — Test`;
}

// Restore the saved cursor style + font before first paint so the choices
// survive reloads (the Customize panel writes these keys).
try {
  const cursor = localStorage.getItem('mt_cursor_style');
  if (cursor) document.documentElement.dataset.cursor = cursor;
  const font = localStorage.getItem('mt_font');
  if (font) document.documentElement.dataset.font = font;
} catch {
  // Storage blocked (private mode) — defaults apply.
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--toast-bg, #1e293b)',
          color: 'var(--toast-color, #f1f5f9)',
          border: '1px solid var(--toast-border, #334155)',
        },
        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: '#f1f5f9',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#f1f5f9',
          },
        },
      }}
    />
  </React.StrictMode>
);

// Initialize PWA features
if ('serviceWorker' in navigator) {
  initPWA();
}
