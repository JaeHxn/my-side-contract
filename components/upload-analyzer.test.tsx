import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UploadAnalyzer } from "./upload-analyzer";

const contractText = [
  "근로계약서",
  "사용자: 테스트회사",
  "근로자: 홍길동",
  "퇴사 시 위약금 300만 원을 지급한다.",
  "연장근로수당은 포괄임금에 포함되어 별도 지급하지 않는다."
].join("\n");

describe("UploadAnalyzer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not send contract text to analysis when the access code precheck fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "INVALID_ACCESS_CODE",
          message: "입력한 코드가 확인되지 않습니다."
        }),
        {
          status: 401,
          headers: { "content-type": "application/json" }
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(<UploadAnalyzer />);

    fireEvent.change(container.querySelector("#contractText")!, {
      target: { value: contractText }
    });
    fireEvent.change(container.querySelector("#accessCode")!, {
      target: { value: "000000" }
    });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/access-code/verify",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ accessCode: "000000" })
      })
    );
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain(contractText);
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain("/api/analysis");
  });
});
