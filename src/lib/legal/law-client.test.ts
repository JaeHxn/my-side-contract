import { afterEach, describe, expect, it, vi } from "vitest";
import { housingLeaseLawReferences } from "../analysis/law-references";
import { fetchHousingLeaseLawReferences } from "./law-client";

describe("fetchHousingLeaseLawReferences", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("uses built-in references without a law API key", async () => {
    const fetchMock = vi.fn();

    vi.stubEnv("LAW_API_OC", "");
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchHousingLeaseLawReferences()).resolves.toEqual(housingLeaseLawReferences);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to built-in references when every law API request fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({})
    });

    vi.stubEnv("LAW_API_OC", "test-oc");
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchHousingLeaseLawReferences()).resolves.toEqual(housingLeaseLawReferences);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("parses successful law API rows while tolerating partial request failures", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-17T00:00:00.000Z"));

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          LawSearch: {
            law: [
              {
                법령명한글: "주택임대차보호법",
                법령상세링크: "/법령/주택임대차보호법"
              },
              {
                법령명한글: ""
              }
            ]
          }
        })
      })
      .mockRejectedValueOnce(new Error("timeout"))
      .mockRejectedValueOnce(new Error("rate limited"));

    vi.stubEnv("LAW_API_OC", "test-oc");
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchHousingLeaseLawReferences()).resolves.toEqual([
      {
        title: "주택임대차보호법",
        source: "law-api",
        url: "https://www.law.go.kr/법령/주택임대차보호법",
        lastChecked: "2026-05-17T00:00:00.000Z"
      }
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
