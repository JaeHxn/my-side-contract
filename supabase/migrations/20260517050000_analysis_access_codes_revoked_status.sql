alter table public.analysis_access_codes
  drop constraint if exists analysis_access_codes_status_check;

alter table public.analysis_access_codes
  add constraint analysis_access_codes_status_check
  check (status in ('active', 'used', 'expired', 'revoked'));
