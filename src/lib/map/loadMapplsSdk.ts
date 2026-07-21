import { getMapplsMapKey } from "./config";

let sdkPromise: Promise<void> | null = null;

export function loadMapplsSdk(): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    // Safe no-op or rejection for SSR environments
    return Promise.reject(new Error("Mappls SDK can only be loaded in the browser."));
  }

  if (window.mappls) {
    return Promise.resolve();
  }

  if (sdkPromise) {
    return sdkPromise;
  }

  const key = getMapplsMapKey();
  if (!key) {
    return Promise.reject(new Error("Missing Mappls Map Key."));
  }

  sdkPromise = new Promise((resolve, reject) => {
    const scriptId = "demandradar-mappls-sdk";
    if (document.getElementById(scriptId)) {
      reject(new Error("Mappls script tag already exists but not initialized."));
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "text/javascript";
    script.src = `https://apis.mappls.com/advancedmaps/api/${encodeURIComponent(key)}/map_sdk?v=3.0&layer=vector`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.mappls) {
        resolve();
      } else {
        reject(new Error("Mappls SDK loaded but window.mappls is undefined."));
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load Mappls SDK script."));
    };

    document.head.appendChild(script);
  });

  return sdkPromise;
}
