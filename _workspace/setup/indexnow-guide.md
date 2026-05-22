# IndexNow 설정 가이드

IndexNow는 Naver·Bing·Yandex가 지원하는 URL 즉시 색인 요청 프로토콜이다.
키 파일만 서버에 배포하면 API 호출 한 번으로 검색엔진에 즉시 색인 요청이 가능하다.

## 구성 요소

| 항목 | 위치 |
|------|------|
| 키 파일 | `public/indexnow-f7e2d1c3b4a5968071e2f3d4c5b6a791.txt` |
| 크론 라우트 | `app/api/cron/indexnow/route.ts` |
| 크론 스케줄 | `vercel.json` (월요일 09:00 KST 기준 UTC) |
| 캐시 헤더 | `next.config.mjs` (`/indexnow-:key.txt`) |

## Vercel 환경변수 추가 필요

- `CRON_SECRET`: 랜덤 문자열 (크론 API 보호용)
  - 생성: `openssl rand -hex 32`
  - 미설정 시 크론 라우트는 401을 반환한다.
- `NEXT_PUBLIC_SITE_URL`: 배포 도메인 (미설정 시 `https://my-side-contract.vercel.app` 사용)

## Naver 서치어드바이저 등록

1. https://searchadvisor.naver.com 로그인
2. 사이트 관리 → 사이트 추가: https://my-side-contract.vercel.app
3. 소유권 확인 후 IndexNow 자동 활성화됨

## Bing Webmaster Tools 등록

1. https://www.bing.com/webmasters 로그인
2. 사이트 추가: https://my-side-contract.vercel.app
3. IndexNow 키 자동 확인됨 (`/indexnow-f7e2d1c3b4a5968071e2f3d4c5b6a791.txt`)

## 수동 실행 (테스트)

```bash
curl -X GET https://my-side-contract.vercel.app/api/cron/indexnow \
  -H "Authorization: Bearer {CRON_SECRET}"
```

정상 응답 예시:

```json
{
  "success": true,
  "results": [
    { "engine": "naver", "status": "fulfilled", "httpStatus": 200 },
    { "engine": "bing", "status": "fulfilled", "httpStatus": 200 }
  ],
  "timestamp": "2026-05-22T00:00:00.000Z"
}
```

## 주의사항

- Vercel Cron 스케줄은 UTC 기준이다. `0 9 * * 1`은 UTC 월요일 09:00 = KST 월요일 18:00.
  KST 오전 9시를 원하면 `0 0 * * 1`로 조정한다.
- 색인 대상 URL은 `route.ts`의 `URLS` 배열에서 관리한다. 페이지 추가 시 함께 갱신한다.
- `result/:id` 등 noindex 페이지는 IndexNow에 제출하지 않는다.
