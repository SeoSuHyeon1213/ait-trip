import { useState } from 'react';
import type { Destination } from '../domain/models/Destination';
import { Scenery } from './Scenery';
export function DestinationImage({ destination, onImageError }: { destination: Destination; onImageError?: () => void }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  return destination.imageUrl && failedUrl !== destination.imageUrl
    ? <img className="scenery destination-photo" src={destination.imageUrl} alt={destination.name} onError={() => { setFailedUrl(destination.imageUrl); onImageError?.(); }} />
    : <Scenery scene={destination.scene} />;
}
