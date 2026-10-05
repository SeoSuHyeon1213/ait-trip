# 마음따라 여행

사용자의 기분과 원하는 지역에 맞는 국내 여행지를 추천하는 **앱인토스 미니앱**입니다.
한국관광공사 TourAPI를 활용한 여행지 추천 서비스를 목표로 개발하고 있습니다.

## 주요 기능

- 기분 4가지와 여행 지역 선택
- 기분·지역 조건에 맞는 여행지 추천 및 추천 이유 제공
- 여행지 상세 화면
- 찜 저장·해제 및 찜 목록 확인

현재는 샘플 여행지 6곳으로 동작합니다. 한국관광공사 API, AI 감정 분석, 로그인 및 TDS는 아직 연결하지 않았습니다. 화면의 풍경 그림은 실제 여행지 사진이 아닌 SVG 일러스트입니다. 찜 목록은 기기의 브라우저에 저장됩니다.

## 기술 구성

React · TypeScript · Vite · Apps in Toss Web Framework

## 실행 방법

Node.js와 npm이 설치된 환경에서 실행합니다.

```bash
npm ci
npm run dev
```

```bash
npm run build    # 웹 및 앱인토스 번들 빌드
npm run lint     # 코드 검사
```

## 주요 파일

```text
src/App.tsx                     화면 구성, 이동 및 찜 상태
src/domain/                    여행지 모델과 Repository 인터페이스
src/data/                      DataSource · DTO · Mapper · Repository 구현
src/composition/               구현체 조립
src/config/travelOptions.ts    기분·지역 선택지
src/components/Scenery.tsx      풍경 SVG 일러스트
apps-in-toss.config.ts          앱인토스 설정
```

## 다음 개발 단계

한국관광공사 **국문 관광정보 서비스_GW**를 연동해 실제 여행지 정보와 사진을 제공할 예정입니다. API 인증키는 서버에서 관리하며 프론트엔드 코드나 `VITE_*` 환경변수에 넣지 않습니다.

## 데이터 구조

`DataSource → DTO → Mapper → Repository`로 데이터를 전달합니다. 현재는 Mock DataSource를 사용하며 화면에서는 Repository가 반환한 도메인 모델을 사용합니다. 자세한 설명은 [데이터 구조](docs/data-architecture.md)를 참고하세요.
