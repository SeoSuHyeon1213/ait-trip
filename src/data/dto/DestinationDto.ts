// 앱 내부 데이터 전달용 DTO입니다. TourAPI 공식 응답 형식이 아닙니다.
// 실제 API 연동 시 외부 응답 검증과 변환을 DataSource 경계에 추가합니다.
export interface DestinationDto {
  content_id: string;
  title: string;
  region_name: string;
  location_label: string;
  category_name: string;
  tag_names: string[];
  mood_codes: string[];
  overview: string;
  recommendation_reasons: Record<string, string>;
  image_url?: string; image_copyright?: string; latitude?: number; longitude?: number; content_type_id?: string;
  visit_info?: { hours?: string; fee?: string; closedDays?: string; phone?: string };
  illustration_type: string;
}
