# 토스 앱에서 관광정보 조회하기

토스 앱 → HTTPS API 서버(Render) → 한국관광공사 TourAPI

## 서버 배포

1. 최신 코드를 GitHub에 올립니다. .env와 .ait는 올리지 않습니다.
2. Render에서 New → Blueprint로 GitHub의 SeoSuHyeon1213/ait-trip 저장소를 연결합니다. render.yaml에 무료 Web Service 설정을 준비했습니다. 같은 서비스를 이미 만들었다면 재사용하세요.
3. 서버 환경변수 TOUR_API_ENDPOINT에 국문 서비스 기본 URL(KorService2까지), TOUR_API_SERVICE_KEY에 일반 인증키(Decoding)를 직접 입력합니다. 이 값은 서버의 환경변수에만 저장하며 프런트 VITE_ 변수로 옮기지 않습니다.
4. 배포 후 실제로 발급된 HTTPS 서비스 주소의 /healthz에 {ok:true}, /api/status에 {configured:true}가 나오는지 확인합니다.
5. API 목록 주소 /api/destinations?mood=rest로 실제 여행지가 나오는지 확인합니다.

## 토스 앱 번들 연결

1. 로컬 .env의 VITE_API_BASE_URL에 Render가 발급한 HTTPS 기본 주소만 입력합니다. /api, 인증키, 쿼리는 붙이지 않습니다.
2. npm run build로 aitmidtotrip.ait를 다시 만듭니다. 외부 주소를 비워둔 빌드는 차단합니다. 이전 번들은 외부 API 서버에 연결되지 않습니다.
3. 앱인토스 콘솔의 aitmidtotrip 앱에 새 번들을 올려 QR 테스트합니다.

## 통신 설정

SDK 3.2에 맞춰 서버는 아래 Origin만 기본 허용합니다.
- https://aitmidtotrip.apps.tossmini.com
- https://aitmidtotrip.private-apps.tossmini.com

추가 브라우저 테스트 Origin이 필요하면 서버 CORS_ALLOWED_ORIGINS에 쉼표로 추가합니다. * 대신 정확한 주소를 사용하세요. CORS는 브라우저 접근 규칙이며 사용자 인증 기능은 아닙니다.

Render 서버는 HOST=0.0.0.0으로 열고 Render가 제공하는 PORT를 사용합니다. npm run start:server는 플랫폼 환경변수를 사용하므로 서버에 .env 파일을 업로드할 필요가 없습니다. 서버 배포는 프런트 빌드 없이 실행합니다.

무료 Web Service는 15분간 요청이 없으면 쉬며 다시 시작하는 데 약 1분이 걸릴 수 있습니다. 앱은 최초 서버 상태 확인을 최대 90초 기다리고 이후 조회는 최대 30초 기다립니다. 운영 단계에서 첫 실행 지연이 문제가 되면 유료 플랜을 검토하세요.

참고:
- https://render.com/docs/free
- https://render.com/docs/blueprint-spec
- https://developers-apps-in-toss.toss.im/documentation/integration/server-api
