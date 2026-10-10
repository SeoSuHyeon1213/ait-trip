import { useState } from 'react';
import type { Destination } from '../domain/models/Destination';
import { Scenery } from './Scenery';
export function DestinationImage({ destination }: { destination: Destination }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  return destination.imageUrl && failedUrl !== destination.imageUrl
    ? <img className="scenery destination-photo" src={destination.imageUrl} alt={destination.name} onError={() => setFailedUrl(destination.imageUrl)} />
    : <Scenery scene={destination.scene} />;
}
