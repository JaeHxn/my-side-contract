import { randomInt } from "node:crypto";
import { z } from "zod";
import { createSupabaseServerClient, type SupabaseRestClient } from "@/src/lib/supabase/server";

const ACCESS_CODE_TABLE = "analysis_access_codes";
const ACCESS_CODE_SELECT =
  "code, status, buyer_name, phone, memo, issued_at, expires_at, used_at, result_id";
const SIX_DIGIT_CODE_PATTERN = /^\d{6}$/;

const accessCodeStatusSchema = z.enum(["active", "used", "expired", "revoked"]);

const accessCodeRowSchema = z.object({
  code: z.string().regex(SIX_DIGIT_CODE_PATTERN),
  status: accessCodeStatusSchema,
  buyer_name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
  issued_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  used_at: z.string().datetime().nullable().optional(),
  result_id: z.string().nullable().optional()
});

export const createAccessCodeInputSchema = z.object({
  buyerName: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  memo: z.string().trim().max(300).optional(),
  ttlDays: z.number().int().min(1).max(90).default(30)
});

export const listAccessCodeInputSchema = z.object({
  status: accessCodeStatusSchema.optional(),
  limit: z.number().int().min(1).max(100).default(50)
});

export type AccessCodeStatus = z.infer<typeof accessCodeStatusSchema>;

export interface AnalysisAccessCode {
  code: string;
  status: AccessCodeStatus;
  buyerName: string | null;
  phone: string | null;
  memo: string | null;
  issuedAt: string;
  expiresAt: string;
  usedAt: string | null;
  resultId: string | null;
}

export type AnalysisAccessCodeVerification =
  | {
      ok: true;
      accessCode: AnalysisAccessCode;
    }
  | {
      ok: false;
      reason: string;
    };

export class AccessCodeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccessCodeValidationError";
  }
}

export interface AccessCodeOperationOptions {
  client?: SupabaseRestClient;
  now?: Date;
  codeGenerator?: () => string;
}

export function generateSixDigitAccessCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function createAnalysisAccessCode(
  input: unknown,
  options: AccessCodeOperationOptions = {}
): Promise<AnalysisAccessCode> {
  const parsed = createAccessCodeInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new AccessCodeValidationError("분석 코드 발급 요청 형식이 올바르지 않습니다.");
  }

  const client = options.client ?? createSupabaseServerClient();
  const now = options.now ?? new Date();
  const codeGenerator = options.codeGenerator ?? generateSixDigitAccessCode;
  const issuedAt = now.toISOString();
  const expiresAt = addDays(now, parsed.data.ttlDays).toISOString();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = parseAccessCode(codeGenerator());
    const existing = await client.selectOne<unknown>(ACCESS_CODE_TABLE, { code }, { select: ACCESS_CODE_SELECT });

    if (existing) {
      continue;
    }

    const row = await client.upsertOne<unknown>(
      ACCESS_CODE_TABLE,
      {
        code,
        status: "active",
        buyer_name: normalizeOptionalText(parsed.data.buyerName),
        phone: normalizeOptionalText(parsed.data.phone),
        memo: normalizeOptionalText(parsed.data.memo),
        issued_at: issuedAt,
        expires_at: expiresAt,
        used_at: null,
        result_id: null
      },
      {
        onConflict: "code",
        select: ACCESS_CODE_SELECT
      }
    );

    return parseAccessCodeRow(row);
  }

  throw new AccessCodeValidationError("분석 코드 생성에 실패했습니다. 다시 시도해주세요.");
}

export async function verifyAnalysisAccessCode(
  codeInput: unknown,
  options: AccessCodeOperationOptions = {}
): Promise<AnalysisAccessCodeVerification> {
  const code = safeParseAccessCode(codeInput);

  if (!code) {
    return { ok: false, reason: "6자리 숫자 코드를 입력해주세요." };
  }

  const client = options.client ?? createSupabaseServerClient();
  const row = await client.selectOne<unknown>(ACCESS_CODE_TABLE, { code }, { select: ACCESS_CODE_SELECT });

  if (!row) {
    return { ok: false, reason: "입력한 코드가 확인되지 않습니다." };
  }

  const accessCode = parseAccessCodeRow(row);

  if (accessCode.status === "used") {
    return { ok: false, reason: "이미 사용된 분석 코드입니다." };
  }

  if (accessCode.status === "revoked") {
    return { ok: false, reason: "취소된 분석 코드입니다." };
  }

  if (accessCode.status === "expired" || isExpired(accessCode.expiresAt, options.now ?? new Date())) {
    return { ok: false, reason: "만료된 분석 코드입니다." };
  }

  return { ok: true, accessCode };
}

export async function markAnalysisAccessCodeUsed(
  codeInput: unknown,
  resultId: string,
  options: AccessCodeOperationOptions = {}
): Promise<AnalysisAccessCode> {
  const code = parseAccessCode(codeInput);
  const client = options.client ?? createSupabaseServerClient();
  const row = await client.selectOne<unknown>(ACCESS_CODE_TABLE, { code }, { select: ACCESS_CODE_SELECT });

  if (!row) {
    throw new AccessCodeValidationError("분석 코드를 찾을 수 없습니다.");
  }

  const accessCode = parseAccessCodeRow(row);

  if (accessCode.status !== "active" || isExpired(accessCode.expiresAt, options.now ?? new Date())) {
    throw new AccessCodeValidationError("사용할 수 없는 분석 코드입니다.");
  }

  const usedAt = (options.now ?? new Date()).toISOString();
  const saved = await client.upsertOne<unknown>(
    ACCESS_CODE_TABLE,
    {
      code: accessCode.code,
      status: "used",
      buyer_name: accessCode.buyerName,
      phone: accessCode.phone,
      memo: accessCode.memo,
      issued_at: accessCode.issuedAt,
      expires_at: accessCode.expiresAt,
      used_at: usedAt,
      result_id: resultId
    },
    {
      onConflict: "code",
      select: ACCESS_CODE_SELECT
    }
  );

  return parseAccessCodeRow(saved);
}

export async function listAnalysisAccessCodes(
  input: unknown = {},
  options: AccessCodeOperationOptions = {}
): Promise<AnalysisAccessCode[]> {
  const parsed = listAccessCodeInputSchema.safeParse(input || {});

  if (!parsed.success) {
    throw new AccessCodeValidationError("분석 코드 목록 요청 형식이 올바르지 않습니다.");
  }

  const client = options.client ?? createSupabaseServerClient();
  const filters: Record<string, string | number | boolean> = {};

  if (parsed.data.status) {
    filters.status = parsed.data.status;
  }

  const rows = await client.selectMany<unknown>(ACCESS_CODE_TABLE, filters, {
    select: ACCESS_CODE_SELECT,
    order: "issued_at.desc",
    limit: parsed.data.limit
  });

  return rows.map(parseAccessCodeRow);
}

export async function revokeAnalysisAccessCode(
  codeInput: unknown,
  options: AccessCodeOperationOptions = {}
): Promise<AnalysisAccessCode> {
  const code = parseAccessCode(codeInput);
  const client = options.client ?? createSupabaseServerClient();
  const row = await client.selectOne<unknown>(ACCESS_CODE_TABLE, { code }, { select: ACCESS_CODE_SELECT });

  if (!row) {
    throw new AccessCodeValidationError("분석 코드를 찾을 수 없습니다.");
  }

  const accessCode = parseAccessCodeRow(row);

  if (accessCode.status === "used") {
    throw new AccessCodeValidationError("이미 사용된 분석 코드는 취소할 수 없습니다.");
  }

  if (accessCode.status === "revoked") {
    return accessCode;
  }

  const saved = await client.upsertOne<unknown>(
    ACCESS_CODE_TABLE,
    {
      code: accessCode.code,
      status: "revoked",
      buyer_name: accessCode.buyerName,
      phone: accessCode.phone,
      memo: accessCode.memo,
      issued_at: accessCode.issuedAt,
      expires_at: accessCode.expiresAt,
      used_at: accessCode.usedAt,
      result_id: accessCode.resultId
    },
    {
      onConflict: "code",
      select: ACCESS_CODE_SELECT
    }
  );

  return parseAccessCodeRow(saved);
}

function parseAccessCodeRow(input: unknown): AnalysisAccessCode {
  const parsed = accessCodeRowSchema.safeParse(input);

  if (!parsed.success) {
    throw new AccessCodeValidationError("저장된 분석 코드 형식이 올바르지 않습니다.");
  }

  return {
    code: parsed.data.code,
    status: parsed.data.status,
    buyerName: parsed.data.buyer_name || null,
    phone: parsed.data.phone || null,
    memo: parsed.data.memo || null,
    issuedAt: parsed.data.issued_at,
    expiresAt: parsed.data.expires_at,
    usedAt: parsed.data.used_at || null,
    resultId: parsed.data.result_id || null
  };
}

function parseAccessCode(input: unknown): string {
  const code = safeParseAccessCode(input);

  if (!code) {
    throw new AccessCodeValidationError("6자리 숫자 코드를 입력해주세요.");
  }

  return code;
}

function safeParseAccessCode(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const code = input.trim();
  return SIX_DIGIT_CODE_PATTERN.test(code) ? code : null;
}

function normalizeOptionalText(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function isExpired(expiresAt: string, now: Date): boolean {
  return new Date(expiresAt).getTime() <= now.getTime();
}
