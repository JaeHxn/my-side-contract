-- payment_requests 테이블에 email, method 컬럼 추가
-- phone 컬럼의 NOT NULL 제약을 완화 (이메일 기반 흐름으로 전환)

ALTER TABLE public.payment_requests
  ALTER COLUMN phone DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS email       text,
  ADD COLUMN IF NOT EXISTS method      text CHECK (method IN ('kakaopay', 'bank')),
  ADD COLUMN IF NOT EXISTS buyer_name  text
    GENERATED ALWAYS AS (depositor_name) STORED;

-- buyer_name 생성 컬럼이 이미 있을 경우 오류 방지: 별도로 email/method만 추가해도 됨
-- Supabase SQL 에디터에서 "Already exists" 오류가 나면 아래만 실행:
--   ALTER TABLE public.payment_requests ALTER COLUMN phone DROP NOT NULL;
--   ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS email text;
--   ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS method text CHECK (method IN ('kakaopay', 'bank'));

COMMENT ON COLUMN public.payment_requests.email IS
  '코드 발급 이메일 수신 주소. 입금 확인 시 이 주소로 이용 코드가 발송됨.';
COMMENT ON COLUMN public.payment_requests.method IS
  '결제 방법: kakaopay | bank';
