create table if not exists public.payment_requests (
  id text primary key default gen_random_uuid()::text,
  depositor_name text not null,
  phone text not null check (phone ~ '^[0-9]{10,11}$'),
  amount integer not null default 3900,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  memo text,
  issued_code text references public.analysis_access_codes(code) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_requests_status_created_idx
  on public.payment_requests (status, created_at desc);

alter table public.payment_requests enable row level security;

-- 공개 insert 허용 (입금 신청은 누구나 가능)
create policy "anyone_can_insert_payment_request"
  on public.payment_requests
  for insert
  to anon, authenticated
  with check (true);

-- 조회/수정은 service_role만 (관리자 전용)
revoke select, update, delete on table public.payment_requests from anon;
revoke select, update, delete on table public.payment_requests from authenticated;
grant all on table public.payment_requests to service_role;

create or replace function public.set_payment_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists payment_requests_updated_at on public.payment_requests;

create trigger payment_requests_updated_at
  before update on public.payment_requests
  for each row
  execute function public.set_payment_requests_updated_at();

comment on table public.payment_requests is
  '사용자 입금 신청 테이블. insert는 anon에게 개방, 조회/수정/삭제는 service_role만 가능.';
