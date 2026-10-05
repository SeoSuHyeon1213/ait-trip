import type { DestinationRepository } from '../../domain/repositories/DestinationRepository';
import type { Destination, RecommendationQuery } from '../../domain/models/Destination';
import type { DestinationDataSource } from '../datasources/DestinationDataSource';
import { mapDestination } from '../mappers/DestinationMapper';

export class DefaultDestinationRepository implements DestinationRepository {
  private readonly dataSource: DestinationDataSource;

  constructor(dataSource: DestinationDataSource) {
    this.dataSource = dataSource;
  }

  async getAll(): Promise<Destination[]> {
    const dtos = await this.dataSource.getDestinations();
    return dtos.map(mapDestination);
  }

  async getById(id: string): Promise<Destination | undefined> {
    return (await this.getAll()).find((item) => item.id === id);
  }

  async getByIds(ids: readonly string[]): Promise<Destination[]> {
    const selected = new Set(ids);
    return (await this.getAll()).filter((item) => selected.has(item.id));
  }

  async getRecommendations(query: RecommendationQuery): Promise<Destination[]> {
    return (await this.getAll()).filter((item) => item.moods.includes(query.mood) && (query.region === '전체' || item.region === query.region));
  }
}
