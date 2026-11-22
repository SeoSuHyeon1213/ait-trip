# Cloudflare 공개 웹 배포

공개 웹은 Cloudflare Workers Static Assets가 `dist-web/`을 제공하고, Worker가 `/api/*`에서 관광정보를 조회합니다. 브라우저에는 관광공사 키를 보내지 않습니다. API 요청/응답은 공개 화면의 일부로 열람할 수 있습니다. CORS는 타 사이트 브라우저 호출을 제한하지만 인증이나 서버 요청 차단 수단은 아닙니다.

## 키 입력 (사용자가 직접 진행)

프로젝트 폴더에서 Cloudflare 로그인 후, 다음 명령을 각각 실행합니다.

```powershell
npx wrangler login
npx wrangler secret put TOUR_API_ENDPOINT
npx wrangler secret put TOUR_API_SERVICE_KEY
```

각 명령의 입력 프롬프트에 값을 붙여넣습니다. ENDPOINT는 현재 사용 중인 관광공사 서비스의 HTTPS 기본 URL을, SERVICE_KEY는 일반(Decoding) 인증키를 입력합니다. 키를 명령 뒤에 붙이거나 채팅에 보내지 마세요. 첫 등록에서 Worker 생성을 물으면 프로젝트 이름 `aitmidtotrip`을 확인한 후 진행합니다.

대시보드에서도 Workers & Pages → 해당 Worker → Settings → Variables and Secrets → Add에서 Type을 **Secret**으로 선택하고 위 이름과 값을 입력할 수 있습니다. 키는 빌드용 환경변수에 넣지 않고 Worker 런타임 Secret에만 저장합니다. 설정을 적용하려면 Save/Deploy 안내를 따릅니다.

## 한국 중계 (relay/)

공공데이터 게이트웨이(apis.data.go.kr)는 Cloudflare 출구 IP에서 온 요청을 수시로 응답 없이 멈춥니다. 그래서 Worker는 관광공사 API를 직접 부르지 않고, Vercel 서울(icn1)에 배포한 `relay/` 함수를 거칩니다.

- 관광공사 인증키는 Vercel 환경변수 `TOUR_API_SERVICE_KEY`에만 있습니다.
- Worker와 중계는 같은 무작위 토큰을 씁니다(Vercel `RELAY_TOKEN`, Worker Secret `TOUR_API_RELAY_TOKEN`). 토큰이 없으면 중계는 401을 반환합니다.
- 중계 주소는 `wrangler.jsonc`의 `TOUR_API_RELAY_URL`입니다. 이 값을 지우면 Worker는 다시 직접 호출합니다.
- 중계 배포: GitHub `main`에 푸시하면 Vercel이 자동 배포합니다(프로젝트 Root Directory = `relay`). Root Directory가 설정되어 있으므로 `relay` 폴더 안에서 `vercel deploy`를 직접 실행하지 않습니다.
- 토큰을 바꿀 때는 두 곳을 함께 바꿉니다.

## 웹 배포

```powershell
npm ci
npm run deploy:cloudflare
```

출력되는 `https://aitmidtotrip.<계정-subdomain>.workers.dev` 주소가 공개 앱 주소입니다. `/healthz`는 서비스 응답 확인, `/api/status`는 키 내용 없이 설정 유무만 반환합니다. 화면에서 추천 조회, 상세 보기, 주소 복사, 찜 목록을 확인하세요. 키 미설정 시 배포 웹은 샘플 관광정보로 전환하지 않고 조회 실패를 표시합니다.

Git 배포를 연결한다면 Workers 프로젝트로 연결하고 Build command는 `npm run build:web`, Deploy command는 `npx wrangler deploy`를 사용합니다. Pages의 정적 파일 업로드만으로는 `/api`가 실행되지 않습니다.

## 로컬 확인

`.dev.vars.example`을 `.dev.vars`로 복사하고 본인 컴퓨터에서만 값을 입력합니다. 기존 `.env` 값을 대신 조회하거나 자동 업로드하지 않습니다. `.dev.vars`는 Git에서 제외됩니다.

```powershell
npm run dev:cloudflare
```

일반 웹 빌드는 같은 사이트의 상대 경로 `/api`를 사용하고, 주소 복사는 브라우저 Clipboard API, 찜 목록은 광고 없이 열립니다. HTTPS 또는 localhost에서 테스트하세요. 찜 기록은 브라우저별 로컬 저장이며 토스 앱과 자동 동기화되지 않습니다.

## 토스 미니앱 연결

Worker 배포 확인 후 기존 `.env`의 `VITE_API_BASE_URL`만 실제 Worker HTTPS 기본 주소로 바꾸고 `npm run build`로 `.ait`를 다시 만듭니다. 이 값은 공개 주소이므로 키가 아닙니다. `npm run deploy`는 기존 토스 배포 명령이며, Cloudflare 배포는 `npm run deploy:cloudflare`입니다. 기존 Render 서버는 새 웹과 토스 앱의 조회를 확인한 뒤 종료하세요.

## 비밀 관리

- `TOUR_API_SERVICE_KEY`를 `VITE_*`, `wrangler.jsonc`, 소스 코드에 넣지 않습니다.
- 배포되는 정적 파일은 `dist-web/`뿐입니다. 서버 `.env`와 `.dev.vars`는 포함하지 않습니다.
- 서버는 정해진 조회 API만 제공하며 상류 인증 오류 원문을 브라우저에 보내지 않습니다.
- 공개 데이터 API를 완전히 비공개로 만들 수는 없습니다. 트래픽에 따라 Cloudflare Rate Limiting/WAF로 추가 제한을 설정할 수 있습니다. 키 은닉과 API 무단 호출 방지는 별개입니다.
- 네이버 지도 연결 시 확정한 웹 도메인을 지도 서비스 URL로 등록합니다. 지도 브라우저용 키는 관광공사 서버 Secret과 용도가 다릅니다.

공식 문서: https://developers.cloudflare.com/workers/static-assets/binding/ , https://developers.cloudflare.com/workers/configuration/secrets/
