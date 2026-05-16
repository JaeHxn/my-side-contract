import type { ContractAnalysisResult } from "../contracts/types";
import { redactPii } from "../privacy/pii-redaction";
import {
  buildContractAnalysisPrompt,
  DEFAULT_OPENAI_ANALYSIS_MODEL,
  OPENAI_RESPONSES_URL
} from "./prompts";

export async function maybeEnhanceWithAi(analysis: ContractAnalysisResult, contractText: string) {
  if (process.env.DISABLE_AI_ANALYSIS === "true") {
    return analysis;
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
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
        nextStep: `${analysis.summary.nextStep} AI \uCD94\uAC00 \uBA54\uBAA8: ${note}`
      }
    };
  } catch {
    return analysis;
  }
}

async function callOpenAi(contractText: string, apiKey: string): Promise<string> {
  const { redactedText } = redactPii(contractText);
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      max_output_tokens: 220,
      input: buildContractAnalysisPrompt(redactedText)
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const payload = (await response.json()) as OpenAiResponsesPayload;
  return extractResponseText(payload) || "AI \uBA54\uBAA8\uB97C \uC0DD\uC131\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
}

function getOpenAiModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_ANALYSIS_MODEL;
}

interface OpenAiResponsesPayload {
  output_text?: unknown;
  output?: Array<{ content?: Array<{ text?: unknown; type?: string }> }>;
}

function extractResponseText(payload: OpenAiResponsesPayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const nestedText = payload.output
    ?.flatMap((item) => item.content || [])
    .find((item) => typeof item.text === "string" && item.text.trim())?.text;

  return typeof nestedText === "string" ? nestedText.trim() : "";
}
