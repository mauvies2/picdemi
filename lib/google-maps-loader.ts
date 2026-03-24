/**
 * Singleton Google Maps JS API loader.
 * Guarantees the script is only injected once regardless of how many
 * components call loadGoogleMaps() simultaneously.
 */

let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  // Already loaded
  if (window.google?.maps?.places) return Promise.resolve();

  // In-flight — reuse the same promise
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null; // allow retry on next mount
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
