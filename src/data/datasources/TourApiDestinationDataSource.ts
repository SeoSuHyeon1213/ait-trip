import { getApiUrl } from '../../config/apiBase.mjs';
import type { DestinationDataSource, DtoPage } from './DestinationDataSource';
import type { RecommendationQuery } from '../../domain/models/Destination';
import type { DestinationDto } from '../dto/DestinationDto';
import type { TourPageDto, TourDetailDto } from '../dto/TourApiDto';
import { mapTourDestination } from '../mappers/TourDestinationMapper';
export function apiUrl(path: string) { return getApiUrl(import.meta.env.VITE_API_BASE_URL, path, import.meta.env.PROD); }
export async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(apiUrl(path), { signal: AbortSignal.timeout(path === '/api/status' ? 90000 : 30000) });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || '여행지 요청에 실패했어요.');
  return value as T;
}
export class TourApiDestinationDataSource implements DestinationDataSource {
  readonly sourceKind = 'api' as const;
  async getPage(query: RecommendationQuery): Promise<DtoPage> {
    const params = new URLSearchParams({ mood: query.mood, region: query.region, pageNo: String(query.pageNo || 1), pageSize: String(query.pageSize || 20) });
    const page = await requestJson<TourPageDto>('/api/destinations?' + params);
    return { ...page, items: page.items.map(item => mapTourDestination(item, page.regions, page.classifications)) };
  }
  async getById(id: string): Promise<DestinationDto | undefined> {
    if (!/^\d+$/.test(id)) return undefined; // 샘플 ID는 실제 API ID로 조회하지 않습니다.
    const response = await fetch(apiUrl('/api/destinations/' + encodeURIComponent(id)), { signal: AbortSignal.timeout(30000) });
    if (response.status === 404) return undefined;
    const detail = await response.json() as TourDetailDto & { error?: string };
    if (!response.ok) throw new Error(detail.error || '여행지 상세 요청에 실패했어요.');
    return mapTourDestination(detail.item, detail.regions, detail.classifications, detail);
  }
}
