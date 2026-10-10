import { moodThemes } from './moodThemes.mjs';
import type { Mood, Region } from '../domain/models/Destination';

export const moods: { id: Mood; title: string; description: string; symbol: string }[] = [
  { id: 'rest', title: '쉬고 싶어요', description: moodThemes.rest.description, symbol: '01' },
  { id: 'refresh', title: '기분 전환이 필요해요', description: moodThemes.refresh.description, symbol: '02' },
  { id: 'explore', title: '새로운 경험을 하고 싶어요', description: moodThemes.explore.description, symbol: '03' },
  { id: 'together', title: '함께 시간을 보내고 싶어요', description: moodThemes.together.description, symbol: '04' },
];
export const regions: Region[] = ['전체', '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전라', '경북', '경남', '제주'];
