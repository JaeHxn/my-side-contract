# Twitter/X 자동 포스팅 설정 가이드

내편계약서는 Vercel Cron으로 **매주 수요일 오전 9시(KST 기준 환경에 따라 UTC 변환 주의)**에
계약서 관련 팁을 OpenAI로 생성해 Twitter/X에 자동 포스팅한다.

- Cron 경로: `/api/cron/social-post`
- 스케줄: `0 9 * * 3` (`vercel.json`에 등록됨)
- 라우트 파일: `app/api/cron/social-post/route.ts`

## 필요한 Vercel 환경변수

| 변수명 | 설명 | 획득 방법 |
|--------|------|---------|
| `CRON_SECRET` | Cron API 보호 키 | 랜덤 문자열 직접 생성 |
| `OPENAI_API_KEY` | OpenAI API 키 (트윗 생성) | 기존 분석 기능과 공유 |
| `TWITTER_API_KEY` | Twitter API 키 (Consumer Key) | Twitter Developer Portal |
| `TWITTER_API_SECRET` | Twitter API 시크릿 (Consumer Secret) | Twitter Developer Portal |
| `TWITTER_ACCESS_TOKEN` | 액세스 토큰 | Twitter Developer Portal |
| `TWITTER_ACCESS_TOKEN_SECRET` | 액세스 토큰 시크릿 | Twitter Developer Portal |

선택 환경변수:

| 변수명 | 기본값 | 설명 |
|--------|--------|------|
| `OPENAI_TWEET_MODEL` | `gpt-4o-mini` | 트윗 생성에 쓸 OpenAI 모델 |
| `NEXT_PUBLIC_SITE_URL` | `https://my-side-contract.vercel.app` | 트윗에 넣을 서비스 URL |

> 참고: 트윗 발송은 OAuth 1.0a 사용자 인증을 사용한다. Twitter API v2의
> `POST /2/tweets` 엔드포인트는 Bearer Token(앱 전용 인증)으로는 쓰기가
> 불가능하므로 `TWITTER_BEARER_TOKEN`은 필요하지 않다.

## Twitter Developer 계정 만들기

1. https://developer.twitter.com 접속
2. "Sign up" → 개발자 계정 신청 (무료 Free 플랜으로 충분)
3. 사용 목적: "Making a bot" 또는 개인 용도 선택
4. Project + App 생성

## 앱 권한 설정 (중요)

1. Twitter App → "Settings" → "User authentication settings" → "Set up"
2. **App permissions**: `Read and Write` 선택 (트윗 발송에 필수)
3. Type of App: `Web App, Automated App or Bot`
4. Callback URI / Website URL: 서비스 URL 입력 (예: `https://my-side-contract.vercel.app`)
5. 저장 후 "Keys and Tokens" 탭으로 이동

## 키와 토큰 발급

"Keys and Tokens" 탭에서:

- **Consumer Keys** → `API Key`, `API Key Secret` 복사
  → `TWITTER_API_KEY`, `TWITTER_API_SECRET`
- **Access Token and Secret** → "Generate" 클릭
  → `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET`

> 주의: App permissions를 `Read and Write`로 바꾼 **후에** Access Token을
> 재생성해야 한다. 권한 변경 전에 만든 토큰은 읽기 전용이라 트윗 발송이 실패한다.

## Vercel에 환경변수 추가

```bash
vercel env add CRON_SECRET
vercel env add OPENAI_API_KEY
vercel env add TWITTER_API_KEY
vercel env add TWITTER_API_SECRET
vercel env add TWITTER_ACCESS_TOKEN
vercel env add TWITTER_ACCESS_TOKEN_SECRET
```

각 명령 실행 후 값을 입력하고 적용 환경(Production / Preview)을 선택한다.
변경 후에는 재배포해야 적용된다.

## 수동 테스트

```bash
curl -X GET https://my-side-contract.vercel.app/api/cron/social-post \
  -H "Authorization: Bearer {CRON_SECRET}"
```

성공 응답 예시:

```json
{
  "success": true,
  "tweet": "...",
  "tweetId": "1234567890",
  "timestamp": "2026-05-22T00:00:00.000Z"
}
```

실패 시 `success: false`와 `error` 메시지가 반환된다.

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| `401 Unauthorized` (라우트 자체) | `CRON_SECRET` 불일치 또는 미설정 | Vercel 환경변수와 요청 헤더 확인 |
| `Twitter API error: 401` | OAuth 키/토큰 오류 또는 시계 불일치 | 키 재확인, Access Token 재생성 |
| `Twitter API error: 403` | 앱 권한이 Read 전용 | App permissions를 Read and Write로 변경 후 토큰 재발급 |
| `OPENAI_API_KEY not configured` | 환경변수 누락 | Vercel에 `OPENAI_API_KEY` 추가 |
| `Twitter API error: 187` | 중복 트윗 | 동일 내용 재발송 — 정상, 다음 주기에 새 내용 생성됨 |

## 동작 방식 요약

1. Vercel Cron이 수요일 09:00에 `/api/cron/social-post` GET 호출
2. 라우트가 `CRON_SECRET`으로 요청 인증
3. 8개 주제 후보 중 랜덤 선택 → OpenAI로 230자 이내 팁 트윗 생성
4. 280자 초과 시 안전하게 절삭
5. OAuth 1.0a(HMAC-SHA1) 서명으로 Twitter API v2에 트윗 발송
