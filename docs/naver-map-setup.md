# 네이버 지도 연결

여행지 상세 화면에 관광공사 좌표 기반 네이버 지도와 마커를 표시합니다. 위치 정보가 없으면 주소 안내를, 키 미설정·인증 실패·연결 지연 시 재시도 안내를 표시합니다. 현위치 권한은 필요하지 않습니다.

## 사용자가 직접 설정할 항목

1. 네이버 클라우드 콘솔에서 **Maps** 애플리케이션을 생성하고 **Web Dynamic Map** 사용을 선택합니다. 서비스 이용 요금과 이용 한도를 확인하세요.
2. **Web 서비스 URL**에 다음 공개 웹 주소를 등록합니다.

   `https://aitmidtotrip.giornogiobana1234.workers.dev`

   로컬 검증을 원한다면 실제 개발용 localhost 주소도 등록합니다. 토스 번들에서도 지도 사용 시 `https://aitmidtotrip.apps.tossmini.com`, `https://aitmidtotrip.private-apps.tossmini.com`을 추가 등록하고 실기기에서 확인합니다.
3. 인증 정보의 **Client ID (ncpKeyId)**를 확인합니다. **Client Secret은 이 기능에 필요하지 않습니다.**
4. Cloudflare → Workers & Pages → **aitmidtotrip** → Settings → Variables and Secrets → Add에서 이름을 **NAVER_MAP_CLIENT_ID**, 값에 위 Client ID를 입력하고 저장·배포합니다. Type은 Text로 설정해도 됩니다. 이 ID는 브라우저 SDK를 위해 공개되는 식별자입니다. Secret으로 저장하더라도 브라우저에서는 보이므로 네이버의 허용 도메인으로 사용처를 제한해야 합니다.
5. 웹사이트에서 여행지 상세 화면을 다시 열어 지도가 표시되는지 확인합니다. Cloudflare 런타임 설정이므로 앱 코드 재빌드는 필요 없습니다.

CLI 입력을 원한다면 프로젝트 폴더에서 `npx wrangler secret put NAVER_MAP_CLIENT_ID`를 실행하고 입력 프롬프트에 **Client ID**를 붙여넣으세요. 관광공사 `TOUR_API_SERVICE_KEY`는 그대로 유지하고, 네이버 Client Secret은 입력하지 마세요.

## 키 보호 방식

- 관광공사 키는 기존처럼 서버 Secret에만 남습니다.
- `/api/map-config`는 네이버 브라우저용 Client ID 하나만 반환합니다. 다른 Secret이나 환경설정은 반환하지 않습니다.
- 네이버 지도는 `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=...`를 사용하는 JavaScript SDK입니다. iframe이나 외부 지도 페이지 이동은 사용하지 않습니다.
- Client ID의 비밀 유지 대신 도메인 제한과 네이버 콘솔의 이용 한도를 사용합니다. 지도 화면에는 여행지의 공개 좌표만 전달하고 사용자 현위치는 수집하지 않습니다.

공식 문서: https://navermaps.github.io/maps.js.ncp/docs/tutorial-1-Getting-Client-ID.html , https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html
