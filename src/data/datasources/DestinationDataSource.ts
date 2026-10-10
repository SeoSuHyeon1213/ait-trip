import type { DestinationDto } from '../dto/DestinationDto';
import type { RecommendationQuery } from '../../domain/models/Destination';
export interface DtoPage { items: DestinationDto[]; pageNo: number; totalCount: number; hasMore: boolean }
export interface DestinationDataSource {
  readonly sourceKind: 'mock' | 'api';
  getPage(query: RecommendationQuery): Promise<DtoPage>;
  getById(id: string): Promise<DestinationDto | undefined>;
}
