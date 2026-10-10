import { DefaultDestinationRepository } from '../data/repositories/DefaultDestinationRepository';
import { MockDestinationDataSource } from '../data/datasources/MockDestinationDataSource';
import { TourApiDestinationDataSource, requestJson } from '../data/datasources/TourApiDestinationDataSource';
import type { DestinationDataSource } from '../data/datasources/DestinationDataSource';
import type { RecommendationQuery } from '../domain/models/Destination';
class ConfiguredDataSource implements DestinationDataSource {
  private selected: DestinationDataSource = new MockDestinationDataSource();
  private ready?: Promise<void>;
  get sourceKind() { return this.selected.sourceKind; }
  private async initialize() {
    this.ready ??= requestJson<{ configured: boolean }>('/api/status').then(status => { if (import.meta.env.PROD && !status.configured) throw new Error('배포 서버의 관광정보 API 설정이 비어 있어요.'); this.selected = status.configured ? new TourApiDestinationDataSource() : new MockDestinationDataSource(); });
    try { await this.ready; } catch (error) { this.ready = undefined; throw error; }
  }
  async getPage(query: RecommendationQuery) { await this.initialize(); return this.selected.getPage(query); }
  async getById(id: string) { await this.initialize(); return this.selected.getById(id); }
}
export const destinationRepository = new DefaultDestinationRepository(new ConfiguredDataSource());
