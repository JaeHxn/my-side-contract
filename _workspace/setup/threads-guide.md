# Threads 자동 포스팅 설정 가이드

## 필요한 Vercel 환경변수

| 변수명 | 설명 |
|--------|------|
| `CRON_SECRET` | Cron API 보호 키 (아무 랜덤 문자열) |
| `THREADS_ACCESS_TOKEN` | Threads 장기 액세스 토큰 (60일) |
| `THREADS_USER_ID` | Threads 사용자 ID (선택, 없으면 "me" 사용) |
| `OPENAI_API_KEY` | 이미 설정됨 (계약서 분석용과 동일) |

---

## Access Token 발급 방법

### 1. Meta 개발자 계정 만들기
👉 https://developers.facebook.com 접속 → 로그인 (Threads 계정과 연결된 Instagram 계정)

### 2. 앱 생성
- "내 앱" → "앱 만들기"
- 유형: **기타** 선택
- 카테고리: **없음** 선택 (소비자용이 아닌 개인 용도)

### 3. Threads API 추가
- 앱 대시보드 → "제품 추가" → **Threads API** 추가

### 4. 단기 Access Token 발급 (유효기간 1시간)
앱 대시보드 → Threads API → "액세스 토큰 생성":
```
GET https://graph.threads.net/oauth/access_token
  ?client_id={앱 ID}
  &client_secret={앱 시크릿}
  &grant_type=authorization_code
  &redirect_uri={리다이렉트 URI}
  &code={인증 코드}
```
또는 Threads API 문서의 "액세스 토큰" 섹션에서 GUI로 발급 가능.

### 5. 장기 Access Token으로 교환 (유효기간 60일)
```bash
curl -X GET "https://graph.threads.net/access_token
  ?grant_type=th_exchange_token
  &client_secret={앱 시크릿}
  &access_token={단기 토큰}"
```
반환된 `access_token` 값을 Vercel 환경변수에 저장.

### 6. 내 사용자 ID 확인 (선택)
```bash
curl "https://graph.threads.net/v1.0/me?access_token={토큰}"
```
반환된 `id` 값 → `THREADS_USER_ID`에 저장 (없어도 동작함)

---

## Vercel 환경변수 추가
```bash
vercel env add THREADS_ACCESS_TOKEN
vercel env add CRON_SECRET
# THREADS_USER_ID는 선택 (없어도 됨)
```

---

## CRON_SECRET 생성
아무 랜덤 문자열 사용:
- PowerShell: `[System.Guid]::NewGuid().ToString("N")`
- 또는 그냥 아무 문자열: `my-super-secret-2026`

---

## 토큰 갱신 (60일마다)
장기 토큰은 60일 후 만료. 만료 전 갱신:
```bash
curl "https://graph.threads.net/refresh_access_token
  ?grant_type=th_refresh_token
  &access_token={현재 토큰}"
```
갱신 시 유효기간이 다시 60일로 리셋됨.

---

## 수동 테스트
배포 후 아래 명령어로 즉시 포스팅 테스트:
```bash
curl -X GET https://my-side-contract.vercel.app/api/cron/social-post \
  -H "Authorization: Bearer {CRON_SECRET 값}"
```

---

## 스케줄
- **매주 수요일 오전 9시 UTC** (= 한국시간 수요일 오후 6시)
- 한국시간 오전 9시로 바꾸려면 `vercel.json`에서 `"0 0 * * 3"` 으로 변경

---

## 포스팅 내용 커스터마이징
`app/api/cron/social-post/route.ts`의 `POST_TOPICS` 배열에 원하는 주제 추가 가능.
