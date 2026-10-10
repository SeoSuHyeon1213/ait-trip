import type { Destination, Mood } from '../../domain/models/Destination';
import type { DestinationDto } from '../dto/DestinationDto';

const validMoods = new Set<string>(['rest', 'refresh', 'explore', 'together']);
const validScenes = new Set<string>(['forest', 'sea', 'city', 'garden']);

export function mapDestination(dto: DestinationDto): Destination {
  if (!dto.content_id.trim() || !dto.title.trim()) throw new Error('여행지 ID와 이름이 필요합니다.');
  if (!validScenes.has(dto.illustration_type)) throw new Error('지원하지 않는 풍경 유형입니다: ' + dto.illustration_type);
  if (dto.mood_codes.some((mood) => !validMoods.has(mood))) throw new Error('지원하지 않는 기분 코드입니다.');
  const reasons: Partial<Record<Mood, string>> = {};
  for (const [mood, reason] of Object.entries(dto.recommendation_reasons)) {
    if (validMoods.has(mood)) reasons[mood as Mood] = reason;
  }
  return {
    id: dto.content_id,
    name: dto.title,
    region: dto.region_name as Destination['region'],
    location: dto.location_label,
    category: dto.category_name,
    tags: [...dto.tag_names],
    moods: [...dto.mood_codes] as Mood[],
    description: dto.overview,
    reason: reasons,
    imageUrl: dto.image_url, imageCopyright: dto.image_copyright, latitude: dto.latitude, longitude: dto.longitude, contentTypeId: dto.content_type_id, visitInfo: dto.visit_info ? { ...dto.visit_info } : undefined,
    scene: dto.illustration_type as Destination['scene'],
  };
}
