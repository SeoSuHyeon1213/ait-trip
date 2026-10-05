import { destinations } from '../data/destinations';
import type { Destination, Mood, Region } from '../data/destinations';

export interface RecommendationQuery { mood: Mood; region: Region }

// TourAPI 연동 시 이 함수의 데이터 공급 부분을 서버 API 호출로 교체합니다.
// 관광공사 인증키는 VITE_* 환경변수나 프론트엔드 코드에 넣지 않습니다.
export async function getRecommendations(query: RecommendationQuery): Promise<Destination[]> {
  return destinations.filter((item) => item.moods.includes(query.mood) && (query.region === '전체' || item.region === query.region));
}
