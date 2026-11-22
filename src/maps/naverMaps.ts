type MapInstance = { destroy(): void; setSize(size: unknown): void };
type MarkerInstance = { setMap(map: MapInstance | null): void };
export interface NaverMaps {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => MapInstance;
  Marker: new (options: Record<string, unknown>) => MarkerInstance;
  LatLng: new (latitude: number, longitude: number) => unknown;
  Size: new (width: number, height: number) => unknown;
}
declare global {
  interface Window {
    naver?: { maps: NaverMaps };
    moodTravelNaverReady?: () => void;
    navermap_authFailure?: () => void;
  }
}

let pending: Promise<NaverMaps> | undefined;
export function loadNaverMaps(clientId: string): Promise<NaverMaps> {
  if (pending) return pending;
  pending = new Promise<NaverMaps>((resolve, reject) => {
    const script = document.createElement('script');
    const url = new URL('https://oapi.map.naver.com/openapi/v3/maps.js');
    url.search = new URLSearchParams({ ncpKeyId: clientId, callback: 'moodTravelNaverReady' }).toString();
    let settled = false;
    const timer = setTimeout(() => fail(), 15000);
    function fail() {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.remove();
      pending = undefined;
      delete window.moodTravelNaverReady;
      reject(new Error('지도를 불러오지 못했어요.'));
    }
    window.moodTravelNaverReady = () => {
      if (settled) return;
      if (!window.naver?.maps?.Map) { fail(); return; }
      settled = true;
      clearTimeout(timer);
      delete window.moodTravelNaverReady;
      resolve(window.naver.maps);
    };
    window.navermap_authFailure = () => {
      window.dispatchEvent(new Event('mood-travel-map-auth-error'));
      pending = undefined;
      script.remove();
      fail();
    };
    script.async = true;
    script.src = url.href;
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return pending;
}
