export type Mood = 'rest' | 'refresh' | 'explore' | 'together';
export type Region = '전체' | '서울' | '부산' | '대구' | '인천' | '광주' | '대전' | '울산' | '세종' | '경기' | '강원' | '충북' | '충남' | '전라' | '경북' | '경남' | '제주';

export interface Destination {
  id: string;
  name: string;
  region: string;
  location: string;
  category: string;
  tags: string[];
  moods: Mood[];
  description: string;
  reason: Partial<Record<Mood, string>>;
  imageUrl?: string; imageCopyright?: string; latitude?: number; longitude?: number; contentTypeId?: string;
  visitInfo?: { hours?: string; fee?: string; closedDays?: string; phone?: string };
  scene: 'forest' | 'sea' | 'city' | 'garden';
}


export interface RecommendationQuery { mood: Mood; region: Region; pageNo?: number; pageSize?: number }
export interface DestinationPage { items: Destination[]; pageNo: number; totalCount: number; hasMore: boolean }
