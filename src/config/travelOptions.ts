import type { Mood, Region } from '../domain/models/Destination';

export const moods: { id: Mood; title: string; description: string; symbol: string }[] = [
  { id: 'rest', title: '쉬고 싶어요', description: '자연 속에서 천천히', symbol: '01' },
  { id: 'refresh', title: '기분 전환이 필요해요', description: '익숙한 일상에서 잠깐 벗어나기', symbol: '02' },
  { id: 'explore', title: '새로운 경험을 하고 싶어요', description: '낯선 풍경과 문화 만나기', symbol: '03' },
  { id: 'together', title: '함께 시간을 보내고 싶어요', description: '소중한 사람과 나란히', symbol: '04' },
];
export const regions: Region[] = ['전체', '서울', '강원', '전라', '제주'];
