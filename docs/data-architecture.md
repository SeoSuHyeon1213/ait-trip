# 여행지 데이터 구조

반환 흐름은 DataSource → DTO → Mapper → Repository → 화면입니다.

- 서버: server/tour-api.mjs에서 일반 인증키를 보관하고 TourAPI 요청·응답 래퍼·XML 오류·캐싱을 처리합니다.
- 원본 DTO: src/data/dto/TourApiDto.ts에 목록·상세·지역·분류 구조를 정의합니다.
- Mapper: TourDestinationMapper에서 코드·사진·좌표·타입별 방문정보를 내부 DTO로 변환합니다. DestinationMapper는 내부 DTO를 화면 모델로 변환합니다.
- DataSource: Mock 또는 TourApiDestinationDataSource를 사용합니다. getPage와 getById를 지원합니다.
- Repository: 페이지 목록 및 ID 기반 상세·찜 조회를 제공하며 DTO를 화면에 직접 전달하지 않습니다.
- Composition: /api/status로 서버 설정 유무를 확인한 뒤 구현체를 선택합니다. API 오류를 Mock 성공으로 대체하지 않습니다.

설정은 [TourAPI 설정](tour-api-setup.md)을 참고하세요. 새 코드 이름은 lDongRegnCd/lDongSignguCd 및 lclsSystm1/2/3을 사용합니다. 샘플 문자열 ID와 실제 콘텐츠 ID를 분리합니다.

기분은 API 원본 필드가 아닙니다. 현재는 moodThemes.mjs의 기분별 분류체계(lclsSystm1/2)로 목록을 조회하며 화면 설명과 추천 이유에도 같은 테마 규칙을 사용합니다. 전라 지역 선택은 두 시도의 조회 결과를 묶습니다.

추가 사진·소개 조회는 상세 화면에서 수행하고, 목록에는 페이지 정보와 대표 이미지를 사용합니다. 지역/분류/상세 응답은 서버에 5분 캐싱합니다. 실제 토스 앱은 별도로 배포한 HTTPS API 서버 연결이 필요합니다.
