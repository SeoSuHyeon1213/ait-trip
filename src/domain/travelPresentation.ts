import type { Destination, Mood } from './models/Destination';

export const shortMoodLabels: Record<Mood, string> = {
  rest: '쉬어가기', refresh: '기분 전환', explore: '새로운 경험', together: '함께하는 시간',
};
export const moodPageTitles: Record<Mood, string> = {
  rest: '자연 속에서 쉬어가요', refresh: '물가에서 기분 전환해요',
  explore: '새로운 발견을 떠나요', together: '함께 즐거운 시간을 보내요',
};
const themeOptions: Record<Mood, string[]> = {
  rest: ['자연공원', '휴양림·숲', '정원'],
  refresh: ['해변·해수욕장', '해안절경', '강·호수'],
  explore: ['박물관', '미술관', '과학관'],
  together: ['테마파크', '동물원', '수족관'],
};
export function getThemeOptions(mood: Mood) { return ['전체', ...themeOptions[mood]]; }

export function getDestinationTheme(item: Destination): string {
  const text = [item.name, item.category, ...item.tags].join(' ');
  if (/해안|절경|채석강|주상절리|해식/.test(text)) return '해안절경';
  if (/해변|해수욕장|바다/.test(text)) return '해변·해수욕장';
  if (/호수|저수지|하천|강변|계곡|폭포|강$/.test(text)) return '강·호수';
  if (/휴양림|숲|수목원|비자림/.test(text)) return '휴양림·숲';
  if (/정원/.test(text)) return '정원';
  if (/자연공원|국립공원|공원/.test(text)) return '자연공원';
  if (/미술관|갤러리/.test(text)) return '미술관';
  if (/박물관/.test(text)) return '박물관';
  if (/과학관|천문|스페이스/.test(text)) return '과학관';
  if (/수족관|아쿠아리움/.test(text)) return '수족관';
  if (/동물원|동물/.test(text)) return '동물원';
  if (/테마파크|놀이공원|랜드/.test(text)) return '테마파크';
  return item.tags[0] || item.category;
}

export function summarizeSavedPlaces(items: Destination[]) {
  const regions = items.map(item => item.region).filter(region => region && region !== '지역 미제공');
  const counts = new Map<string, number>();
  for (const region of regions) counts.set(region, (counts.get(region) || 0) + 1);
  return {
    regionCount: new Set(regions).size,
    themeCount: new Set(items.map(getDestinationTheme)).size,
    frequentRegion: [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] || '아직 없어요',
  };
}

export function sortSavedPlaces(items: Destination[], favorites: string[], order: 'recent' | 'name') {
  if (order === 'name') return [...items].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const positions = new Map(favorites.map((id, index) => [id, index]));
  return [...items].sort((a, b) => (positions.get(b.id) ?? -1) - (positions.get(a.id) ?? -1));
}
