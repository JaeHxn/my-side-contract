export const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
export const DEFAULT_OPENAI_ANALYSIS_MODEL = "gpt-5.4-mini";
export const MAX_AI_CONTRACT_TEXT_CHARS = 6000;

export function buildContractAnalysisPrompt(redactedContractText: string) {
  const contractExcerpt = redactedContractText.slice(0, MAX_AI_CONTRACT_TEXT_CHARS);

  return [
    "You are reviewing a Korean contract for consumer risk.",
    "Use only the redacted contract text below. Do not request, infer, or reconstruct personal identifiers.",
    "Return one short Korean memo for a non-lawyer. Say it is reference-only, not legal advice.",
    "",
    "Redacted contract:",
    contractExcerpt
  ].join("\n");
}
