import nodemailer from "nodemailer";

/** Gmail 앱 비밀번호 환경변수가 없으면 throw */
function getGmailConfig(): { user: string; pass: string } {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "GMAIL_USER 또는 GMAIL_APP_PASSWORD 환경변수가 설정되지 않았습니다."
    );
  }
  return { user, pass };
}

export interface SendAccessCodeOptions {
  to: string;
  buyerName: string;
  code: string;
  /** 유효 만료일 (Date 객체) */
  expiresAt: Date;
  /** 서비스 기본 URL (기본값: 환경변수 NEXT_PUBLIC_SITE_URL 또는 내편계약서 도메인) */
  siteUrl?: string;
}

/**
 * 이용 코드를 구매자 이메일로 발송한다.
 * Gmail SMTP + Nodemailer 사용 (별도 비용 없음, 500건/일)
 */
export async function sendAccessCodeEmail({
  to,
  buyerName,
  code,
  expiresAt,
  siteUrl,
}: SendAccessCodeOptions): Promise<void> {
  const { user, pass } = getGmailConfig();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const baseUrl =
    siteUrl ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://naepyeon-contract.vercel.app";

  const expiresStr = expiresAt.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = buildHtml({ buyerName, code, expiresStr, baseUrl });

  await transporter.sendMail({
    from: `"내편계약서" <${user}>`,
    to,
    subject: `[내편계약서] 이용 코드 발급 완료 — ${code}`,
    html,
  });
}

// ── 관리자 결제 신청 알림 ─────────────────────────────────────────────────

export interface PaymentNotificationOptions {
  depositorName: string;
  email: string;
  method: string;
  amount: number;
  requestId: string | null;
}

/**
 * 새 결제 신청이 들어오면 관리자(GMAIL_USER)에게 알림 이메일을 보낸다.
 * 실패해도 결제 신청 자체는 막지 않으므로 에러를 throw하지 않는다.
 */
export async function sendPaymentNotification(opts: PaymentNotificationOptions): Promise<void> {
  let config: { user: string; pass: string };
  try {
    config = getGmailConfig();
  } catch {
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: config.user, pass: config.pass },
  });

  const methodLabel = opts.method === "kakaopay" ? "카카오페이" : "계좌이체";
  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const adminUrl =
    process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin`
      : "https://naepyeon-contract.vercel.app/admin";

  await transporter.sendMail({
    from: `"내편계약서 알림" <${config.user}>`,
    to: config.user,
    subject: `[결제신청] ${opts.depositorName} · ${opts.amount.toLocaleString()}원 · ${methodLabel}`,
    html: `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#18181a;padding:24px 32px;">
            <p style="margin:0;font-size:18px;font-weight:900;color:#fff;">내편계약서</p>
            <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.45);">관리자 알림</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 20px;font-size:20px;font-weight:900;color:#18181a;">결제 신청이 들어왔습니다 🔔</h2>
            <table cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;color:#374151;border-collapse:collapse;">
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 0;color:#6b7280;width:90px;">입금자명</td>
                <td style="padding:10px 0;font-weight:700;">${opts.depositorName}</td>
              </tr>
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 0;color:#6b7280;">이메일</td>
                <td style="padding:10px 0;">${opts.email}</td>
              </tr>
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 0;color:#6b7280;">결제 방법</td>
                <td style="padding:10px 0;">${methodLabel}</td>
              </tr>
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 0;color:#6b7280;">금액</td>
                <td style="padding:10px 0;font-weight:700;">${opts.amount.toLocaleString()}원</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#6b7280;">신청 시각</td>
                <td style="padding:10px 0;">${now}</td>
              </tr>
            </table>
            <div style="margin-top:24px;text-align:center;">
              <a href="${adminUrl}" style="display:inline-block;background:#18181a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;">
                관리자 페이지에서 코드 발급 &rarr;
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f5f4f0;padding:16px 32px;border-top:1px solid #ebebeb;">
            <p style="margin:0;font-size:11px;color:#aaa;text-align:center;">&copy; 2026 내편계약서 &middot; 자동 발송 알림</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

/* ────────────────────────────────────────────────
   HTML 이메일 템플릿
   ──────────────────────────────────────────────── */
function buildHtml(p: {
  buyerName: string;
  code: string;
  expiresStr: string;
  baseUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>내편계약서 이용 코드</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="max-width:520px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- 헤더 -->
          <tr>
            <td style="background:#18181a;padding:28px 36px;">
              <p style="margin:0;font-size:20px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">내편계약서</p>
              <p style="margin:5px 0 0;font-size:12px;color:rgba(255,255,255,0.45);">AI 계약서 분석 서비스</p>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding:36px 36px 28px;">
              <p style="margin:0 0 6px;font-size:14px;color:#888888;">
                안녕하세요, <strong style="color:#18181a;">${p.buyerName}</strong>님
              </p>
              <h1 style="margin:0 0 28px;font-size:26px;font-weight:900;color:#18181a;line-height:1.3;">
                입금이 확인되어<br>이용 코드를 발급했습니다.
              </h1>

              <!-- 코드 박스 -->
              <div style="background:#f0f7f4;border:2px dashed #6b9e8a;border-radius:16px;padding:32px 24px;text-align:center;margin:0 0 28px;">
                <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#6b9e8a;letter-spacing:2px;text-transform:uppercase;">이용 코드</p>
                <p style="margin:0;font-size:48px;font-weight:900;color:#18181a;letter-spacing:10px;line-height:1;">${p.code}</p>
                <p style="margin:14px 0 0;font-size:12px;color:#9a9a9a;">유효기간 &nbsp;·&nbsp; ${p.expiresStr}까지</p>
              </div>

              <!-- 사용 방법 -->
              <div style="background:#fafaf8;border-radius:14px;padding:20px 24px;margin:0 0 28px;">
                <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#18181a;">사용 방법</p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:5px 0;font-size:13px;color:#555555;line-height:1.6;">
                      <span style="display:inline-block;width:20px;font-weight:700;color:#6b9e8a;">1.</span>아래 버튼을 눌러 서비스 접속
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;font-size:13px;color:#555555;line-height:1.6;">
                      <span style="display:inline-block;width:20px;font-weight:700;color:#6b9e8a;">2.</span>계약서 파일 (PDF 또는 이미지) 업로드
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;font-size:13px;color:#555555;line-height:1.6;">
                      <span style="display:inline-block;width:20px;font-weight:700;color:#6b9e8a;">3.</span>위 6자리 코드 입력 후 분석 시작
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA 버튼 -->
              <div style="text-align:center;margin:0 0 32px;">
                <a href="${p.baseUrl}/upload"
                  style="display:inline-block;background:#18181a;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:14px;font-size:15px;font-weight:700;letter-spacing:-0.3px;">
                  계약서 분석하러 가기 &rarr;
                </a>
              </div>

              <!-- 유의사항 -->
              <div style="border-top:1px solid #ebebeb;padding-top:20px;">
                <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.8;">
                  &bull;&nbsp;이용 코드 1개 = 계약서 분석 1회<br>
                  &bull;&nbsp;코드는 1회 사용 후 만료됩니다<br>
                  &bull;&nbsp;분실 시 이 이메일을 보관해 두세요
                </p>
              </div>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="background:#f5f4f0;padding:18px 36px;border-top:1px solid #ebebeb;">
              <p style="margin:0;font-size:11px;color:#aaaaaa;text-align:center;">
                &copy; 2026 내편계약서&nbsp;&nbsp;&middot;&nbsp;&nbsp;이 메일은 결제 확인 후 자동 발송됩니다
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
