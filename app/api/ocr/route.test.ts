import { beforeEach, describe, expect, it, vi } from "vitest";
import { OcrProviderError, OcrValidationError, extractContractTextFromFile } from "@/src/lib/ocr/openai-ocr";
import { verifyAnalysisAccessCode } from "@/src/lib/server/access-codes";
import { POST } from "./route";

vi.mock("@/src/lib/ocr/openai-ocr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/ocr/openai-ocr")>();

  return {
    ...actual,
    extractContractTextFromFile: vi.fn()
  };
});

vi.mock("@/src/lib/server/access-codes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/server/access-codes")>();

  return {
    ...actual,
    verifyAnalysisAccessCode: vi.fn()
  };
});

let requestCounter = 0;

describe("POST /api/ocr", () => {
  beforeEach(() => {
    vi.mocked(extractContractTextFromFile).mockReset();
    vi.mocked(verifyAnalysisAccessCode).mockReset();
    vi.mocked(verifyAnalysisAccessCode).mockResolvedValue({ ok: true, accessCode: { code: "123456" } as never });
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
    expect(verifyAnalysisAccessCode).toHaveBeenCalledWith("123456");
    expect(extractContractTextFromFile).toHaveBeenCalledWith({
      bytes: expect.any(Buffer),
      fileName: "contract.pdf",
      mimeType: "application/pdf"
    });
  });

  it("returns 400 when no file is included", async () => {
    const request = new Request("http://localhost/api/ocr", {
      method: "POST",
      headers: testClientHeaders()
    });
    vi.spyOn(request, "formData").mockResolvedValue({
      get: (key: string) => (key === "accessCode" ? "123456" : null)
    } as FormData);

    const response = await POST(request);

    await expect(response.json()).resolves.toMatchObject({ error: "INVALID_REQUEST" });
    expect(response.status).toBe(400);
    expect(extractContractTextFromFile).not.toHaveBeenCalled();
  });

  it("rejects missing access codes before reading the uploaded file", async () => {
    const request = createMultipartRequest(
      {
        name: "contract.pdf",
        type: "application/pdf",
        bytes: Buffer.from("%PDF")
      },
      ""
    );

    const response = await POST(request);

    await expect(response.json()).resolves.toMatchObject({ error: "INVALID_ACCESS_CODE" });
    expect(response.status).toBe(401);
    expect(verifyAnalysisAccessCode).not.toHaveBeenCalled();
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

function createMultipartRequest(file: { name: string; type: string; bytes: Buffer }, accessCode = "123456") {
  const request = new Request("http://localhost/api/ocr", {
    method: "POST",
    headers: testClientHeaders()
  });
  vi.spyOn(request, "formData").mockResolvedValue({
    get: (key: string) => {
      if (key === "accessCode") return accessCode;
      if (key === "file") {
        return {
          name: file.name,
          type: file.type,
          arrayBuffer: async () =>
            file.bytes.buffer.slice(file.bytes.byteOffset, file.bytes.byteOffset + file.bytes.byteLength)
        };
      }

      return null;
    }
  } as FormData);

  return request;
}

function testClientHeaders() {
  requestCounter += 1;
  return {
    "x-forwarded-for": `203.0.113.${requestCounter}`
  };
}
