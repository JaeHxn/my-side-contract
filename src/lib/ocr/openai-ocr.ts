import { DEFAULT_OPENAI_ANALYSIS_MODEL, OPENAI_RESPONSES_URL } from "@/src/lib/analysis/prompts";

export const MAX_OCR_FILE_BYTES = 10 * 1024 * 1024;

const imageMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const pdfMimeTypes = new Set(["application/pdf"]);

export interface OcrFileInput {
  bytes: Buffer;
  fileName: string;
  mimeType: string;
}

export interface OcrTextResult {
  text: string;
  fileName: string;
  mimeType: string;
  characterCount: number;
  warnings?: Array<{ code: string; message: string }>;
}

export class OcrValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OcrValidationError";
  }
}

export class OcrProviderError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "OcrProviderError";
    this.status = status;
  }
}

export async function extractContractTextFromFile(input: OcrFileInput, apiKey = process.env.OPENAI_API_KEY?.trim()) {
  const normalized = validateOcrInput(input);

  if (!apiKey) {
    throw new OcrProviderError("OpenAI API key is not configured.", 503);
  }

  const rawText = await callOpenAiForOcr(normalized, apiKey);

  if (rawText.length < 30) {
    throw new OcrProviderError("OCR result was too short.", 422);
  }

  const text = rawText.slice(0, 50000);
  const warnings =
    rawText.length > text.length
      ? [
          {
            code: "OCR_TEXT_TRUNCATED",
            message: "OCR 결과가 50,000자를 넘어 분석 가능한 길이까지만 입력했습니다."
          }
        ]
      : undefined;

  return {
    text,
    fileName: normalized.fileName,
    mimeType: normalized.mimeType,
    characterCount: text.length,
    ...(warnings ? { warnings } : {})
  } satisfies OcrTextResult;
}

function validateOcrInput(input: OcrFileInput): OcrFileInput {
  const fileName = input.fileName.trim() || "contract-file";
  const mimeType = normalizeMimeType(input.mimeType, fileName);

  if (!pdfMimeTypes.has(mimeType) && !imageMimeTypes.has(mimeType)) {
    throw new OcrValidationError("PDF, PNG, JPG, WEBP 파일만 OCR 처리할 수 있습니다.");
  }

  if (input.bytes.length === 0) {
    throw new OcrValidationError("비어 있는 파일은 처리할 수 없습니다.");
  }

  if (input.bytes.length > MAX_OCR_FILE_BYTES) {
    throw new OcrValidationError("OCR 파일은 10MB 이하만 업로드할 수 있습니다.");
  }

  return {
    bytes: input.bytes,
    fileName,
    mimeType
  };
}

async function callOpenAiForOcr(input: OcrFileInput, apiKey: string): Promise<string> {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: getOpenAiOcrModel(),
      max_output_tokens: 6000,
      input: [
        {
          role: "user",
          content: [
            buildOcrContent(input),
            {
              type: "input_text",
              text: [
                "이 파일은 한국어 계약서 PDF 또는 사진입니다.",
                "계약서 원문 텍스트만 OCR로 추출하세요.",
                "요약, 설명, 법률 의견, 마크다운 제목을 붙이지 마세요.",
                "조항 번호, 금액, 날짜, 주소, 특약 문구는 보이는 그대로 최대한 보존하세요.",
                "읽기 어려운 부분은 [판독불가]로 표시하세요."
              ].join("\n")
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new OcrProviderError(`OpenAI OCR request failed: ${response.status}`, response.status);
  }

  const payload = (await response.json()) as OpenAiResponsesPayload;
  const text = extractResponseText(payload);

  if (!text) {
    throw new OcrProviderError("OpenAI OCR response did not contain text.");
  }

  return text;
}

function buildOcrContent(input: OcrFileInput) {
  const base64 = input.bytes.toString("base64");

  if (pdfMimeTypes.has(input.mimeType)) {
    return {
      type: "input_file",
      filename: input.fileName,
      file_data: `data:${input.mimeType};base64,${base64}`
    };
  }

  return {
    type: "input_image",
    image_url: `data:${input.mimeType};base64,${base64}`,
    detail: "high"
  };
}

function normalizeMimeType(mimeType: string, fileName: string): string {
  const normalized = mimeType.trim().toLowerCase();

  if (normalized) {
    return normalized === "image/jpg" ? "image/jpeg" : normalized;
  }

  const extension = fileName.toLowerCase().split(".").pop();

  if (extension === "pdf") return "application/pdf";
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";

  return "application/octet-stream";
}

function getOpenAiOcrModel() {
  return process.env.OPENAI_OCR_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_ANALYSIS_MODEL;
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
