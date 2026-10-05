import type { Destination, RecommendationQuery } from '../models/Destination';

export interface DestinationRepository {
  getAll(): Promise<Destination[]>;
  getById(id: string): Promise<Destination | undefined>;
  getByIds(ids: readonly string[]): Promise<Destination[]>;
  getRecommendations(query: RecommendationQuery): Promise<Destination[]>;
}
