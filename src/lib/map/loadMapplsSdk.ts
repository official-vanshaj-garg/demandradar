import { getMapplsStaticKey } from "./config";

// Stable script element ID — only one instance is allowed in the DOM.
const SCRIPT_ID = "demandradar-mappls-sdk";

// Trusted SDK origin and path. Never accept an arbitrary URL.
const SDK_BASE = "https://sdk.mappls.com/map/sdk/web";

// Module-level cached Promise.
// - Set while loading is in progress or after a successful load.
// - Reset to null after a failed load so callers may retry.
let sdkPromise: Promise<void> | null = null;

export function loadMapplsSdk(): Promise<void> {
  // SSR / non-browser safety.
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Mappls SDK can only be loaded in the browser."));
  }

  // Already loaded successfully — resolve immediately.
  if (window.mappls) {
    return Promise.resolve();
  }

  // Concurrent call — return the in-flight Promise.
  if (sdkPromise) {
    return sdkPromise;
  }

  // Key is required before injecting anything.
  const key = getMapplsStaticKey();
  if (!key) {
    return Promise.reject(new Error("Missing Mappls static key."));
  }

  // Construct the URL safely using URLSearchParams — never via string concatenation.
  const sdkUrl = new URL(SDK_BASE);
  sdkUrl.searchParams.set("v", "3.0");
  sdkUrl.searchParams.set("access_token", key);

  sdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      // A script element is already in the DOM from a previous attempt.
      // If window.mappls is now available, it loaded successfully.
      if (window.mappls) {
        resolve();
        return;
      }
      // The script exists but mappls is still absent — it may have failed silently
      // or is still loading. Remove it so we can inject a clean one.
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.type = "text/javascript";
    script.src = sdkUrl.toString();
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.mappls) {
        resolve();
      } else {
        // Script loaded but SDK global not initialised.
        script.remove();
        sdkPromise = null;
        reject(new Error("Mappls SDK loaded but window.mappls is undefined."));
      }
    };

    script.onerror = () => {
      // Remove the failed element so a future call may reinject cleanly.
      script.remove();
      // Reset the cache so the next call can retry.
      sdkPromise = null;
      reject(new Error("Failed to load Mappls SDK script."));
    };

    document.head.appendChild(script);
  });

  return sdkPromise;
}
