import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register Service Worker & purge all legacy HTML/JS caches so UI is always 100% fresh
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key !== 'chixus-pwa-v5.0.0') {
            caches.delete(key);
          }
        });
      });
    }

    navigator.serviceWorker
      .register('/sw.js?v=5.0.0', { scope: '/', updateViaCache: 'none' })
      .then((registration) => {
        registration.update().catch(() => {});
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        console.log('[PWA] Service Worker v5.0.0 registered:', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
