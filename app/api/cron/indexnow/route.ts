import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://my-side-contract.vercel.app";

// IndexNow key must be configured via the INDEXNOW_KEY environment variable.
// The value is not a secret (it is also published at /indexnow-<key>.txt) but
// hardcoding it in source couples a deployment artefact to the codebase and
// makes rotation harder.
const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "";

// 검색엔진에 색인 요청할 URL 목록
const URLS = [SITE_URL, `${SITE_URL}/upload`, `${SITE_URL}/payment`];

const KEY_LOCATION = `${SITE_URL}/indexnow-${INDEXNOW_KEY}.txt`;

interface IndexNowEngine {
  name: string;
  endpoint: string;
}

const ENGINES: IndexNowEngine[] = [
  { name: "naver", endpoint: "https://searchadvisor.naver.com/indexnow" },
  { name: "bing", endpoint: "https://www.bing.com/indexnow" },
];

// Vercel Cron에서 호출되는 라우트. CRON_SECRET으로 보호한다.
export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!INDEXNOW_KEY) {
    return NextResponse.json({ error: "INDEXNOW_KEY environment variable is not configured" }, { status: 500 });
  }

  const results = await Promise.allSettled(
    ENGINES.map((engine) => submitToEngine(engine)),
  );

  return NextResponse.json({
    success: true,
    results: results.map((result, index) => ({
      engine: ENGINES[index].name,
      status: result.status,
      ...(result.status === "fulfilled"
        ? { httpStatus: result.value }
        : { error: String((result.reason as Error)?.message ?? result.reason) }),
    })),
    timestamp: new Date().toISOString(),
  });
}

async function submitToEngine(engine: IndexNowEngine): Promise<number> {
  const res = await fetch(engine.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE_URL).hostname,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList: URLS,
    }),
  });

  if (!res.ok) {
    throw new Error(`${engine.name} IndexNow failed: ${res.status}`);
  }

  return res.status;
}
