import type { DestinationDataSource } from './DestinationDataSource';
import type { DestinationDto } from '../dto/DestinationDto';
import { mockDestinationDtos } from '../fixtures/mockDestinationDtos';

export class MockDestinationDataSource implements DestinationDataSource {
  private readonly fixtures: readonly DestinationDto[];

  constructor(fixtures: readonly DestinationDto[] = mockDestinationDtos) {
    this.fixtures = fixtures;
  }

  async getDestinations(): Promise<DestinationDto[]> {
    return structuredClone(this.fixtures) as DestinationDto[];
  }
}
