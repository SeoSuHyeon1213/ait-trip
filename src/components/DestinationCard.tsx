import type { Destination } from '../domain/models/Destination';
import { getDestinationTheme } from '../domain/travelPresentation';
import { DestinationImage } from './DestinationImage';
import { BookmarkIcon } from './TravelIcons';

export function DestinationCard({ destination, index, isSaved, isPassport = false, onOpen, onToggle }: {
  destination: Destination; index: number; isSaved: boolean; isPassport?: boolean;
  onOpen: () => void; onToggle: () => void;
}) {
  const theme = getDestinationTheme(destination);
  return <article className={`destination-card${isPassport ? ' passport-destination' : ''}`}>
    <button className="card-link" type="button" onClick={onOpen} aria-label={`${destination.name} 상세 보기`}>
      <div className="card-body">
        <span className="destination-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <h2>{destination.name}</h2>
        <p className="destination-location">{destination.location.split(/\s+/).slice(0, 2).join(' ')}</p>
        <div className="tags"><span className={`theme-tag theme-${destination.moods[0] || 'rest'}`}>{theme}</span></div>
      </div>
      <div className="destination-window"><DestinationImage destination={destination} /><span className="window-shine" /></div>
    </button>
    <button className={`save-button ${isSaved ? 'is-saved' : ''}`} type="button" aria-pressed={isSaved} aria-label={`${destination.name} ${isSaved ? '찜 해제' : '찜하기'}`} onClick={onToggle}>
      <BookmarkIcon filled={isSaved} />
    </button>
  </article>;
}
