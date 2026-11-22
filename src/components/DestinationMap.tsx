import { useEffect, useRef, useState } from 'react';
import type { Destination } from '../domain/models/Destination';
import { requestJson } from '../data/datasources/TourApiDestinationDataSource';
import { loadNaverMaps } from '../maps/naverMaps';

export function DestinationMap({ place }: { place: Destination }) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const { latitude, longitude, name } = place;
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude!) <= 90 && Math.abs(longitude!) <= 180;

  useEffect(() => {
    if (!hasCoordinates) return;
    let active = true;
    let dispose: (() => void) | undefined;
    const onAuthError = () => { if (active) setStatus('error'); };
    window.addEventListener('mood-travel-map-auth-error', onAuthError);
    async function initialize() {
      try {
        const config = await requestJson<{ clientId: string }>('/api/map-config');
        if (!active) return;
        if (!config.clientId) { setStatus('error'); return; }
        const maps = await loadNaverMaps(config.clientId);
        if (!active || !container.current) return;
        const position = new maps.LatLng(latitude!, longitude!);
        const map = new maps.Map(container.current, { center: position, zoom: 15, zoomControl: true, scrollWheel: false });
        const marker = new maps.Marker({ position, map, title: name });
        const observer = new ResizeObserver(() => {
          if (container.current) map.setSize(new maps.Size(container.current.clientWidth, container.current.clientHeight));
        });
        dispose = () => { observer.disconnect(); marker.setMap(null); map.destroy(); };
        observer.observe(container.current);
        setStatus('ready');
      } catch { if (active) setStatus('error'); }
    }
    void initialize();
    return () => {
      active = false;
      window.removeEventListener('mood-travel-map-auth-error', onAuthError);
      dispose?.();
    };
  }, [latitude, longitude, name, hasCoordinates, retry]);

  return <section className="destination-map-section" aria-labelledby="destination-map-heading">
    <h2 id="destination-map-heading">지도에서 위치 보기</h2>
    {!hasCoordinates ? <p className="sample-note">위치 정보가 없어 지도를 표시할 수 없어요. 방문 정보의 주소를 확인해 주세요.</p> : <>
      <div className="destination-map-frame">
        <div ref={container} className="destination-map" aria-label={`${name} 위치 지도`} />
        {status !== 'ready' && <div className="map-message" role="status">
          <p>{status === 'loading' ? '지도를 불러오고 있어요.' : '지도를 불러오지 못했어요. 주소는 아래 방문 정보에서 확인할 수 있어요.'}</p>
          {status === 'error' && <button type="button" className="secondary-button" onClick={() => { setStatus('loading'); setRetry(value => value + 1); }}>지도 다시 불러오기</button>}
        </div>}
      </div>
      <p className="sample-note">한국관광공사에서 제공한 위치예요. 실제 입구와 다를 수 있어요.</p>
    </>}
  </section>;
}
