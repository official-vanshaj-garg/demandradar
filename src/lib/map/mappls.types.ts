export {};

export interface MapplsMapOptions {
  center: [number, number] | { lat: number; lng: number };
  zoom: number;
}

export interface MapplsMapInstance {
  remove?: () => void;
}

export interface MapplsMarkerOptions {
  map: MapplsMapInstance | null;
  position: { lat: number; lng: number };
}

export interface MapplsMarker {
  remove?: () => void;
  addListener?: (event: string, callback: () => void) => void;
}

declare global {
  interface Window {
    // Minimal required shape for Mappls JS SDK
    mappls?: {
      Map: new (element: HTMLElement, options: MapplsMapOptions) => MapplsMapInstance;
      Marker: new (options: MapplsMarkerOptions) => MapplsMarker;
    };
  }
}
