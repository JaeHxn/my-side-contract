import { describe, expect, it } from "vitest";
import { redactPii } from "./pii-redaction";

describe("redactPii", () => {
  it("redacts direct contact and resident registration identifiers", () => {
    const result = redactPii(
      "Tenant email tenant@example.com phone 010-1234-5678 rrn 900101-1234567"
    );

    expect(result.redactedText).not.toContain("tenant@example.com");
    expect(result.redactedText).not.toContain("010-1234-5678");
    expect(result.redactedText).not.toContain("900101-1234567");
    expect(result.redactedText).toContain("[REDACTED:EMAIL]");
    expect(result.redactedText).toContain("[REDACTED:PHONE]");
    expect(result.redactedText).toContain("[REDACTED:RESIDENT_ID]");
  });

  it("redacts Korean name and address fields while preserving legal clause text", () => {
    const result = redactPii(
      "\uC784\uCC28\uC778: \uD64D\uAE38\uB3D9\n" +
        "\uC8FC\uC18C: \uC11C\uC6B8\uD2B9\uBCC4\uC2DC \uAC15\uB0A8\uAD6C \uD14C\uD5E4\uB780\uB85C 123\n" +
        "\uBCF4\uC99D\uAE08\uC740 \uACC4\uC57D \uC885\uB8CC\uC77C\uC5D0 \uBC18\uD658\uD55C\uB2E4."
    );

    expect(result.redactedText).not.toContain("\uD64D\uAE38\uB3D9");
    expect(result.redactedText).not.toContain("\uC11C\uC6B8\uD2B9\uBCC4\uC2DC");
    expect(result.redactedText).toContain("\uC784\uCC28\uC778: [REDACTED:NAME]");
    expect(result.redactedText).toContain("\uC8FC\uC18C: [REDACTED:ADDRESS]");
    expect(result.redactedText).toContain("\uBCF4\uC99D\uAE08\uC740 \uACC4\uC57D \uC885\uB8CC\uC77C\uC5D0 \uBC18\uD658\uD55C\uB2E4.");
  });
});
