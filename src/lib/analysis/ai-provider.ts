import type { ContractAnalysisResult } from "../contracts/types";

export async function maybeEnhanceWithAi(analysis: ContractAnalysisResult, contractText: string) {
  if (process.env.USE_AI_ANALYSIS !== "true") {
    return analysis;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return analysis;
  }

  try {
    const note = process.env.ANTHROPIC_API_KEY
      ? await callAnthropic(contractText, apiKey)
      : await callOpenAi(contractText, apiKey);

    return {
      ...analysis,
      provider: "ai-assisted" as const,
      summary: {
        ...analysis.summary,
        nextStep: `${analysis.summary.nextStep} AI 추가 메모: ${note}`
      }
    };
  } catch {
    return analysis;
  }
}

async function callAnthropic(contractText: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 180,
      messages: [
        {
          role: "user",
          content: `전월세 계약서 위험 조항을 일반인이 이해할 한 문장으로만 요약해줘. 법률 자문처럼 단정하지 말고 참고용이라고 써줘.\n\n${contractText.slice(0, 4000)}`
        }
      ]
    })
  });

  const payload = (await response.json()) as { content?: Array<{ text?: string }> };
  return payload.content?.[0]?.text?.trim() || "추가 메모를 생성하지 못했습니다.";
}

async function callOpenAi(contractText: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: `전월세 계약서 위험 조항을 일반인이 이해할 한 문장으로만 요약해줘. 법률 자문처럼 단정하지 말고 참고용이라고 써줘.\n\n${contractText.slice(0, 4000)}`
    })
  });

  const payload = (await response.json()) as { output_text?: string };
  return payload.output_text?.trim() || "추가 메모를 생성하지 못했습니다.";
}
