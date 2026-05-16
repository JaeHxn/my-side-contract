import type { ContractAnalysisResult } from "../contracts/types";

export async function maybeEnhanceWithAi(analysis: ContractAnalysisResult, contractText: string) {
  if (process.env.DISABLE_AI_ANALYSIS === "true") {
    return analysis;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return analysis;
  }

  try {
    const note = await callOpenAi(contractText, apiKey);

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

async function callOpenAi(contractText: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      max_output_tokens: 220,
      input: `전월세 계약서 위험 조항을 일반인이 이해할 한 문장으로만 요약해줘. 법률 자문처럼 단정하지 말고 참고용이라고 써줘.\n\n${contractText.slice(0, 6000)}`
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
  };
  const nestedText = payload.output?.flatMap((item) => item.content || []).find((item) => item.text)?.text;

  return payload.output_text?.trim() || nestedText?.trim() || "추가 메모를 생성하지 못했습니다.";
}
