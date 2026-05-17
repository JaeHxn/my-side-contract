import { describe, expect, it } from "vitest";
import { formatKoreanDateTime } from "./korean-time";

describe("formatKoreanDateTime", () => {
  it("formats UTC instants as Korea time", () => {
    const formatted = formatKoreanDateTime("2026-05-17T00:00:00.000Z");

    expect(formatted).toContain("2026");
    expect(formatted).toContain("9:00");
    expect(formatted).toContain("한국 시간");
  });

  it("accepts Supabase timestamptz offset strings", () => {
    const formatted = formatKoreanDateTime("2026-05-17T15:30:00+00:00", {
      dateStyle: "long",
      timeStyle: "short"
    });

    expect(formatted).toContain("2026년 5월 18일");
    expect(formatted).toContain("0:30");
    expect(formatted).toContain("한국 시간");
  });

  it("returns invalid values unchanged", () => {
    expect(formatKoreanDateTime("not-a-date")).toBe("not-a-date");
  });
});
