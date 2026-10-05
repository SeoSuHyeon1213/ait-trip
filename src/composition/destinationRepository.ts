import type { DestinationRepository } from '../domain/repositories/DestinationRepository';
import { DefaultDestinationRepository } from '../data/repositories/DefaultDestinationRepository';
import { MockDestinationDataSource } from '../data/datasources/MockDestinationDataSource';

// API 권한 발급 후 DataSource 구현을 교체하는 조립 지점입니다.
export const destinationRepository: DestinationRepository = new DefaultDestinationRepository(new MockDestinationDataSource());
