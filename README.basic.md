# 마음따라 여행 — 기본 화면

공식 create-ait-app 템플릿 위에 만든 여행지 추천 프로토타입입니다.

## 실행

```powershell
cd E:\ait\my-miniapp
npm run dev
```

화면: 기분·지역 선택 → 추천 목록 → 여행지 상세. 찜 목록은 localStorage에 저장됩니다.
URL 해시 경로: `#/`, `#/results`, `#/saved`, `#/place/seoul-forest`.

## 현재 범위

- 로그인·위치 권한·광고 없이 샘플 여행지 6곳으로 동작합니다.
- 그림은 직접 작성한 SVG이며 여행지의 실제 사진이 아닙니다.
- 추천은 기분 태그와 지역으로 필터링합니다. 감정 분석이나 AI 호출은 없습니다.
- 기존 광고 테스트 예제 파일은 보존하되 기본 화면에서는 연결하지 않았습니다.
- TDS 패키지는 아직 연결하지 않았습니다. 현재는 일반 HTML/CSS 기반 기본 화면입니다.

## TourAPI 연동 지점

- `src/domain/models/Destination.ts` 및 `src/data/fixtures/mockDestinationDtos.ts`: 화면에서 사용하는 여행지 모델과 샘플 데이터.
- `src/composition/destinationRepository.ts`: 향후 서버 추천 API를 호출할 곳.
- 다음 단계는 서버에서 TourAPI 데이터를 조회하고 이 모델로 변환하는 것입니다.
- 관광공사 인증키는 서버 환경변수에 보관합니다. `VITE_*`에 넣으면 브라우저 번들에 공개됩니다.
- 상세 화면의 운영시간·요금 등은 연동 전까지 표시하지 않습니다.
- API 연결 시 로딩·실패·빈 결과 화면을 그대로 사용할 수 있습니다.

## 검증

TypeScript, Vite 빌드, oxlint로 기본 구성을 확인합니다. 실제 토스 앱의 뒤로가기와 안전 영역은 실기기 검증이 필요합니다.
