const SUPABASE_URL_ENV = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_SERVICE_ROLE_KEY_ENV = "SUPABASE_SERVICE_ROLE_KEY";

export type SupabaseFetch = (input: string | URL, init?: RequestInit) => Promise<Response>;
type EnvLike = Partial<Record<string, string | undefined>>;

export interface SupabaseServerConfig {
  url: string;
  serviceRoleKey: string;
}

export interface SupabaseSelectOptions {
  select?: string;
  limit?: number;
  order?: string;
}

export interface SupabaseUpsertOptions {
  onConflict?: string;
  select?: string;
}

export interface SupabaseRestClient {
  selectMany<Row>(
    table: string,
    filters: Record<string, string | number | boolean>,
    options?: SupabaseSelectOptions
  ): Promise<Row[]>;
  selectOne<Row>(
    table: string,
    filters: Record<string, string | number | boolean>,
    options?: SupabaseSelectOptions
  ): Promise<Row | null>;
  upsertOne<Row>(table: string, record: Record<string, unknown>, options?: SupabaseUpsertOptions): Promise<Row>;
  insertOne<Row>(table: string, record: Record<string, unknown>): Promise<Row>;
}

export class SupabaseConfigError extends Error {
  readonly missingEnv: string[];

  constructor(missingEnv: string[]) {
    super(`Missing or invalid Supabase environment variables: ${missingEnv.join(", ")}`);
    this.name = "SupabaseConfigError";
    this.missingEnv = missingEnv;
  }
}

export class SupabaseRequestError extends Error {
  readonly status?: number;
  readonly detail?: unknown;

  constructor(message: string, status?: number, detail?: unknown) {
    super(message);
    this.name = "SupabaseRequestError";
    this.status = status;
    this.detail = detail;
  }
}

export function getSupabaseServerConfig(env: EnvLike = process.env): SupabaseServerConfig {
  const rawUrl = env[SUPABASE_URL_ENV]?.trim();
  const serviceRoleKey = env[SUPABASE_SERVICE_ROLE_KEY_ENV]?.trim();
  const missing = [
    ...(rawUrl ? [] : [SUPABASE_URL_ENV]),
    ...(serviceRoleKey ? [] : [SUPABASE_SERVICE_ROLE_KEY_ENV])
  ];

  if (missing.length > 0) {
    throw new SupabaseConfigError(missing);
  }

  return {
    url: normalizeSupabaseUrl(rawUrl!, SUPABASE_URL_ENV),
    serviceRoleKey: serviceRoleKey!
  };
}

export function createSupabaseServerClient(
  config: SupabaseServerConfig = getSupabaseServerConfig(),
  fetchImpl: SupabaseFetch = fetch
): SupabaseRestClient {
  return new SupabaseRestClientImpl(config, fetchImpl);
}

class SupabaseRestClientImpl implements SupabaseRestClient {
  constructor(
    private readonly config: SupabaseServerConfig,
    private readonly fetchImpl: SupabaseFetch
  ) {}

  async selectMany<Row>(
    table: string,
    filters: Record<string, string | number | boolean>,
    options: SupabaseSelectOptions = {}
  ): Promise<Row[]> {
    const url = this.createSelectUrl(table, filters, options);

    const response = await this.fetchImpl(url, {
      method: "GET",
      headers: this.authHeaders()
    });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      throw new SupabaseRequestError("Supabase select request failed.", response.status, payload);
    }

    if (!Array.isArray(payload)) {
      throw new SupabaseRequestError("Supabase select response was not an array.", response.status, payload);
    }

    return payload as Row[];
  }

  async selectOne<Row>(
    table: string,
    filters: Record<string, string | number | boolean>,
    options: SupabaseSelectOptions = {}
  ): Promise<Row | null> {
    const url = this.createSelectUrl(table, filters, { ...options, limit: options.limit ?? 1 });

    const response = await this.fetchImpl(url, {
      method: "GET",
      headers: this.authHeaders()
    });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      throw new SupabaseRequestError("Supabase select request failed.", response.status, payload);
    }

    if (!Array.isArray(payload)) {
      throw new SupabaseRequestError("Supabase select response was not an array.", response.status, payload);
    }

    return (payload[0] as Row | undefined) ?? null;
  }

  async upsertOne<Row>(
    table: string,
    record: Record<string, unknown>,
    options: SupabaseUpsertOptions = {}
  ): Promise<Row> {
    const url = this.createTableUrl(table);

    if (options.onConflict) {
      assertIdentifier(options.onConflict, "onConflict column");
      url.searchParams.set("on_conflict", options.onConflict);
    }

    if (options.select) {
      url.searchParams.set("select", options.select);
    }

    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: this.authHeaders({
        "content-type": "application/json",
        prefer: "resolution=merge-duplicates,return=representation"
      }),
      body: JSON.stringify(record)
    });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      throw new SupabaseRequestError("Supabase upsert request failed.", response.status, payload);
    }

    if (!Array.isArray(payload) || payload.length === 0) {
      throw new SupabaseRequestError("Supabase upsert response did not include a row.", response.status, payload);
    }

    return payload[0] as Row;
  }

  async insertOne<Row>(table: string, record: Record<string, unknown>): Promise<Row> {
    const url = this.createTableUrl(table);
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: this.authHeaders({
        "content-type": "application/json",
        prefer: "return=representation",
      }),
      body: JSON.stringify(record),
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) {
      throw new SupabaseRequestError("Supabase insert request failed.", response.status, payload);
    }
    if (!Array.isArray(payload) || payload.length === 0) {
      throw new SupabaseRequestError("Supabase insert response did not include a row.", response.status, payload);
    }
    return payload[0] as Row;
  }

  private createTableUrl(table: string): URL {
    assertIdentifier(table, "table");
    return new URL(`${this.config.url}/rest/v1/${table}`);
  }

  private createSelectUrl(
    table: string,
    filters: Record<string, string | number | boolean>,
    options: SupabaseSelectOptions
  ): URL {
    const url = this.createTableUrl(table);
    url.searchParams.set("select", options.select ?? "*");

    for (const [column, value] of Object.entries(filters)) {
      assertIdentifier(column, "filter column");
      url.searchParams.set(column, `eq.${String(value)}`);
    }

    if (options.order) {
      assertOrderExpression(options.order);
      url.searchParams.set("order", options.order);
    }

    if (options.limit) {
      url.searchParams.set("limit", String(options.limit));
    }

    return url;
  }

  private authHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      apikey: this.config.serviceRoleKey,
      authorization: `Bearer ${this.config.serviceRoleKey}`,
      ...extraHeaders
    };
  }
}

function normalizeSupabaseUrl(rawUrl: string, envName: string): string {
  try {
    const parsed = new URL(rawUrl);

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("Unsupported Supabase URL protocol.");
    }

    return parsed.toString().replace(/\/+$/, "");
  } catch {
    throw new SupabaseConfigError([envName]);
  }
}

function assertIdentifier(value: string, label: string): void {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new SupabaseRequestError(`Invalid Supabase ${label}.`);
  }
}

function assertOrderExpression(value: string): void {
  if (!/^[A-Za-z_][A-Za-z0-9_]*(\.(asc|desc|nullsfirst|nullslast))*$/.test(value)) {
    throw new SupabaseRequestError("Invalid Supabase order expression.");
  }
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new SupabaseRequestError("Supabase response was not valid JSON.", response.status);
  }
}
