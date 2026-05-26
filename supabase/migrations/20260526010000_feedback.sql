create table if not exists public.feedback (
  id text primary key default gen_random_uuid()::text,
  message text not null check (char_length(message) >= 5 and char_length(message) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);

alter table public.feedback enable row level security;

-- 누구나 제출 가능
create policy "anyone_can_submit_feedback"
  on public.feedback
  for insert
  to anon, authenticated
  with check (true);

-- 조회·수정·삭제는 service_role만
revoke select, update, delete on table public.feedback from anon;
revoke select, update, delete on table public.feedback from authenticated;
grant all on table public.feedback to service_role;

comment on table public.feedback is
  '베타 배너 "관리자에게 글쓰기" 피드백 테이블. insert는 anon 개방, 조회는 service_role만.';
