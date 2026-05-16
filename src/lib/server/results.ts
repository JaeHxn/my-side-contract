import { z } from "zod";
import { contractCategories, type ContractAnalysisResult } from "@/src/lib/contracts/types";
import { createSupabaseServerClient, type SupabaseRestClient } from "@/src/lib/supabase/server";

const RESULT_TABLE = "contract_analysis_results";
const RESULT_SELECT = "id, category, provider, overall_risk, result, created_at";
const RESULT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/;

const riskLevelSchema = z.enum(["danger", "warning", "safe", "missing"]);
const findingTypeSchema = z.enum(["illegal", "unfavorable", "normal", "missing"]);
const providerSchema = z.enum(["rule-based", "ai-assisted"]);
const overallRiskSchema = z.enum(["high", "medium", "low"]);
const lawReferenceSchema = z
  .object({
    title: z.string().min(1),
    article: z.string().optional(),
    source: z.enum(["law-api", "built-in"]),
    url: z.string().url().optional(),
    lastChecked: z.string().optional()
  })
  .passthrough();

const analysisItemSchema = z
  .object({
    id: z.string().min(1),
    clauseTitle: z.string(),
    originalText: z.string(),
    type: findingTypeSchema,
    riskLevel: riskLevelSchema,
    reason: z.string(),
    legalBasis: z.array(lawReferenceSchema),
    recommendation: z.string()
  })
  .passthrough();

const missingClauseSchema = z
  .object({
    key: z.string().min(1),
    title: z.string(),
    riskLevel: z.literal("missing"),
    whyItMatters: z.string(),
    recommendation: z.string(),
    legalBasis: z.array(lawReferenceSchema)
  })
  .passthrough();

const analysisSummarySchema = z
  .object({
    overallRisk: overallRiskSchema,
    headline: z.string(),
    nextStep: z.string(),
    riskyCount: z.number().int().nonnegative(),
    warningCount: z.number().int().nonnegative(),
    safeCount: z.number().int().nonnegative(),
    missingCount: z.number().int().nonnegative()
  })
  .passthrough();

export const contractAnalysisResultSchema = z
  .object({
    id: z.string().min(3).max(128),
    category: z.enum(contractCategories),
    provider: providerSchema,
    createdAt: z.string().datetime(),
    summary: analysisSummarySchema,
    items: z.array(analysisItemSchema),
    missingClauses: z.array(missingClauseSchema),
    legalReferences: z.array(lawReferenceSchema),
    disclaimer: z.string()
  })
  .passthrough() as z.ZodType<ContractAnalysisResult>;

const resultRowSchema = z.object({
  id: z.string(),
  category: z.enum(contractCategories),
  provider: providerSchema,
  overall_risk: overallRiskSchema,
  result: contractAnalysisResultSchema,
  created_at: z.string().min(1)
});

export const createResultRequestSchema = z.object({
  analysis: contractAnalysisResultSchema
});

export interface StoredContractAnalysisResult {
  id: string;
  category: ContractAnalysisResult["category"];
  provider: ContractAnalysisResult["provider"];
  overallRisk: ContractAnalysisResult["summary"]["overallRisk"];
  createdAt: string;
  analysis: ContractAnalysisResult;
}

export class ResultValidationError extends Error {
  readonly issues?: Array<{ code: string; message: string; path: Array<string | number> }>;

  constructor(message: string, issues?: Array<{ code: string; message: string; path: Array<string | number> }>) {
    super(message);
    this.name = "ResultValidationError";
    this.issues = issues;
  }
}

export async function saveContractAnalysisResult(
  analysisInput: unknown,
  client: SupabaseRestClient = createSupabaseServerClient()
): Promise<StoredContractAnalysisResult> {
  const analysis = parseAnalysisResult(analysisInput);
  const row = toResultRow(analysis);
  const saved = await client.upsertOne<unknown>(RESULT_TABLE, row, {
    onConflict: "id",
    select: RESULT_SELECT
  });

  return parseResultRow(saved);
}

export async function getContractAnalysisResult(
  resultIdInput: unknown,
  client: SupabaseRestClient = createSupabaseServerClient()
): Promise<StoredContractAnalysisResult | null> {
  const id = parseResultId(resultIdInput);
  const row = await client.selectOne<unknown>(RESULT_TABLE, { id }, { select: RESULT_SELECT });

  return row ? parseResultRow(row) : null;
}

function toResultRow(analysis: ContractAnalysisResult): Record<string, unknown> {
  return {
    id: parseResultId(analysis.id),
    category: analysis.category,
    provider: analysis.provider,
    overall_risk: analysis.summary.overallRisk,
    result: analysis,
    created_at: analysis.createdAt
  };
}

function parseAnalysisResult(input: unknown): ContractAnalysisResult {
  const parsed = contractAnalysisResultSchema.safeParse(input);

  if (!parsed.success) {
    throw new ResultValidationError("Invalid contract analysis result payload.", sanitizeIssues(parsed.error));
  }

  parseResultId(parsed.data.id);
  return parsed.data;
}

function parseResultRow(input: unknown): StoredContractAnalysisResult {
  const parsed = resultRowSchema.safeParse(input);

  if (!parsed.success) {
    throw new ResultValidationError("Stored contract analysis result row is invalid.", sanitizeIssues(parsed.error));
  }

  return {
    id: parseResultId(parsed.data.id),
    category: parsed.data.category,
    provider: parsed.data.provider,
    overallRisk: parsed.data.overall_risk,
    createdAt: parsed.data.created_at,
    analysis: parsed.data.result
  };
}

function parseResultId(input: unknown): string {
  if (typeof input !== "string") {
    throw new ResultValidationError("Result id must be a string.");
  }

  const id = input.trim();

  if (!RESULT_ID_PATTERN.test(id)) {
    throw new ResultValidationError("Result id format is invalid.");
  }

  return id;
}

function sanitizeIssues(error: z.ZodError): Array<{ code: string; message: string; path: Array<string | number> }> {
  return error.issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: issue.path
  }));
}
