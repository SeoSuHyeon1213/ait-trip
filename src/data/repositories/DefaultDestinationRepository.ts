import type { DestinationRepository } from '../../domain/repositories/DestinationRepository';
import type { Destination, DestinationPage, RecommendationQuery } from '../../domain/models/Destination';
import type { DestinationDataSource } from '../datasources/DestinationDataSource';
import { mapDestination } from '../mappers/DestinationMapper';
export class DefaultDestinationRepository implements DestinationRepository {
  private readonly dataSource: DestinationDataSource;
  constructor(source: DestinationDataSource) { this.dataSource = source; }
  get sourceKind() { return this.dataSource.sourceKind; }
  async getRecommendations(query: RecommendationQuery): Promise<DestinationPage> { const page = await this.dataSource.getPage(query); return { ...page, items: page.items.map(mapDestination) }; }
  async getById(id: string): Promise<Destination | undefined> { const dto = await this.dataSource.getById(id); return dto ? mapDestination(dto) : undefined; }
  async getByIds(ids: readonly string[]): Promise<Destination[]> { const items = await Promise.all([...new Set(ids)].map(id => this.getById(id))); return items.filter((item): item is Destination => !!item); }
}
