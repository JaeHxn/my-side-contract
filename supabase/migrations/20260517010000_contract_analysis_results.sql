create table if not exists public.contract_analysis_results (
  id text primary key check (id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$'),
  category text not null check (category in ('housing-lease', 'labor', 'wedding', 'interior', 'freelance')),
  provider text not null check (provider in ('rule-based', 'ai-assisted')),
  overall_risk text not null check (overall_risk in ('high', 'medium', 'low')),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contract_analysis_results_created_at_idx
  on public.contract_analysis_results (created_at desc);

create index if not exists contract_analysis_results_category_created_at_idx
  on public.contract_analysis_results (category, created_at desc);

alter table public.contract_analysis_results enable row level security;

revoke all on table public.contract_analysis_results from anon;
revoke all on table public.contract_analysis_results from authenticated;
grant all on table public.contract_analysis_results to service_role;

create or replace function public.set_contract_analysis_results_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contract_analysis_results_updated_at on public.contract_analysis_results;

create trigger contract_analysis_results_updated_at
before update on public.contract_analysis_results
for each row
execute function public.set_contract_analysis_results_updated_at();

comment on table public.contract_analysis_results is
  'Server-owned persisted contract analysis results. Access is intended through service-role API routes only.';
