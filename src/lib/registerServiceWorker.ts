/**
 * Registers the app's single service worker (/firebase-messaging-sw.js) at startup so the
 * app shell and assets are cached for offline use. The same worker also handles Firebase
 * push notifications, which is why there is only one: fcm.ts removes any other worker.
 *
 * Production only: in development Vite serves modules directly and a cache would only get
 * in the way of hot reloading.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const start = async () => {
    try {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      const registration = await navigator.serviceWorker.ready;

      // Requests made before the worker took control were not cached by it, so hand it
      // the list of everything this page loaded.
      const urls = performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .concat(`${location.origin}/manifest.json`);
      registration.active?.postMessage({ type: 'CACHE_URLS', urls });
    } catch (error) {
      console.warn('[offline] Service worker registration failed:', error);
    }
  };

  if (document.readyState === 'complete') {
    void start();
  } else {
    window.addEventListener('load', () => void start(), { once: true });
  }
}
