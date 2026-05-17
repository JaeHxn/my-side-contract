create table if not exists public.analysis_access_codes (
  code text primary key check (code ~ '^[0-9]{6}$'),
  status text not null default 'active' check (status in ('active', 'used', 'expired', 'revoked')),
  buyer_name text,
  phone text,
  memo text,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  result_id text references public.contract_analysis_results(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists analysis_access_codes_status_expires_idx
  on public.analysis_access_codes (status, expires_at);

alter table public.analysis_access_codes enable row level security;

revoke all on table public.analysis_access_codes from anon;
revoke all on table public.analysis_access_codes from authenticated;
grant all on table public.analysis_access_codes to service_role;

create or replace function public.set_analysis_access_codes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists analysis_access_codes_updated_at on public.analysis_access_codes;

create trigger analysis_access_codes_updated_at
  before update on public.analysis_access_codes
  for each row
  execute function public.set_analysis_access_codes_updated_at();

comment on table public.analysis_access_codes is
  'Server-owned payment access codes for contract analysis. Public access is intentionally disabled by RLS.';
