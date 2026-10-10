import type { DestinationDataSource, DtoPage } from './DestinationDataSource';
import type { DestinationDto } from '../dto/DestinationDto';
import type { RecommendationQuery } from '../../domain/models/Destination';
import { mockDestinationDtos } from '../fixtures/mockDestinationDtos';
export class MockDestinationDataSource implements DestinationDataSource {
  readonly sourceKind = 'mock' as const;
  async getPage(query: RecommendationQuery): Promise<DtoPage> {
    const pageNo = query.pageNo || 1; const pageSize = query.pageSize || 20;
    const all = mockDestinationDtos.filter(item => item.mood_codes.includes(query.mood) && (query.region === '전체' || item.region_name === query.region));
    return { items: structuredClone(all.slice((pageNo - 1) * pageSize, pageNo * pageSize)), pageNo, totalCount: all.length, hasMore: pageNo * pageSize < all.length };
  }
  async getById(id: string): Promise<DestinationDto | undefined> { return structuredClone(mockDestinationDtos.find(item => item.content_id === id)); }
}
