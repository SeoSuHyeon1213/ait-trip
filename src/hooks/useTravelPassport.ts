import { useCallback, useEffect, useState } from 'react';
import type { Destination } from '../domain/models/Destination';

const KEY = 'mood-travel:passport:v1';
interface Passport { recommendationIds: string[]; viewedRegions: string[] }
function readPassport(): Passport {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '{}');
    const strings = (input: unknown): string[] => Array.isArray(input) ? input.filter((item): item is string => typeof item === 'string') : [];
    return { recommendationIds: strings(value?.recommendationIds), viewedRegions: strings(value?.viewedRegions) };
  } catch { return { recommendationIds: [], viewedRegions: [] }; }
}
export function useTravelPassport() {
  const [passport, setPassport] = useState(readPassport);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(passport)); } catch { /* 이번 이용 중의 기록은 유지합니다. */ }
  }, [passport]);
  const recordRecommendations = useCallback((items: Destination[]) => {
    setPassport(previous => {
      const ids = [...new Set([...previous.recommendationIds, ...items.map(item => item.id)])];
      return ids.length === previous.recommendationIds.length ? previous : { ...previous, recommendationIds: ids };
    });
  }, []);
  const recordVisit = useCallback((item: Destination) => {
    if (!item.region || item.region === '지역 미제공') return;
    setPassport(previous => previous.viewedRegions.includes(item.region) ? previous : { ...previous, viewedRegions: [...previous.viewedRegions, item.region] });
  }, []);
  return { passport, recordRecommendations, recordVisit };
}
