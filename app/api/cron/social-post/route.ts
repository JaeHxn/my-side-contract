import { NextResponse } from "next/server";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const TWITTER_TWEETS_URL = "https://api.twitter.com/2/tweets";
const DEFAULT_TWEET_MODEL = "gpt-4o-mini";
const SERVICE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://my-side-contract.vercel.app";
const TWEET_MAX_LENGTH = 280;

// OpenAI에 전달할 계약서 팁 주제 후보
const TWEET_TOPICS: readonly string[] = [
  "전월세 계약서에서 계약갱신요구권 포기 조항 주의",
  "근로계약서에 포괄임금제가 들어있다면 확인해야 할 것",
  "퇴직 위약금 조항이 있는 근로계약서 서명하면 안 되는 이유",
  "전세 보증금 반환 관련 특약 꼭 넣어야 하는 이유",
  "프리랜서 계약서 저작권 조항 확인 포인트",
  "인테리어 계약서 하자보수 기간 확인하는 방법",
  "알바 계약서에 반드시 있어야 하는 6가지",
  "전세사기 예방을 위해 계약 전 반드시 확인해야 할 것",
];

interface OAuthCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

interface TwitterCreateResponse {
  data?: { id?: string; text?: string };
}

// Vercel Cron에서 호출되는 라우트. CRON_SECRET으로 보호한다.
export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");

  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tweet = await generateTweet();
    const result = await postToTwitter(tweet);

    return NextResponse.json({
      success: true,
      tweet,
      tweetId: result.data?.id ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

// 트윗 생성 — OpenAI Chat Completions API를 fetch로 직접 호출한다.
async function generateTweet(): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const topic =
    TWEET_TOPICS[Math.floor(Math.random() * TWEET_TOPICS.length)];

  const response = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TWEET_MODEL?.trim() || DEFAULT_TWEET_MODEL,
      max_tokens: 300,
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: `다음 주제로 트윗 1개를 작성하세요: ${topic}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${detail}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const raw = payload.choices?.[0]?.message?.content;
  const tweet = typeof raw === "string" ? raw.trim() : "";

  if (!tweet) {
    throw new Error("Failed to generate tweet content");
  }

  return enforceTweetLength(tweet);
}

function buildSystemPrompt(): string {
  return `당신은 계약서 AI 분석 서비스 '내편계약서'의 SNS 담당자입니다.
계약서 관련 실용적인 팁을 트위터에 올립니다.
규칙:
- 한국어로 작성
- 230자 이내 (트위터 제한)
- 법적 효력 없음 고지 포함
- 해시태그 2-3개 포함: #계약서 #내편계약서 중 선택
- 서비스 URL 포함: ${SERVICE_URL}
- 과장 표현 금지 ("완벽한 분석" 등)
- 일반인이 이해하기 쉬운 실용적 내용`;
}

// 트위터 280자 제한을 넘으면 안전하게 잘라낸다.
function enforceTweetLength(tweet: string): string {
  if ([...tweet].length <= TWEET_MAX_LENGTH) {
    return tweet;
  }

  return [...tweet].slice(0, TWEET_MAX_LENGTH - 1).join("").trimEnd() + "…";
}

// Twitter API v2로 트윗을 발송한다. OAuth 1.0a 사용자 인증이 필요하다.
async function postToTwitter(text: string): Promise<TwitterCreateResponse> {
  const credentials = readTwitterCredentials();

  const authHeader = await buildOAuthHeader({
    method: "POST",
    url: TWITTER_TWEETS_URL,
    credentials,
  });

  const res = await fetch(TWITTER_TWEETS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: authHeader,
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Twitter API error: ${res.status} ${detail}`);
  }

  return (await res.json()) as TwitterCreateResponse;
}

function readTwitterCredentials(): OAuthCredentials {
  const apiKey = process.env.TWITTER_API_KEY?.trim();
  const apiSecret = process.env.TWITTER_API_SECRET?.trim();
  const accessToken = process.env.TWITTER_ACCESS_TOKEN?.trim();
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET?.trim();

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error("Twitter API credentials not configured");
  }

  return { apiKey, apiSecret, accessToken, accessSecret };
}

// OAuth 1.0a Authorization 헤더 생성 (Web Crypto API HMAC-SHA1).
async function buildOAuthHeader({
  method,
  url,
  credentials,
}: {
  method: string;
  url: string;
  credentials: OAuthCredentials;
}): Promise<string> {
  const { apiKey, apiSecret, accessToken, accessSecret } = credentials;

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ""),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  // RFC 5849: 파라미터를 키 기준 정렬 후 인코딩한다.
  const paramString = Object.entries(oauthParams)
    .map(
      ([k, v]) =>
        [percentEncode(k), percentEncode(v)] as [string, string],
    )
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const signatureBase = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString),
  ].join("&");

  const signingKey = `${percentEncode(apiSecret)}&${percentEncode(accessSecret)}`;
  const signature = await hmacSha1(signingKey, signatureBase);

  const headerParams: Record<string, string> = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const header = Object.keys(headerParams)
    .sort()
    .map((key) => `${percentEncode(key)}="${percentEncode(headerParams[key])}"`)
    .join(", ");

  return `OAuth ${header}`;
}

// RFC 3986 percent-encoding. encodeURIComponent가 남기는 문자를 추가 처리한다.
function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!*'()]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

// Web Crypto API로 HMAC-SHA1 서명을 만들고 base64로 반환한다.
async function hmacSha1(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(message),
  );

  return arrayBufferToBase64(signatureBuffer);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
