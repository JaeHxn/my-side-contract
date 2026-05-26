import { NextResponse } from "next/server";

// Threads OAuth 콜백 — 인증 코드를 장기 액세스 토큰으로 교환한다
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin?threads_error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/admin?threads_error=no_code", request.url));
  }

  const appId = process.env.THREADS_APP_ID?.trim();
  const appSecret = process.env.THREADS_APP_SECRET?.trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://my-side-contract.vercel.app";
  const redirectUri = `${siteUrl}/api/auth/threads/callback`;

  if (!appId || !appSecret) {
    return errorPage("THREADS_APP_ID 또는 THREADS_APP_SECRET 환경변수가 설정되지 않았습니다.");
  }

  try {
    // 1단계: 인증 코드 → 단기 토큰 (1시간)
    const tokenRes = await fetch("https://graph.threads.net/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      return errorPage(`단기 토큰 발급 실패: ${detail}`);
    }

    const { access_token: shortToken, user_id } = (await tokenRes.json()) as {
      access_token: string;
      user_id: string;
    };

    // 2단계: 단기 토큰 → 장기 토큰 (60일)
    const longRes = await fetch(
      `https://graph.threads.net/access_token?` +
        new URLSearchParams({
          grant_type: "th_exchange_token",
          client_secret: appSecret,
          access_token: shortToken,
        })
    );

    if (!longRes.ok) {
      const detail = await longRes.text();
      return errorPage(`장기 토큰 교환 실패: ${detail}`);
    }

    const { access_token: longToken, expires_in } = (await longRes.json()) as {
      access_token: string;
      expires_in: number;
    };

    const expiryDate = new Date(Date.now() + expires_in * 1000).toLocaleDateString("ko-KR");

    return new NextResponse(buildSuccessHtml({ longToken, userId: user_id, expiryDate }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return errorPage(msg);
  }
}

function escapeHtmlSimple(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function errorPage(message: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>Threads 연결 오류</title>
    <style>body{font-family:sans-serif;max-width:600px;margin:60px auto;padding:0 20px}
    .err{background:#fee;border:1px solid #fcc;border-radius:8px;padding:20px}
    a{color:#4a7c59;font-weight:bold}</style></head>
    <body><div class="err"><h2>오류 발생</h2><p>${escapeHtmlSimple(message)}</p></div>
    <p style="margin-top:20px"><a href="/admin">&#x2190; 관리자 페이지로 돌아가기</a></p></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function buildSuccessHtml({
  longToken,
  userId,
  expiryDate,
}: {
  longToken: string;
  userId: string;
  expiryDate: string;
}): string {
  // All three values are HTML-escaped before insertion into the template.
  // Copy buttons use data attributes read by an inline script so that no
  // user-controlled text ever appears inside a JS string literal.
  const safeUserId = escapeHtml(userId);
  const safeLongToken = escapeHtml(longToken);
  const safeExpiryDate = escapeHtml(expiryDate);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>Threads 연결 완료</title>
  <style>
    body { font-family: sans-serif; max-width: 700px; margin: 60px auto; padding: 0 20px; color: #1a1a1a; }
    h2 { color: #4a7c59; }
    .card { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 10px; padding: 24px; margin: 20px 0; }
    .token-box { background: #1a1a1a; color: #7ee8a2; border-radius: 8px; padding: 14px; word-break: break-all; font-family: monospace; font-size: 13px; }
    .step { background: #e8f4ec; border-left: 4px solid #4a7c59; padding: 12px 16px; margin: 10px 0; border-radius: 0 6px 6px 0; }
    button { background: #1a1a1a; color: white; border: none; border-radius: 6px; padding: 10px 18px; cursor: pointer; font-size: 14px; font-weight: bold; }
    button:hover { background: #4a7c59; }
    a { color: #4a7c59; font-weight: bold; }
  </style>
</head>
<body>
  <h2>Threads 연결 완료!</h2>
  <p>장기 액세스 토큰을 발급했습니다. <strong>${safeExpiryDate}</strong>까지 유효합니다 (60일).</p>

  <div class="card">
    <p style="margin:0 0 10px;font-weight:bold">THREADS_USER_ID</p>
    <div class="token-box" id="uid">${safeUserId}</div>
    <button data-copy-target="uid" style="margin-top:10px">복사</button>
  </div>

  <div class="card">
    <p style="margin:0 0 10px;font-weight:bold">THREADS_ACCESS_TOKEN (장기, 60일)</p>
    <div class="token-box" id="tok">${safeLongToken}</div>
    <button data-copy-target="tok" style="margin-top:10px">복사</button>
  </div>

  <div class="card">
    <p style="font-weight:bold;margin:0 0 12px">Vercel에 추가하는 방법</p>
    <div class="step">1. <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">vercel.com/dashboard</a> &rarr; 프로젝트 &rarr; Settings &rarr; Environment Variables</div>
    <div class="step">2. <code>THREADS_USER_ID</code> = 위 값 추가</div>
    <div class="step">3. <code>THREADS_ACCESS_TOKEN</code> = 위 값 추가</div>
    <div class="step">4. Redeploy (배포 다시 실행)</div>
  </div>

  <p style="color:#888;font-size:13px">이 페이지를 닫기 전에 토큰을 복사하세요. 이 페이지는 다시 표시되지 않습니다.</p>
  <p><a href="/admin">&#x2190; 관리자 페이지로 돌아가기</a></p>

  <script>
    document.querySelectorAll('button[data-copy-target]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var targetId = btn.getAttribute('data-copy-target');
        var el = document.getElementById(targetId);
        if (el) { navigator.clipboard.writeText(el.textContent || ''); }
      });
    });
  </script>
</body>
</html>`;
}
