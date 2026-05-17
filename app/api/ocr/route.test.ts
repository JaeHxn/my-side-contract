import { beforeEach, describe, expect, it, vi } from "vitest";
import { OcrProviderError, OcrValidationError, extractContractTextFromFile } from "@/src/lib/ocr/openai-ocr";
import { POST } from "./route";

vi.mock("@/src/lib/ocr/openai-ocr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/ocr/openai-ocr")>();

  return {
    ...actual,
    extractContractTextFromFile: vi.fn()
  };
});

describe("POST /api/ocr", () => {
  beforeEach(() => {
    vi.mocked(extractContractTextFromFile).mockReset();
  });

  it("extracts text from an uploaded file", async () => {
    vi.mocked(extractContractTextFromFile).mockResolvedValue({
      text: "제1조 보증금은 계약 종료일에 반환한다.",
      fileName: "contract.pdf",
      mimeType: "application/pdf",
      characterCount: 22
    });
    const request = createMultipartRequest({
      name: "contract.pdf",
      type: "application/pdf",
      bytes: Buffer.from("%PDF")
    });

    const response = await POST(request);

    await expect(response.json()).resolves.toEqual({
      text: "제1조 보증금은 계약 종료일에 반환한다.",
      fileName: "contract.pdf",
      mimeType: "application/pdf",
      characterCount: 22
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(extractContractTextFromFile).toHaveBeenCalledWith({
      bytes: expect.any(Buffer),
      fileName: "contract.pdf",
      mimeType: "application/pdf"
    });
  });

  it("returns 400 when no file is included", async () => {
    const response = await POST(
      new Request("http://localhost/api/ocr", {
        method: "POST",
        body: new FormData()
      })
    );

    await expect(response.json()).resolves.toMatchObject({ error: "INVALID_REQUEST" });
    expect(response.status).toBe(400);
    expect(extractContractTextFromFile).not.toHaveBeenCalled();
  });

  it("maps validation and provider failures to user-safe errors", async () => {
    const invalidRequest = createMultipartRequest({
      name: "contract.zip",
      type: "application/zip",
      bytes: Buffer.from("zip")
    });
    vi.mocked(extractContractTextFromFile).mockRejectedValueOnce(new OcrValidationError("unsupported"));

    const invalidFileResponse = await POST(invalidRequest);

    expect(invalidFileResponse.status).toBe(400);

    const pdfRequest = createMultipartRequest({
      name: "contract.pdf",
      type: "application/pdf",
      bytes: Buffer.from("%PDF")
    });
    vi.mocked(extractContractTextFromFile).mockRejectedValueOnce(new OcrProviderError("OpenAI failed", 429));

    const providerResponse = await POST(pdfRequest);

    await expect(providerResponse.json()).resolves.toMatchObject({ error: "OCR_RATE_LIMITED" });
    expect(providerResponse.status).toBe(429);
  });
});

function createMultipartRequest(file: { name: string; type: string; bytes: Buffer }) {
  const request = new Request("http://localhost/api/ocr", { method: "POST" });
  vi.spyOn(request, "formData").mockResolvedValue({
    get: (key: string) =>
      key === "file"
        ? {
            name: file.name,
            type: file.type,
            arrayBuffer: async () =>
              file.bytes.buffer.slice(file.bytes.byteOffset, file.bytes.byteOffset + file.bytes.byteLength)
          }
        : null
  } as FormData);

  return request;
}
