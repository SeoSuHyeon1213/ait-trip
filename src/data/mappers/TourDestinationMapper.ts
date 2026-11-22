import { moodThemes, matchesMoodTheme } from '../../config/moodThemes.mjs';
import type { Mood } from '../../domain/models/Destination';
import type { DestinationDto } from '../dto/DestinationDto';
import type { TourItemDto, TourDetailDto, RegionCodeDto, ClassificationDto } from '../dto/TourApiDto';
// TourAPI HTML is displayed as text, never injected into the page.
export function plainText(value?: string): string {
  const entities: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  return (value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/?(?:p|div|ul|ol|h[1-6])\b[^>]*>/gi, '\n\n')
    .replace(/<\/li\s*>\s*(?=<li\b)/gi, '')
    .replace(/<li\b[^>]*>/gi, '\n• ')
    .replace(/<\/li\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|nbsp|amp|lt|gt|quot|apos);/gi, (entity, code: string) => {
      if (!code.startsWith('#')) return entities[code.toLowerCase()] ?? entity;
      const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : entity;
    })
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
function coordinate(value?: string) { if (!value?.trim()) return undefined; const result = Number(value); return Number.isFinite(result) ? result : undefined; }
function boundedCoordinate(value: string | undefined, limit: number) { const result = coordinate(value); return result !== undefined && Math.abs(result) <= limit ? result : undefined; }
function imageUrl(value?: string) { try { const url = new URL(value || ''); if (url.protocol === 'http:' && url.hostname === 'tong.visitkorea.or.kr') url.protocol = 'https:'; return url.protocol === 'https:' ? url.href : undefined; } catch { return undefined; } }
export function mapTourDestination(item: TourItemDto, regions: RegionCodeDto[], classes: ClassificationDto[], detail?: TourDetailDto): DestinationDto {
  const category = ({ '12': '관광지', '14': '문화시설', '15': '축제·행사', '25': '여행코스', '28': '레포츠', '32': '숙박', '38': '쇼핑', '39': '음식점' } as Record<string, string>)[item.contenttypeid] || '여행지';
  const classification = classes.find(code => code.lclsSystm3Cd === item.lclsSystm3 && !!item.lclsSystm3);
  const intro = detail?.intro || {};
  const types: Record<string, string[]> = { '12': ['usetime', '', 'restdate', 'infocenter'], '14': ['usetimeculture', 'usefee', 'restdateculture', 'infocenterculture'], '28': ['usetimeleports', 'usefeeleports', 'restdateleports', 'infocenterleports'], '38': ['opentime', '', 'restdateshopping', 'infocentershopping'], '39': ['opentimefood', '', 'restdatefood', 'infocenterfood'], '32': ['checkintime', '', '', 'infocenterlodging'], '15': ['playtime', 'usetimefestival', '', 'sponsor1tel'] };
  const fields = types[item.contenttypeid] || [];
  const address = plainText([item.addr1, item.addr2].filter(Boolean).join(' ')).replace(/\s+/g, ' ');
  const region = regions.find(code => String(code.code) === item.lDongRegnCd)?.name || '지역 미제공';
  const tag = classification?.lclsSystm3Nm || category;
  const moods = (Object.keys(moodThemes) as Mood[]).filter(mood => matchesMoodTheme(item, mood));
  return { content_id: item.contentid, title: item.title, region_name: region, location_label: address || region, address: address || undefined, category_name: category, tag_names: [tag], mood_codes: moods, overview: plainText(item.overview) || '소개 정보가 아직 제공되지 않았어요.', recommendation_reasons: Object.fromEntries(moods.map(mood => [mood, tag + ' 분류를 바탕으로 추천해요. ' + moodThemes[mood].reason])), illustration_type: item.contenttypeid === '14' ? 'city' : 'forest', image_url: imageUrl(item.firstimage) || imageUrl(detail?.images[0]?.originimgurl), image_copyright: item.cpyrhtDivCd || detail?.images[0]?.cpyrhtDivCd, latitude: boundedCoordinate(item.mapy, 90), longitude: boundedCoordinate(item.mapx, 180), content_type_id: item.contenttypeid, visit_info: detail ? { hours: plainText(intro[fields[0]]), fee: plainText(intro[fields[1]]), closedDays: plainText(intro[fields[2]]), phone: plainText(intro[fields[3]] || item.tel) } : undefined };
}
