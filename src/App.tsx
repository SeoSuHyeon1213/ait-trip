import { isBrowserBuild } from './config/runtime';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { graniteEvent, SafeAreaInsets } from '@apps-in-toss/web-framework';
import { moodThemes } from './config/moodThemes.mjs';
import { moods, regions } from './config/travelOptions';
import type { Destination, Mood, Region } from './domain/models/Destination';
import { destinationRepository } from './composition/destinationRepository';
import { DestinationImage } from './components/DestinationImage';
import { DestinationCard } from './components/DestinationCard';
import { DestinationMap } from './components/DestinationMap';
import { VisitInformation } from './components/VisitInformation';
import { BookmarkIcon, CheckIcon, MoodIcon, TravelerIcon } from './components/TravelIcons';
import { ChevronDown, ChevronRight } from './components/icons';
import { getDestinationTheme, getThemeOptions, moodPageTitles, shortMoodLabels, sortSavedPlaces, summarizeSavedPlaces } from './domain/travelPresentation';
import { useTravelPassport } from './hooks/useTravelPassport';
import { SavedDestinationsGate } from './components/SavedDestinationsGate';
import { readAppRoute } from './navigation/readAppRoute.mjs';
import type { AppRoute as Route } from './navigation/readAppRoute.mjs';
import './App.css';
import { InAppAdsPage } from './pages/InAppAdsPage';

const FAVORITES_KEY = 'mood-travel:favorites:v1';
function readRoute(): Route {
  return readAppRoute(window.location);
}
function readFavorites(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
}
function readInsets() {
  if (isBrowserBuild) return { top: 0, bottom: 0, left: 0, right: 0 };
  try { return SafeAreaInsets.get(); }
  catch { return { top: 0, bottom: 0, left: 0, right: 0 }; }
}

function RecommendationLoading() {
  const [isSlow, setIsSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), 10_000);
    return () => clearTimeout(timer);
  }, []);
  return <div role="status" className="empty-state">{isSlow ? '호스팅이 느리니 잠시 기다려 주세요' : '여행지를 살펴보고 있어요.'}</div>;
}
function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [mood, setMood] = useState<Mood>('rest');
  const [region, setRegion] = useState<Region>('전체');
  const [favorites, setFavorites] = useState(readFavorites);
  const [storageNotice, setStorageNotice] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('전체');
  const [savedOrder, setSavedOrder] = useState<'recent' | 'name'>('recent');
  const { passport, recordRecommendations, recordVisit } = useTravelPassport();
  const [failedImage, setFailedImage] = useState<{ id: string; url: string } | null>(null);

  const [catalog, setCatalog] = useState<{ key: string; items: Destination[]; status: 'ready' | 'error' } | null>(null);
  const [pageNo, setPageNo] = useState(1);
  const [recommendation, setRecommendation] = useState<{ key: string; items: Destination[]; totalCount: number; hasMore: boolean; status: 'ready' | 'error' } | null>(null);
  const [retry, setRetry] = useState(0);
  const [insets, setInsets] = useState(readInsets);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const currentMood = moods.find((item) => item.id === mood)!;
  const queryKey = `${mood}:${region}:${pageNo}:${retry}`;
  const status = recommendation?.key === queryKey ? recommendation.status : 'loading';
  const results = recommendation?.key === queryKey ? recommendation.items : [];

  const catalogKey = JSON.stringify([route, favorites, retry]);
  const catalogStatus = catalog?.key === catalogKey ? catalog.status : 'loading';
  const destinations = catalog?.key === catalogKey ? catalog.items : [];
  const isSample = destinationRepository.sourceKind === 'mock';

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
    if (isBrowserBuild) return;
    try {
      return SafeAreaInsets.subscribe({ onEvent: setInsets });
    } catch { /* 일반 브라우저에서는 CSS env() safe-area를 사용합니다. */ }
  }, []);

  useEffect(() => {
    if (isBrowserBuild || route.page === 'home') return;
    try {
      return graniteEvent.addEventListener('backEvent', {
        onEvent: () => {
          // 여행지 선택 목록에서는 방문 기록과 관계없이 미니앱 홈으로 돌아갑니다.
          if (route.page === 'results') {
            navigate('/');
            return;
          }
          // 직접 진입한 상세 페이지에서도 앱 내부 복귀 경로를 제공합니다.
          if (Number(history.state?.moodTravelDepth ?? 0) > 0) history.back();
          else navigate('/');
        },
      });
    } catch { /* 일반 브라우저에서는 브라우저 뒤로가기를 사용합니다. */ }
  }, [route.page]);

  useEffect(() => {
    if (route.page !== 'detail' && route.page !== 'saved') return;
    let active = true;
    const promise = route.page === 'detail' ? destinationRepository.getById(route.id).then(item => item ? [item] : []) : destinationRepository.getByIds(favorites);
    promise.then(items => { if (active) { setCatalog({ key: catalogKey, items, status: 'ready' }); if (route.page === 'detail' && items[0]) recordVisit(items[0]); } }).catch(() => { if (active) setCatalog({ key: catalogKey, items: [], status: 'error' }); });
    return () => { active = false; };
  }, [route, favorites, retry, catalogKey, recordVisit]);

  useEffect(() => {
    if (route.page !== 'results') return;
    let active = true;
    destinationRepository.getRecommendations({ mood, region, pageNo }).then(page => {
      if (active) { setRecommendation({ key: queryKey, ...page, status: 'ready' }); recordRecommendations(page.items); }
    }).catch(() => { if (active) setRecommendation({ key: queryKey, items: [], totalCount: 0, hasMore: false, status: 'error' }); });
    return () => { active = false; };
  }, [mood, region, pageNo, queryKey, route.page, recordRecommendations]);

  function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    setFavorites(next);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); setStorageNotice(''); }
    catch { setStorageNotice('기기에 저장할 수 없어 이번 이용 중에만 찜이 유지돼요.'); }
  }

  function card(item: Destination, index: number) {
    return <DestinationCard key={item.id} destination={item} index={index}
      isSaved={favorites.includes(item.id)} isPassport={route.page === 'saved'}
      onOpen={() => navigate(`/place/${item.id}`)} onToggle={() => toggleFavorite(item.id)} />;
  }

  const visibleResults = selectedTheme === '전체' ? results : results.filter(item => getDestinationTheme(item) === selectedTheme);
  const savedSummary = summarizeSavedPlaces(destinations);
  const sortedSaved = sortSavedPlaces(destinations, favorites, savedOrder);
  const place = route.page === 'detail' ? destinations.find((item) => item.id === route.id) : undefined;
  const safeStyle = { '--safe-top': `${insets.top}px`, '--safe-bottom': `${insets.bottom}px`, '--safe-left': `${insets.left}px`, '--safe-right': `${insets.right}px` } as CSSProperties;

  return <main className={`travel-app canvas page-${route.page}`} style={safeStyle}>
    {route.page === 'home' && <>
      <header className="travel-hero home-hero">
        <p className="eyebrow hero-eyebrow">마음따라 여행</p>
        <h1 ref={headingRef} tabIndex={-1}>오늘의 마음은<br />어디로 향하나요?</h1>
        <section className="passport-card home-passport" aria-label="나의 여행 기록">
          <div className="passport-topline">
            <p className="passport-label">MY TRAVEL PASSPORT</p>
            <button type="button" className="passport-link" aria-describedby={isBrowserBuild ? undefined : "saved-ad-notice"} onClick={() => navigate('/saved')}>찜 목록 보기 <ChevronRight size={16} /></button>
          </div>
          <dl className="passport-stats">
            <div><dt>찜한 곳</dt><dd>{favorites.length}</dd></div>
            <div><dt>둘러본 지역</dt><dd>{passport.viewedRegions.length}</dd></div>
            <div><dt>받은 추천</dt><dd>{passport.recommendationIds.length}</dd></div>
          </dl>
          {!isBrowserBuild && <p id="saved-ad-notice" className="passport-ad-note">찜 목록을 열 때 전면 광고가 표시돼요.</p>}
        </section>
      </header>
      <div className="content-panel home-panel">
        <section className="selection-section" aria-labelledby="mood-title">
          <h2 id="mood-title">어떤 시간을 보내고 싶나요?</h2>
          <div className="mood-list">{moods.map(item => <button key={item.id} type="button" className={`mood-option mood-${item.id} ${mood === item.id ? 'selected' : ''}`} aria-pressed={mood === item.id} onClick={() => { setMood(item.id); setPageNo(1); setSelectedTheme('전체'); }}>
            <span className="mood-icon"><MoodIcon mood={item.id} /></span>
            <span className="mood-copy"><strong>{item.title}</strong><span>{item.description}</span></span>
            {mood === item.id && <span className="selection-check"><CheckIcon /></span>}
          </button>)}</div>
        </section>
        <section className="selection-section region-section">
          <label className="section-label" htmlFor="region">어디로 떠나볼까요?</label>
          <div className="select-field"><select id="region" value={region} onChange={event => { setRegion(event.target.value as Region); setPageNo(1); }}>{regions.map(item => <option key={item} value={item}>{item === '전체' ? '지역 상관없이 추천받기' : item}</option>)}</select><ChevronDown size={20} /></div>
        </section>
        <p className="sample-note">{isSample ? '샘플 여행지로 추천 흐름을 체험할 수 있어요.' : '한국관광공사 관광정보를 바탕으로 추천해요.'}</p>
        {import.meta.env.DEV && <button className="text-button" type="button" onClick={() => navigate('/ads')}>광고 테스트</button>}
      </div>
      <div className="bottom-action"><button className="primary-button" type="button" onClick={() => { setSelectedTheme('전체'); navigate('/results'); }}>내 기분에 맞는 여행지 찾기</button></div>
    </>}

    {route.page === 'results' && <>
      <header className={`travel-hero results-hero hero-${mood}`}>
        <div className="hero-chips"><span>{region === '전체' ? '전국' : region}</span><span>{currentMood.title}</span></div>
        <h1 ref={headingRef} tabIndex={-1}>{moodPageTitles[mood]}</h1>
        <p className="hero-description">{moodThemes[mood].description}{status === 'ready' && <> · 추천 여행지 <strong>{results.length}</strong>곳</>}</p>
      </header>
      <div className="content-panel results-panel">
        <div className="theme-filters" role="group" aria-label="현재 페이지의 여행지 테마">{getThemeOptions(mood).map(theme => <button key={theme} className={`filter-chip ${selectedTheme === theme ? 'selected' : ''}`} type="button" aria-pressed={selectedTheme === theme} onClick={() => setSelectedTheme(theme)}>{theme}</button>)}</div>
        {status === 'loading' && <RecommendationLoading key={queryKey} />}
        {status === 'error' && <div role="alert" className="empty-state"><h2>여행지를 불러오지 못했어요</h2><p>잠시 후 다시 시도해 주세요.</p><button className="secondary-button" type="button" onClick={() => setRetry(value => value + 1)}>다시 불러오기</button></div>}
        {status === 'ready' && (visibleResults.length ? <div className="destination-list">{visibleResults.map(card)}</div> : <div className="empty-state"><h2>{results.length ? '이 테마의 여행지가 없어요' : '조건에 맞는 여행지가 없어요'}</h2><p>{results.length ? '다른 테마를 선택하거나 다음 페이지를 살펴보세요.' : '다른 지역이나 기분을 선택해 보세요.'}</p></div>)}
        {status === 'ready' && <p className="result-count">{pageNo}페이지 · 전체 후보 {recommendation?.totalCount ?? 0}곳</p>}
        <div className="page-actions">{pageNo > 1 && <button className="secondary-button" type="button" onClick={() => setPageNo(value => value - 1)}>이전 페이지</button>}{status === 'ready' && recommendation?.hasMore && <button className="secondary-button" type="button" onClick={() => setPageNo(value => value + 1)}>다음 페이지</button>}</div>
        <p className="sample-note">{isSample ? '예시 데이터 · 그림은 실제 여행지 사진이 아니에요.' : '관광정보·사진 출처: 한국관광공사. 사진이 없는 경우 예시 그림을 표시해요.'}</p>
      </div>
      <div className="bottom-action with-bookmark">
        <button type="button" className="saved-shortcut" aria-label={`찜한 여행지 ${favorites.length}곳 보기${isBrowserBuild ? '' : ' · 전면 광고 후 열림'}`} onClick={() => navigate('/saved')}><BookmarkIcon filled /></button>
        <button className="primary-button" type="button" onClick={() => navigate('/')}>기분과 지역 다시 선택하기</button>
      </div>
    </>}

    {route.page === 'saved' && <SavedDestinationsGate onBack={() => navigate('/')}>
      <header className="travel-hero saved-hero">
        <p className="eyebrow hero-eyebrow">나의 여행 목록</p>
        <section className="passport-card saved-passport" aria-label="나의 여행 여권">
          <div className="passport-identity"><h1 ref={headingRef} tabIndex={-1}>나의 여행 여권</h1><span className="traveler-avatar"><TravelerIcon /></span></div>
          <div className="passport-details">
            <dl className="passport-preferences"><div><dt>요즘 마음</dt><dd>{shortMoodLabels[mood]}</dd></div><div><dt>자주 찾는 지역</dt><dd>{catalogStatus === 'ready' ? savedSummary.frequentRegion : '—'}</dd></div></dl>
            <dl className="passport-stats"><div><dt>찜한 곳</dt><dd>{favorites.length}</dd></div><div><dt>지역</dt><dd>{catalogStatus === 'ready' ? savedSummary.regionCount : '—'}</dd></div><div><dt>테마</dt><dd>{catalogStatus === 'ready' ? savedSummary.themeCount : '—'}</dd></div></dl>
          </div>
        </section>
      </header>
      <div className="content-panel saved-panel">
        <div className="section-heading"><h2>다음에 가보고 싶은 곳</h2><div className="sort-field"><select aria-label="찜한 여행지 정렬" value={savedOrder} onChange={event => setSavedOrder(event.target.value as 'recent' | 'name')}><option value="recent">최근 찜한 순</option><option value="name">이름 순</option></select><ChevronDown size={16} /></div></div>
        {catalogStatus === 'loading' ? <div role="status" className="empty-state">찜한 여행지를 불러오고 있어요.</div> : catalogStatus === 'error' ? <div role="alert" className="empty-state"><p>여행지를 불러오지 못했어요.</p><button type="button" className="secondary-button" onClick={() => setRetry(value => value + 1)}>다시 불러오기</button></div> : sortedSaved.length ? <div className="destination-list passport-list">{sortedSaved.map(card)}</div> : <div className="empty-state"><h2>아직 찜한 여행지가 없어요</h2><p>추천 목록에서 마음에 드는 곳을 저장해 보세요.</p></div>}
        <p className="sample-note">찜 목록과 여행 기록은 이 기기의 브라우저에 저장돼요.</p>
      </div>
      <div className="bottom-action"><button className="primary-button" type="button" onClick={() => navigate('/')}>여행지 더 찾아보기</button></div>
    </SavedDestinationsGate>}
    {route.page === 'detail' && (catalogStatus === 'loading' ? <div role="status" className="empty-state">여행지를 불러오고 있어요.</div> : catalogStatus === 'error' ? <div role="alert" className="empty-state"><p>여행지를 불러오지 못했어요.</p><button type="button" className="secondary-button" onClick={() => setRetry((value) => value + 1)}>다시 불러오기</button></div> : place ? <>
      <DestinationImage destination={place} onImageError={() => setFailedImage({ id: place.id, url: place.imageUrl! })} />
      <p className="eyebrow">{place.location} · {place.category}</p>
      <h1 ref={headingRef} tabIndex={-1}>{place.name}</h1>
      <div className="tags">{place.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <section className="reason-box"><h2>이 여행지를 고른 이유</h2><p>{place.reason[mood] ?? '직접 찜한 여행지예요.'}</p></section>
      <section className="selection-section"><h2>어떤 곳인가요?</h2><p className="tour-text">{place.description}</p>
        {!isSample && (!place.imageUrl || (failedImage?.id === place.id && failedImage.url === place.imageUrl)) && <p className="sample-note" role="status">{!place.imageUrl ? '한국관광공사에서 제공한 여행지 이미지가 없어 예시 그림을 표시해요.' : '한국관광공사 여행지 이미지를 불러오지 못해 예시 그림을 표시해요.'} 예시 그림은 실제 여행지 사진이 아니에요.</p>}
      </section>
      <DestinationMap key={`map-${place.id}`} place={place} />
      <VisitInformation key={place.id} place={place} isSample={isSample} />
      <button className="secondary-button" type="button" onClick={() => navigate('/results')}>추천 목록 보기</button>
      <p className="sample-note">{isSample ? '예시 데이터 · 그림은 실제 여행지 사진이 아니에요.' : '관광정보·사진 출처: 한국관광공사. 사진이 없는 경우 예시 그림을 표시해요.'}</p>
      <div className="bottom-action"><button className="primary-button" type="button" aria-pressed={favorites.includes(place.id)} onClick={() => toggleFavorite(place.id)}>{favorites.includes(place.id) ? '찜한 여행지에서 삭제하기' : '이 여행지 찜하기'}</button></div>
    </> : <>
      <h1 ref={headingRef} tabIndex={-1}>여행지를 찾을 수 없어요</h1><p>추천 목록에서 다른 여행지를 골라보세요.</p><button className="primary-button" type="button" onClick={() => navigate('/')}>처음으로 돌아가기</button>
    </>)}
    {route.page === 'ads' && <InAppAdsPage onBack={() => navigate('/')} />}
    {storageNotice && <p role="status" className="storage-notice">{storageNotice}</p>}
  </main>;
}

export default App;
