---
name: legal-api
description: "국가법령정보센터 Open API 연동 전문 가이드. 주택임대차보호법, 근로기준법 등 계약서 분석에 필요한 법령 조문을 실시간 조회하는 코드를 작성할 때 사용한다. '법령 API', '법령 조회', '국가법령정보센터', '최신 법 조항', '법 개정 반영' 등을 언급하거나 법령 API 관련 코드를 작성/수정/디버깅할 때 반드시 이 스킬을 사용한다."
---

# 국가법령정보센터 API 연동 가이드

API 키 발급: https://www.law.go.kr/LSW/opnSvcInfo.do (무료, 당일 발급)

## 핵심 엔드포인트

### 1. 법령 목록 검색

```
GET https://www.law.go.kr/DRF/lawSearch.do
  ?OC={발급받은_ID}
  &target=law
  &type=JSON
  &query={검색어}
  &page=1
  &display=10
```

### 2. 법령 본문 조회 (조문 전체)

```
GET https://www.law.go.kr/DRF/lawService.do
  ?OC={발급받은_ID}
  &target=law
  &type=JSON
  &ID={법령ID}
```

### 3. 특정 조문 조회

```
GET https://www.law.go.kr/DRF/lawService.do
  ?OC={발급받은_ID}
  &target=lawjosub
  &type=JSON
  &ID={법령ID}
  &JO={조번호 6자리}
```

`target=lawjosub`는 `ID` 또는 `MST` 중 하나가 필요하다. 예: `ID=001823&JO=000300`.
법령명만 있을 때는 먼저 `lawSearch.do`로 `법령ID` 또는 `법령일련번호(MST)`를 찾은 뒤 조회한다.

## 계약서 유형별 핵심 법령 ID

| 계약서 유형 | 법령명 | 주요 조문 |
|-----------|--------|---------|
| 주거 | 주택임대차보호법 | 3조(대항력), 4조(기간), 6조(묵시적갱신), 7조(차임증감) |
| 주거 | 민법 | 618~654조(임대차) |
| 근로 | 근로기준법 | 17조(근로조건명시), 43조(임금지급), 60조(연차) |
| 근로 | 최저임금법 | 6조(최저임금 적용) |
| 웨딩 | 소비자기본법 | 19조(계약 해제) |
| 프리랜서 | 민법 | 680~692조(위임), 664~674조(도급) |

## TypeScript 클라이언트 구현 패턴

```typescript
// lib/legal-api/client.ts
const BASE_URL = 'https://www.law.go.kr/DRF'
const OC = process.env.LAW_API_OC  // 환경변수로 관리

export async function fetchLawArticles(lawName: string): Promise<LawArticle[]> {
  // 1. 법령 검색으로 ID 조회
  const searchRes = await fetch(
    `${BASE_URL}/lawSearch.do?OC=${OC}&target=law&type=JSON&query=${encodeURIComponent(lawName)}`
  )
  const searchData = await searchRes.json()
  const lawId = searchData.LawSearch.law[0].법령ID

  // 2. 법령 본문 조회
  const lawRes = await fetch(
    `${BASE_URL}/lawService.do?OC=${OC}&target=lawjosub&type=JSON&ID=${lawId}&JO=000400`
  )
  return parseLawArticles(await lawRes.json())
}
```

## Supabase 캐싱 패턴

법령 API는 자주 변경되지 않으므로 24시간 캐싱이 효과적이다.

```typescript
// lib/legal-api/cache.ts
export async function getCachedLaw(lawName: string, supabase: SupabaseClient) {
  const { data } = await supabase
    .from('legal_cache')
    .select('*')
    .eq('law_name', lawName)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (data) return data.content

  // 캐시 미스 → API 조회 후 저장
  const articles = await fetchLawArticles(lawName)
  await supabase.from('legal_cache').upsert({
    law_name: lawName,
    content: articles,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  })
  return articles
}
```

**`legal_cache` 테이블 스키마:**
```sql
create table legal_cache (
  id uuid primary key default gen_random_uuid(),
  law_name text unique not null,
  content jsonb not null,
  revision_date text,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);
```

## OpenAI 프롬프트에 법령 삽입하는 이유

OpenAI API에 계약서만 보내면 모델이 학습 시점의 법률로 판단할 수 있다. 법령 API로 가져온 **현재 조문 텍스트를 시스템 프롬프트에 직접 삽입**하면:
- 법 개정이 반영된 최신 기준으로 분석
- 환각 방지 (실제 조문 근거 명시 가능)
- 이 서비스의 핵심 차별점 ("ChatGPT와 달리 항상 최신 법 기준")

## 자주 발생하는 오류

| 오류 | 원인 | 해결 |
|------|------|------|
| 401 Unauthorized | OC 파라미터 누락/오류 | 환경변수 확인 |
| 사용자 정보 검증 실패 | Open API 신청 정보에 서버 IP/도메인 미등록 | 국가법령정보센터 신청 화면에서 호출 서버 IP 또는 배포 도메인 등록 |
| 빈 결과 반환 | 검색어 인코딩 문제 | `encodeURIComponent()` 적용 |
| XML 응답 | `type=JSON` 누락 | 파라미터 확인 |
| 타임아웃 | API 서버 부하 | 3초 타임아웃 설정, 캐시 폴백 |
