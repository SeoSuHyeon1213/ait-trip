export type Mood = 'rest' | 'refresh' | 'explore' | 'together';
export type Region = '전체' | '서울' | '강원' | '전라' | '제주';

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


export interface RecommendationQuery { mood: Mood; region: Region }
