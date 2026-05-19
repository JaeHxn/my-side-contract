import { afterEach, describe, expect, it, vi } from "vitest";
import { housingLeaseLawReferences } from "../analysis/law-references";
import { fetchHousingLeaseLawReferences, fetchLawReferencesForCategory } from "./law-client";

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
    expect(fetchMock).toHaveBeenCalledTimes(9);
  });

  it("retries transient law API failures before falling back", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-19T00:00:00.000Z"));

    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);

      if (url.includes("lawSearch.do") && url.includes("query=%EC%A3%BC%ED%83%9D")) {
        const matchingSearchCalls = fetchMock.mock.calls.filter(([calledInput]) =>
          String(calledInput).includes("query=%EC%A3%BC%ED%83%9D")
        ).length;

        if (matchingSearchCalls === 1) {
          throw new Error("temporary gateway failure");
        }

        return new Response(
          JSON.stringify({
            LawSearch: {
              law: [
                {
                  법령명한글: "주택임대차보호법",
                  법령ID: "001234",
                  법령상세링크: "/법령/주택임대차보호법"
                }
              ]
            }
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      if (url.includes("lawSearch.do")) {
        return new Response(JSON.stringify({ LawSearch: { law: [] } }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      if (url.includes("lawService.do")) {
        return new Response(
          JSON.stringify({
            조문번호: "4",
            조문제목: "임대차기간 등",
            조문내용: "제4조(임대차기간 등) 기간을 정하지 아니하거나 2년 미만으로 정한 임대차는 그 기간을 2년으로 본다."
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    vi.stubEnv("LAW_API_OC", "test-oc");
    vi.stubGlobal("fetch", fetchMock);

    const references = await fetchLawReferencesForCategory("housing-lease");

    expect(references[0]).toMatchObject({
      title: "주택임대차보호법",
      article: expect.stringContaining("제4조"),
      excerpt: expect.stringContaining("2년 미만으로 정한 임대차"),
      source: "law-api",
      lastChecked: "2026-05-19T00:00:00.000Z"
    });
    expect(fetchMock.mock.calls.filter(([input]) => String(input).includes("query=%EC%A3%BC%ED%83%9D"))).toHaveLength(2);
  });

  it("parses successful law API search rows while tolerating partial request failures", async () => {
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
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("lawSearch.do"), expect.any(Object));
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("lawService.do"), expect.any(Object));
  });

  it("fetches current article text from lawService and exposes excerpts for analysis prompts", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-18T00:00:00.000Z"));

    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);

      if (url.includes("lawSearch.do")) {
        return new Response(
          JSON.stringify({
            LawSearch: {
              law: [
                {
                  법령명한글: "주택임대차보호법",
                  법령ID: "001234",
                  법령상세링크: "/법령/주택임대차보호법"
                }
              ]
            }
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      if (url.includes("lawService.do")) {
        expect(url).toContain("target=lawjosub");
        return new Response(
          JSON.stringify({
            법령ID: "001234",
            법령명_한글: "주택임대차보호법",
            조문번호: "4",
            조문제목: "임대차기간 등",
            조문내용: "제4조(임대차기간 등) 기간을 정하지 아니하거나 2년 미만으로 정한 임대차는 그 기간을 2년으로 본다."
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    vi.stubEnv("LAW_API_OC", "test-oc");
    vi.stubGlobal("fetch", fetchMock);

    const references = await fetchLawReferencesForCategory("housing-lease");

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("lawSearch.do"), expect.any(Object));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("lawService.do"), expect.any(Object));
    expect(references[0]).toMatchObject({
      title: "주택임대차보호법",
      article: expect.stringContaining("제4조"),
      excerpt: expect.stringContaining("2년 미만으로 정한 임대차"),
      source: "law-api",
      lastChecked: "2026-05-18T00:00:00.000Z"
    });
  });

  it("falls back to a public law reference when search results do not include ID or MST", async () => {
    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);

      if (url.includes("lawSearch.do")) {
        return new Response(
          JSON.stringify({
            LawSearch: {
              law: [{ 법령명한글: "근로기준법" }]
            }
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      throw new Error(`Unexpected URL without ID/MST: ${url}`);
    });

    vi.stubEnv("LAW_API_OC", "test-oc");
    vi.stubGlobal("fetch", fetchMock);

    const references = await fetchLawReferencesForCategory("labor");

    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("lawService.do"), expect.any(Object));
    expect(references[0]).toMatchObject({
      title: "근로기준법",
      source: "law-api"
    });
  });

  it("does not expose OC-bearing law service links in returned references", async () => {
    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);

      if (url.includes("lawSearch.do")) {
        return new Response(
          JSON.stringify({
            LawSearch: {
              law: [
                {
                  법령명한글: "주택임대차보호법",
                  법령ID: "001248",
                  법령상세링크: "/DRF/lawService.do?OC=test-oc&target=law&MST=276291&type=HTML"
                }
              ]
            }
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      expect(url).toContain("target=lawjosub");
      return new Response(
        JSON.stringify({
          조문번호: "4",
          조문제목: "임대차기간 등",
          조문내용: "제4조(임대차기간 등) 기간을 정하지 아니하거나 2년 미만으로 정한 임대차는 그 기간을 2년으로 본다."
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });

    vi.stubEnv("LAW_API_OC", "test-oc");
    vi.stubGlobal("fetch", fetchMock);

    const references = await fetchLawReferencesForCategory("housing-lease");

    expect(references[0]?.url).toBe("https://www.law.go.kr/법령/주택임대차보호법");
    expect(references[0]?.url).not.toContain("OC=");
  });
});
