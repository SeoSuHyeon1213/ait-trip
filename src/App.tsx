import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { graniteEvent, SafeAreaInsets } from '@apps-in-toss/web-framework';
import { destinations, moods, regions } from './data/destinations';
import type { Destination, Mood, Region } from './data/destinations';
import { getRecommendations } from './services/recommendations';
import { Scenery } from './components/Scenery';
import './App.css';

type Route = { page: 'home' | 'results' | 'saved' } | { page: 'detail'; id: string };
const FAVORITES_KEY = 'mood-travel:favorites:v1';
function readRoute(): Route {
  const hash = window.location.hash.slice(1);
  if (hash.startsWith('/place/')) return { page: 'detail', id: hash.slice(7) };
  if (hash === '/results') return { page: 'results' };
  if (hash === '/saved') return { page: 'saved' };
  return { page: 'home' };
}
function readFavorites(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && destinations.some((item) => item.id === id)) : [];
  } catch { return []; }
}
function readInsets() {
  try { return SafeAreaInsets.get(); }
  catch { return { top: 0, bottom: 0, left: 0, right: 0 }; }
}

function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [mood, setMood] = useState<Mood>('rest');
  const [region, setRegion] = useState<Region>('전체');
  const [favorites, setFavorites] = useState(readFavorites);
  const [storageNotice, setStorageNotice] = useState('');
  const [recommendation, setRecommendation] = useState<{ key: string; items: Destination[]; status: 'ready' | 'error' } | null>(null);
  const [retry, setRetry] = useState(0);
  const [insets, setInsets] = useState(readInsets);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const currentMood = moods.find((item) => item.id === mood)!;
  const queryKey = `${mood}:${region}:${retry}`;
  const status = recommendation?.key === queryKey ? recommendation.status : 'loading';
  const results = recommendation?.key === queryKey ? recommendation.items : [];

  function navigate(path: string) {
    if (window.location.hash === `#${path}`) return;
    const depth = Number(history.state?.moodTravelDepth ?? 0);
    history.pushState({ moodTravelDepth: depth + 1 }, '', `#${path}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }

  useEffect(() => {
    const sync = () => { setRoute(readRoute()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => { window.removeEventListener('hashchange', sync); window.removeEventListener('popstate', sync); };
  }, []);

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [route]);

  useEffect(() => {
    try {
      return SafeAreaInsets.subscribe({ onEvent: setInsets });
    } catch { /* 일반 브라우저에서는 CSS env() safe-area를 사용합니다. */ }
  }, []);

  useEffect(() => {
    if (route.page === 'home') return;
    try {
      return graniteEvent.addEventListener('backEvent', {
        onEvent: () => {
          // 직접 진입한 상세 페이지에서도 앱 내부 복귀 경로를 제공합니다.
          if (Number(history.state?.moodTravelDepth ?? 0) > 0) history.back();
          else navigate('/');
        },
      });
    } catch { /* 일반 브라우저에서는 브라우저 뒤로가기를 사용합니다. */ }
  }, [route.page]);

  useEffect(() => {
    let active = true;
    getRecommendations({ mood, region }).then((items) => {
      if (active) setRecommendation({ key: queryKey, items, status: 'ready' });
    }).catch(() => { if (active) setRecommendation({ key: queryKey, items: [], status: 'error' }); });
    return () => { active = false; };
  }, [mood, region, queryKey]);

  function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    setFavorites(next);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); setStorageNotice(''); }
    catch { setStorageNotice('기기에 저장할 수 없어 이번 이용 중에만 찜이 유지돼요.'); }
  }

  function card(item: Destination) {
    return <article className="destination-card" key={item.id}>
      <button className="card-link" type="button" onClick={() => navigate(`/place/${item.id}`)} aria-label={`${item.name} 상세 보기`}>
        <Scenery scene={item.scene} />
        <div className="card-body">
          <p className="eyebrow">{item.location} · {item.category}</p>
          <h2>{item.name}</h2>
          <p>{item.reason[mood] ?? '찜한 여행지를 다시 살펴보세요.'}</p>
          <div className="tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </div>
      </button>
      <button className={`save-button ${favorites.includes(item.id) ? 'is-saved' : ''}`} type="button" aria-pressed={favorites.includes(item.id)} aria-label={`${item.name} ${favorites.includes(item.id) ? '찜 해제' : '찜하기'}`} onClick={() => toggleFavorite(item.id)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill={favorites.includes(item.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3Z" /></svg>
      </button>
    </article>;
  }

  const place = route.page === 'detail' ? destinations.find((item) => item.id === route.id) : undefined;
  const safeStyle = { '--safe-top': `${insets.top}px`, '--safe-bottom': `${insets.bottom}px`, '--safe-left': `${insets.left}px`, '--safe-right': `${insets.right}px` } as CSSProperties;

  return <main className="travel-app canvas" style={safeStyle}>
    {route.page === 'home' && <>
      <div className="intro">
        <p className="eyebrow brand-label">마음따라 여행</p>
        <h1 ref={headingRef} tabIndex={-1}>오늘의 마음은<br />어디로 향하나요?</h1>
        <p>지금의 기분에 맞는 여행지를 찾아보세요.</p>
      </div>
      <section className="selection-section" aria-labelledby="mood-title">
        <h2 id="mood-title">어떤 시간을 보내고 싶나요?</h2>
        <div className="mood-list">{moods.map((item) => <button key={item.id} type="button" className={`mood-option ${mood === item.id ? 'selected' : ''}`} aria-pressed={mood === item.id} onClick={() => setMood(item.id)}>
          <span className="mood-number" aria-hidden="true">{item.symbol}</span>
          <span className="mood-copy"><strong>{item.title}</strong><span>{item.description}</span></span>
          <span className="selection-dot" aria-hidden="true" />
        </button>)}</div>
      </section>
      <section className="selection-section">
        <label className="section-label" htmlFor="region">어디로 떠나볼까요?</label>
        <select id="region" value={region} onChange={(event) => setRegion(event.target.value as Region)}>{regions.map((item) => <option key={item} value={item}>{item === '전체' ? '지역 상관없이 추천받기' : item}</option>)}</select>
      </section>
      <button className="secondary-button" type="button" onClick={() => navigate('/saved')}>찜한 여행지 {favorites.length}곳 보기</button>
      <p className="sample-note">샘플 여행지로 추천 흐름을 체험할 수 있어요.</p>
      <div className="bottom-action"><button className="primary-button" type="button" onClick={() => navigate('/results')}>내 기분에 맞는 여행지 찾기</button></div>
    </>}

    {route.page === 'results' && <>
      <p className="eyebrow brand-label">{region === '전체' ? '전국' : region} · {currentMood.title}</p>
      <h1 ref={headingRef} tabIndex={-1}>이런 여행은 어때요?</h1>
      <p className="lead">선택한 기분과 지역을 바탕으로 골랐어요.</p>
      {status === 'loading' && <div role="status" className="empty-state">여행지를 살펴보고 있어요.</div>}
      {status === 'error' && <div role="alert" className="empty-state"><h2>여행지를 불러오지 못했어요</h2><p>잠시 후 다시 시도해 주세요.</p><button className="secondary-button" type="button" onClick={() => setRetry((value) => value + 1)}>다시 불러오기</button></div>}
      {status === 'ready' && (results.length ? <><p className="result-count">추천 여행지 {results.length}곳</p><div className="destination-list">{results.map(card)}</div></> : <div className="empty-state"><h2>조건에 맞는 샘플이 없어요</h2><p>다른 지역이나 기분을 선택해 보세요.</p></div>)}
      <p className="sample-note">예시 데이터 · 그림은 실제 여행지 사진이 아니에요.</p>
      <div className="bottom-action"><button className="primary-button" type="button" onClick={() => navigate('/')}>기분과 지역 다시 선택하기</button></div>
    </>}

    {route.page === 'saved' && <>
      <p className="eyebrow brand-label">나의 여행 목록</p>
      <h1 ref={headingRef} tabIndex={-1}>다음에 가보고 싶은 곳</h1>
      <p className="lead">찜한 여행지 {favorites.length}곳을 모아뒀어요.</p>
      {favorites.length ? <div className="destination-list">{destinations.filter((item) => favorites.includes(item.id)).map(card)}</div> : <div className="empty-state"><h2>아직 찜한 여행지가 없어요</h2><p>추천 목록에서 마음에 드는 곳을 저장해 보세요.</p></div>}
      <p className="sample-note">찜 목록은 이 기기의 브라우저에 저장돼요.</p>
      <div className="bottom-action"><button className="primary-button" type="button" onClick={() => navigate('/')}>여행지 찾아보기</button></div>
    </>}

    {route.page === 'detail' && (place ? <>
      <Scenery scene={place.scene} />
      <p className="eyebrow">{place.location} · {place.category}</p>
      <h1 ref={headingRef} tabIndex={-1}>{place.name}</h1>
      <div className="tags">{place.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <section className="reason-box"><h2>이 여행지를 고른 이유</h2><p>{place.reason[mood] ?? '직접 찜한 여행지예요.'}</p></section>
      <section className="selection-section"><h2>어떤 곳인가요?</h2><p>{place.description}</p></section>
      <section className="info-box"><h2>방문 정보</h2><p>운영시간·이용요금·상세주소는 관광정보 API 연동 후 제공할 예정이에요.</p></section>
      <button className="secondary-button" type="button" onClick={() => navigate('/results')}>추천 목록 보기</button>
      <p className="sample-note">예시 데이터 · 그림은 실제 여행지 사진이 아니에요.</p>
      <div className="bottom-action"><button className="primary-button" type="button" aria-pressed={favorites.includes(place.id)} onClick={() => toggleFavorite(place.id)}>{favorites.includes(place.id) ? '찜한 여행지에서 삭제하기' : '이 여행지 찜하기'}</button></div>
    </> : <>
      <h1 ref={headingRef} tabIndex={-1}>여행지를 찾을 수 없어요</h1><p>추천 목록에서 다른 여행지를 골라보세요.</p><button className="primary-button" type="button" onClick={() => navigate('/')}>처음으로 돌아가기</button>
    </>)}
    {storageNotice && <p role="status" className="storage-notice">{storageNotice}</p>}
  </main>;
}

export default App;
