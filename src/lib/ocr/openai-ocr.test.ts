import { afterEach, describe, expect, it, vi } from "vitest";
import { OcrProviderError, OcrValidationError, extractContractTextFromFile } from "./openai-ocr";

describe("extractContractTextFromFile", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends PDF files to OpenAI as input_file and returns extracted text", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    const extractedText = "제1조 보증금은 계약 종료일에 반환한다. 제2조 월세는 매월 25일 지급한다.";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ output_text: extractedText }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await extractContractTextFromFile({
      bytes: Buffer.from("%PDF test"),
      fileName: "contract.pdf",
      mimeType: "application/pdf"
    });

    expect(result).toMatchObject({
      text: extractedText,
      fileName: "contract.pdf",
      mimeType: "application/pdf"
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as {
      model: string;
      input: Array<{ content: Array<Record<string, string>> }>;
    };

    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(init.headers).toMatchObject({ authorization: "Bearer test-openai-key" });
    expect(body.model).toBe("gpt-4o");
    expect(body.input[0].content[0]).toMatchObject({
      type: "input_file",
      filename: "contract.pdf"
    });
    expect(body.input[0].content[0].file_data).toContain("data:application/pdf;base64,");
  });

  it("sends images to OpenAI as input_image", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ output_text: "제2조 월세는 매월 25일 지급한다. 임대인은 수선 의무를 부담한다." }), {
        status: 200
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await extractContractTextFromFile({
      bytes: Buffer.from("fake image bytes"),
      fileName: "contract.jpg",
      mimeType: "image/jpeg"
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as {
      input: Array<{ content: Array<Record<string, string>> }>;
    };

    expect(body.input[0].content[0]).toMatchObject({
      type: "input_image",
      detail: "high"
    });
    expect(body.input[0].content[0].image_url).toContain("data:image/jpeg;base64,");
  });

  it("rejects unsupported or oversized files before calling OpenAI", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      extractContractTextFromFile({
        bytes: Buffer.from("zip"),
        fileName: "contract.zip",
        mimeType: "application/zip"
      })
    ).rejects.toBeInstanceOf(OcrValidationError);

    await expect(
      extractContractTextFromFile({
        bytes: Buffer.alloc(10 * 1024 * 1024 + 1),
        fileName: "contract.pdf",
        mimeType: "application/pdf"
      })
    ).rejects.toBeInstanceOf(OcrValidationError);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires an OpenAI API key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");

    await expect(
      extractContractTextFromFile({
        bytes: Buffer.from("%PDF test"),
        fileName: "contract.pdf",
        mimeType: "application/pdf"
      })
    ).rejects.toBeInstanceOf(OcrProviderError);
  });
});
