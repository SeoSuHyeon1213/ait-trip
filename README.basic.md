# 마음따라 여행 기본 구성

프로젝트 경로: D:\games\ait-trip

실행: npm ci → npm run dev

기분·지역 선택, 페이지별 추천 목록, 개별 상세, 기기 내 찜 목록을 지원합니다.
.env의 TOUR_API_ENDPOINT와 TOUR_API_SERVICE_KEY는 공백입니다. 값을 입력하고 서버를 재시작하면 실제 API를 사용합니다. 미입력 상태에서는 샘플 6곳으로 동작합니다.

자세한 설정은 docs/tour-api-setup.md, 계층 구조는 docs/data-architecture.md를 참고하세요.
인증키는 서버 설정에만 넣습니다. 별도 토스 실기기/API 인증 검증은 아직 수행하지 않았습니다.
