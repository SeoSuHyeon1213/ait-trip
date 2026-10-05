import type { DestinationDto } from '../dto/DestinationDto';

export interface DestinationDataSource {
  getDestinations(): Promise<DestinationDto[]>;
}
