# Backend Supabase Boundary

## Env Boundary

Server code reads only these `.env.local` variable names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The server helper does not read or print secret values. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` can remain available for a future browser client, but this MVP backend boundary does not use it.

## Server Helpers

- `src/lib/supabase/server.ts` owns Supabase configuration validation and the minimal REST client.
- `src/lib/server/results.ts` owns result validation, row mapping, persistence, and retrieval.
- The implementation avoids adding `@supabase/supabase-js` because dependency files are outside this backend ownership slice.

## Result Storage

Migration:

- `supabase/migrations/20260517010000_contract_analysis_results.sql`

Table:

- `public.contract_analysis_results`
- `id text primary key`, matching current analyzer IDs such as `analysis-<hash>`
- `category`, `provider`, `overall_risk` stored as queryable columns
- `result jsonb` stores the typed `ContractAnalysisResult`
- RLS is enabled with no anon/authenticated policies; access is through server routes using the service role key

The table does not store raw uploaded contract text as a separate column. The analysis JSON may still contain clause excerpts in `items[].originalText`, so responses use `cache-control: no-store`.

## API Flow

Implemented:

- `POST /api/result`
  - Body: `{ "analysis": ContractAnalysisResult }`
  - Validates shape with Zod.
  - Upserts by `analysis.id`.
  - Returns `{ result: StoredContractAnalysisResult }`.

- `GET /api/result/[id]`
  - Validates the result id before querying.
  - Returns 404 when absent.
  - Returns only generic storage/configuration errors.

Recommended next integration:

1. Keep `/api/analysis` as the server-produced analysis boundary.
2. After analysis succeeds, call `saveContractAnalysisResult(analysis)` server-side and return the stored result id.
3. Point the result page at `GET /api/result/[id]`.
4. Before broad sharing, add either user auth or an opaque share token so result IDs are not the only access control.

## Verification Target

Use focused checks while this boundary is isolated:

```bash
npx vitest run src/lib/supabase/server.test.ts src/lib/server/results.test.ts app/api/result/route.test.ts app/api/result/[id]/route.test.ts
```

Run full tests/build after the analysis route is wired to persistence.
