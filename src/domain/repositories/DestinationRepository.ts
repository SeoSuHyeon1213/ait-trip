import type { Destination, DestinationPage, RecommendationQuery } from '../models/Destination';
export interface DestinationRepository {
  readonly sourceKind: 'mock' | 'api';
  getRecommendations(query: RecommendationQuery): Promise<DestinationPage>;
  getById(id: string): Promise<Destination | undefined>;
  getByIds(ids: readonly string[]): Promise<Destination[]>;
}
