export interface AccessCodeResult {
  ok: boolean;
  reason?: string;
}

export function verifyAccessCode(code: string, allowlist: string | undefined): AccessCodeResult {
  const normalizedCode = code.trim();

  if (!/^\d{6}$/.test(normalizedCode)) {
    return { ok: false, reason: "6자리 숫자 코드를 입력해주세요." };
  }

  const allowedCodes = parseAllowlist(allowlist);
  if (allowedCodes.length === 0) {
    return { ok: false, reason: "분석 코드가 아직 설정되지 않았습니다." };
  }

  if (!allowedCodes.includes(normalizedCode)) {
    return { ok: false, reason: "입력한 코드가 확인되지 않습니다." };
  }

  return { ok: true };
}

export function getAccessCodeAllowlist(): string {
  if (process.env.ANALYSIS_ACCESS_CODES) {
    return process.env.ANALYSIS_ACCESS_CODES;
  }

  return process.env.NODE_ENV === "production" ? "" : "123456";
}

function parseAllowlist(allowlist: string | undefined): string[] {
  return (allowlist || "")
    .split(",")
    .map((code) => code.trim())
    .filter((code) => /^\d{6}$/.test(code));
}
