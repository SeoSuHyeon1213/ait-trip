export type Mood = 'rest' | 'refresh' | 'explore' | 'together';
export type Region = '전체' | '서울' | '강원' | '전라' | '제주';

export const moods: { id: Mood; title: string; description: string; symbol: string }[] = [
  { id: 'rest', title: '쉬고 싶어요', description: '자연 속에서 천천히', symbol: '01' },
  { id: 'refresh', title: '기분 전환이 필요해요', description: '익숙한 일상에서 잠깐 벗어나기', symbol: '02' },
  { id: 'explore', title: '새로운 경험을 하고 싶어요', description: '낯선 풍경과 문화 만나기', symbol: '03' },
  { id: 'together', title: '함께 시간을 보내고 싶어요', description: '소중한 사람과 나란히', symbol: '04' },
];
export const regions: Region[] = ['전체', '서울', '강원', '전라', '제주'];

export interface Destination {
  id: string;
  name: string;
  region: Exclude<Region, '전체'>;
  location: string;
  category: string;
  tags: string[];
  moods: Mood[];
  description: string;
  reason: Partial<Record<Mood, string>>;
  scene: 'forest' | 'sea' | 'city' | 'garden';
}

// 화면 검증용 예시입니다. TourAPI 원본 데이터나 실시간 운영 정보가 아닙니다.
export const destinations: Destination[] = [
  { id: 'seoul-forest', name: '서울숲', region: '서울', location: '서울 성동구', category: '공원', tags: ['산책', '자연'], moods: ['rest', 'refresh', 'together'], scene: 'forest', description: '도심에서 나무와 산책길을 만나는 여행을 떠올려 보세요. 가볍게 걷는 일정으로 구성할 수 있는 예시 여행지예요.', reason: { rest: '나무와 산책길을 중심으로 느긋한 일정을 만들 수 있어요.', refresh: '도심 속 자연을 만나는 산책 코스로 골랐어요.', together: '동행과 함께 걸으며 시간을 보내는 코스로 골랐어요.' } },
  { id: 'gangneung-sea', name: '경포해변', region: '강원', location: '강원 강릉시', category: '해변', tags: ['바다', '산책'], moods: ['rest', 'refresh', 'together'], scene: 'sea', description: '바다를 바라보며 걷는 여행을 계획해 보세요. 해변 주변에서 여유롭게 시간을 보내는 일정의 예시예요.', reason: { rest: '바다를 바라보는 시간을 중심으로 일정을 만들 수 있어요.', refresh: '일상과 다른 바다 풍경을 만나는 코스로 골랐어요.', together: '동행과 해변을 걷는 여행으로 골랐어요.' } },
  { id: 'jeonju-village', name: '전주한옥마을', region: '전라', location: '전북 전주시', category: '문화', tags: ['한옥', '문화'], moods: ['explore', 'together', 'refresh'], scene: 'city', description: '한옥 골목과 지역 문화를 둘러보는 여행을 계획해 보세요. 골목을 걸으며 새로운 장면을 만나는 일정의 예시예요.', reason: { explore: '한옥과 지역 문화를 둘러보는 코스로 골랐어요.', together: '동행과 골목을 함께 둘러보는 여행으로 골랐어요.', refresh: '한옥 골목에서 다른 풍경을 만나는 코스로 골랐어요.' } },
  { id: 'jeju-forest', name: '비자림', region: '제주', location: '제주 제주시', category: '숲', tags: ['숲', '자연'], moods: ['rest', 'refresh', 'explore'], scene: 'forest', description: '숲길을 따라 천천히 걷는 제주 여행을 떠올려 보세요. 자연을 둘러보는 일정의 예시예요.', reason: { rest: '숲길 산책을 중심으로 여유 있는 일정을 만들 수 있어요.', refresh: '도심을 벗어나 숲 풍경을 만나는 코스로 골랐어요.', explore: '제주의 숲을 둘러보는 여행으로 골랐어요.' } },
  { id: 'suncheon-garden', name: '순천만국가정원', region: '전라', location: '전남 순천시', category: '정원', tags: ['정원', '산책'], moods: ['rest', 'explore', 'together'], scene: 'garden', description: '다양한 정원 풍경을 둘러보는 여행을 계획해 보세요. 걷기와 구경을 함께 하는 일정의 예시예요.', reason: { rest: '정원을 둘러보며 천천히 걷는 코스로 골랐어요.', explore: '여러 정원 풍경을 만나는 여행으로 골랐어요.', together: '동행과 정원을 둘러보는 코스로 골랐어요.' } },
  { id: 'seoul-museum', name: '국립중앙박물관', region: '서울', location: '서울 용산구', category: '전시', tags: ['전시', '문화'], moods: ['explore', 'refresh', 'together'], scene: 'city', description: '전시를 둘러보며 문화와 역사를 만나는 여행을 떠올려 보세요. 실내 관람을 중심으로 구성하는 일정의 예시예요.', reason: { explore: '전시와 역사를 둘러보는 코스로 골랐어요.', refresh: '전시를 감상하며 다른 일정을 보내는 여행으로 골랐어요.', together: '동행과 전시를 감상하는 코스로 골랐어요.' } },
];
