import { NextResponse } from "next/server";

// Threads API v1.0 — 텍스트 포스트는 컨테이너 생성 → 발행 2단계
const THREADS_API = "https://graph.threads.net/v1.0";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const SERVICE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://my-side-contract.vercel.app";

// Threads 텍스트 포스트 최대 500자
const THREADS_MAX_LENGTH = 500;

const POST_TOPICS: readonly string[] = [
  "전월세 계약서에서 계약갱신요구권 포기 조항 주의",
  "근로계약서에 포괄임금제가 들어있다면 확인해야 할 것",
  "퇴직 위약금 조항이 있는 근로계약서 서명하면 안 되는 이유",
  "전세 보증금 반환 관련 특약 꼭 넣어야 하는 이유",
  "프리랜서 계약서 저작권 조항 확인 포인트",
  "인테리어 계약서 하자보수 기간 확인하는 방법",
  "알바 계약서에 반드시 있어야 하는 6가지",
  "전세사기 예방을 위해 계약 전 반드시 확인해야 할 것",
  "계약갱신요구권이란 무엇이고 포기할 수 없는 이유",
  "근로계약서에 꼭 들어가야 하는 필수 기재사항 5가지",
];

interface ThreadsContainerResponse {
  id?: string;
}

interface ThreadsPublishResponse {
  id?: string;
}

// Vercel Cron에서 호출 — CRON_SECRET으로 보호
export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");

  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const text = await generatePost();
    const postId = await postToThreads(text);

    return NextResponse.json({
      success: true,
      text,
      postId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// OpenAI로 Threads 포스트 생성 (500자 이내, 트위터보다 길게 쓸 수 있음)
async function generatePost(): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const topic = POST_TOPICS[Math.floor(Math.random() * POST_TOPICS.length)];

  const res = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TWEET_MODEL?.trim() || "gpt-4o-mini",
      max_tokens: 400,
      temperature: 0.8,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: `다음 주제로 Threads 포스팅 1개를 작성하세요: ${topic}` },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI 요청 실패: ${res.status} ${detail}`);
  }

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const raw = payload.choices?.[0]?.message?.content;
  const text = typeof raw === "string" ? raw.trim() : "";

  if (!text) throw new Error("포스트 내용 생성 실패");

  return enforceLength(text);
}

function buildSystemPrompt(): string {
  return `당신은 계약서 AI 분석 서비스 '내편계약서'의 SNS 담당자입니다.
Threads에 계약서 관련 실용적인 팁을 포스팅합니다.
규칙:
- 한국어로 작성
- 450자 이내 (여백 포함)
- 법적 효력 없음 고지 포함 ("참고용이며 법적 효력 없음")
- 해시태그 3개 포함 예시: #계약서 #내편계약서 #전월세
- 서비스 URL 포함: ${SERVICE_URL}
- 과장 표현 금지 ("완벽한 분석", "변호사 대체" 등 절대 사용 금지)
- 20-30대가 공감할 수 있는 실용적 말투
- 줄바꿈으로 가독성 높이기
- 구체적인 법령 조항 언급 가능 (예: 근로기준법 제20조)`;
}

function enforceLength(text: string): string {
  if ([...text].length <= THREADS_MAX_LENGTH) return text;
  return [...text].slice(0, THREADS_MAX_LENGTH - 1).join("").trimEnd() + "…";
}

// Threads API: 컨테이너 생성 → 발행 2단계
async function postToThreads(text: string): Promise<string> {
  const userId = process.env.THREADS_USER_ID?.trim() || "me";
  const accessToken = process.env.THREADS_ACCESS_TOKEN?.trim();

  if (!accessToken) throw new Error("THREADS_ACCESS_TOKEN not configured");

  // 1단계: 텍스트 컨테이너 생성
  const containerRes = await fetch(
    `${THREADS_API}/${userId}/threads?` +
      new URLSearchParams({
        media_type: "TEXT",
        text,
        access_token: accessToken,
      }),
    { method: "POST" }
  );

  if (!containerRes.ok) {
    const detail = await containerRes.text();
    throw new Error(`Threads 컨테이너 생성 실패: ${containerRes.status} ${detail}`);
  }

  const container = (await containerRes.json()) as ThreadsContainerResponse;
  const creationId = container.id;
  if (!creationId) throw new Error("Threads 컨테이너 ID 없음");

  // 2단계: 발행
  const publishRes = await fetch(
    `${THREADS_API}/${userId}/threads_publish?` +
      new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken,
      }),
    { method: "POST" }
  );

  if (!publishRes.ok) {
    const detail = await publishRes.text();
    throw new Error(`Threads 발행 실패: ${publishRes.status} ${detail}`);
  }

  const published = (await publishRes.json()) as ThreadsPublishResponse;
  return published.id ?? creationId;
}
