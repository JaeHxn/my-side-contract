/**
 * korean-law-mcp 원격 서버 HTTP 클라이언트
 * 엔드포인트: https://korean-law-mcp.fly.dev/mcp
 * MCP Streamable HTTP transport (JSON-RPC 2.0)
 *
 * 서버리스(Vercel)에서는 매 호출마다 새 세션을 생성한다.
 * initialize → tools/call 순서로 두 번 요청하고 세션 ID로 연결한다.
 */

const MCP_URL = process.env.KOREAN_LAW_MCP_URL ?? "https://korean-law-mcp.fly.dev/mcp";
const INIT_TIMEOUT_MS = 8_000;
const TOOL_TIMEOUT_MS = 20_000;

interface McpTextContent {
  type: "text";
  text: string;
}

interface McpToolResult {
  content?: McpTextContent[];
  isError?: boolean;
}

interface McpJsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: McpToolResult;
  error?: { code: number; message: string };
}

function buildHeaders(sessionId: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    "Mcp-Session-Id": sessionId,
  };
  // korean-law-mcp은 법제처 LAW_API_OC 키를 Authorization: Bearer로 받는다
  const apiKey = process.env.LAW_API_OC?.trim();
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  return headers;
}

async function parseResponse(resp: Response): Promise<string> {
  const ct = resp.headers.get("content-type") ?? "";

  if (ct.includes("text/event-stream")) {
    const raw = await resp.text();
    for (const line of raw.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(line.slice(6)) as McpJsonRpcResponse;
        const text = extractText(json);
        if (text) return text;
      } catch {
        continue;
      }
    }
    return "";
  }

  const json = (await resp.json()) as McpJsonRpcResponse;
  return extractText(json);
}

function extractText(json: McpJsonRpcResponse): string {
  if (json.error) throw new Error(`MCP error ${json.error.code}: ${json.error.message}`);
  return json.result?.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
}

export async function callMcpTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const headers = buildHeaders(sessionId);

  // 1. Initialize
  const initResp = await fetch(MCP_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "naepyun-contract", version: "1.0.0" },
      },
    }),
    signal: AbortSignal.timeout(INIT_TIMEOUT_MS),
  });
  if (!initResp.ok) throw new Error(`MCP init failed: ${initResp.status}`);

  // 2. Tool call
  const toolResp = await fetch(MCP_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    }),
    signal: AbortSignal.timeout(TOOL_TIMEOUT_MS),
  });
  if (!toolResp.ok) throw new Error(`MCP tool call failed: ${toolResp.status}`);

  return parseResponse(toolResp);
}

/** 법령 검색 — search_law */
export async function mcpSearchLaw(query: string): Promise<string> {
  return callMcpTool("search_law", { query });
}

/** 특정 조문 전문 — get_law_article */
export async function mcpGetLawArticle(lawName: string, article: string): Promise<string> {
  return callMcpTool("get_law_article", { lawName, jo: article });
}

/** 판례·결정례 검색 — search_decisions (domain: "precedent") */
export async function mcpSearchPrecedents(query: string): Promise<string> {
  return callMcpTool("search_decisions", { query, domain: "precedent" });
}

/** 행정해석 검색 — search_decisions (domain: "interpretation") */
export async function mcpSearchInterpretationDecisions(query: string): Promise<string> {
  return callMcpTool("search_decisions", { query, domain: "interpretation" });
}

/**
 * 체인 종합 리서치 — chain_full_research
 * 법령 → 판례 → 해석을 한 번에 조회한다.
 */
export async function mcpChainResearch(query: string): Promise<string> {
  return callMcpTool("chain_full_research", { query });
}
