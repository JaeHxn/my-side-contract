import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const OUT_DIR = "marketing/instagram-2026-05-26";
const SITE_URL = "https://my-side-contract.vercel.app";
const WIDTH = 1080;
const HEIGHT = 1350;

await fs.mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();

async function captureSource(name, url, viewport = { width: 1440, height: 1200 }) {
  const page = await browser.newPage({ viewport });
  await page.goto(url, { waitUntil: "networkidle" });
  const filePath = path.join(OUT_DIR, `source-${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  await page.close();
  return filePath;
}

const sources = {
  home: await captureSource("home", SITE_URL),
  upload: await captureSource("upload", `${SITE_URL}/upload`),
  payment: await captureSource("payment", `${SITE_URL}/payment`)
};

async function asDataUri(filePath) {
  const buffer = await fs.readFile(filePath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

const sourceData = {
  home: await asDataUri(sources.home),
  upload: await asDataUri(sources.upload),
  payment: await asDataUri(sources.payment)
};

const baseCss = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", "Apple SD Gothic Neo", sans-serif;
    color: #18181a;
    background: #f7f3ea;
  }
  .post {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    padding: 72px 72px 60px;
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(135deg, rgba(37, 94, 77, 0.14), rgba(204, 165, 92, 0.10) 42%, rgba(255,255,255,0.92) 100%),
      #f7f3ea;
  }
  .post.dark {
    color: #fffaf0;
    background:
      linear-gradient(135deg, rgba(24,24,26,0.98), rgba(37,94,77,0.94) 64%, rgba(204,165,92,0.78));
  }
  .brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 42px;
    font-size: 30px;
    font-weight: 900;
    letter-spacing: 0;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 13px 20px;
    background: #255e4d;
    color: #fffaf0;
    font-size: 26px;
    font-weight: 900;
  }
  .dark .pill {
    background: #fffaf0;
    color: #18181a;
  }
  h1 {
    margin: 0;
    max-width: 900px;
    font-size: 78px;
    line-height: 1.04;
    letter-spacing: 0;
    font-weight: 950;
  }
  h2 {
    margin: 0;
    max-width: 900px;
    font-size: 66px;
    line-height: 1.08;
    letter-spacing: 0;
    font-weight: 950;
  }
  .sub {
    margin-top: 26px;
    max-width: 860px;
    font-size: 35px;
    line-height: 1.36;
    font-weight: 760;
    color: rgba(24,24,26,0.72);
  }
  .dark .sub { color: rgba(255,250,240,0.82); }
  .mock {
    position: absolute;
    left: 72px;
    right: 72px;
    bottom: 86px;
    height: 510px;
    border: 12px solid rgba(24,24,26,0.88);
    border-radius: 34px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 32px 72px rgba(24,24,26,0.28);
  }
  .mock img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }
  .mock.tall { height: 610px; }
  .mock.small {
    left: auto;
    right: 72px;
    width: 430px;
    height: 690px;
  }
  .list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    margin-top: 44px;
    max-width: 860px;
  }
  .item {
    min-height: 120px;
    border-radius: 24px;
    background: rgba(255,255,255,0.80);
    border: 2px solid rgba(24,24,26,0.10);
    padding: 25px 28px;
    font-size: 31px;
    font-weight: 900;
    line-height: 1.2;
  }
  .dark .item {
    background: rgba(255,250,240,0.12);
    border-color: rgba(255,250,240,0.22);
  }
  .badge-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 34px;
  }
  .badge {
    border-radius: 999px;
    padding: 13px 18px;
    background: rgba(255,255,255,0.84);
    border: 2px solid rgba(24,24,26,0.10);
    font-size: 27px;
    font-weight: 900;
  }
  .dark .badge {
    background: rgba(255,250,240,0.14);
    border-color: rgba(255,250,240,0.22);
  }
  .cta {
    position: absolute;
    left: 72px;
    right: 72px;
    bottom: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    border-radius: 26px;
    background: #18181a;
    color: #fffaf0;
    padding: 28px 34px;
    font-size: 32px;
    font-weight: 950;
  }
  .dark .cta {
    background: #fffaf0;
    color: #18181a;
  }
  .big-number {
    margin-top: 46px;
    font-size: 210px;
    line-height: 0.9;
    font-weight: 1000;
    color: #cca55c;
  }
  .footer {
    position: absolute;
    left: 72px;
    right: 72px;
    bottom: 42px;
    font-size: 24px;
    font-weight: 800;
    color: rgba(24,24,26,0.58);
  }
  .dark .footer { color: rgba(255,250,240,0.7); }
  .result-sample {
    position: absolute;
    left: 72px;
    right: 72px;
    bottom: 86px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 22px;
  }
  .result-card {
    min-height: 168px;
    border-radius: 26px;
    border: 2px solid rgba(255,250,240,0.22);
    background: rgba(255,250,240,0.12);
    padding: 28px;
  }
  .result-card strong {
    display: block;
    font-size: 32px;
    line-height: 1.18;
    font-weight: 950;
  }
  .result-card span {
    display: block;
    margin-top: 12px;
    font-size: 23px;
    line-height: 1.32;
    font-weight: 750;
    color: rgba(255,250,240,0.78);
  }
  .wide-sub {
    margin-top: 34px;
    max-width: 940px;
    font-size: 34px;
    line-height: 1.34;
    font-weight: 820;
    color: rgba(24,24,26,0.68);
  }
  .analysis-ui {
    position: absolute;
    left: 72px;
    right: 72px;
    bottom: 58px;
    border-radius: 34px;
    border: 8px solid rgba(24,24,26,0.86);
    background: #fffaf0;
    box-shadow: 0 32px 72px rgba(24,24,26,0.28);
    padding: 30px;
  }
  .summary-bar {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 18px;
    margin-bottom: 18px;
  }
  .summary-box {
    border-radius: 22px;
    background: #f4efe4;
    border: 2px solid rgba(24,24,26,0.08);
    padding: 20px 22px;
  }
  .summary-box b {
    display: block;
    font-size: 31px;
    line-height: 1.15;
    font-weight: 950;
  }
  .summary-box span {
    display: block;
    margin-top: 8px;
    font-size: 21px;
    line-height: 1.35;
    font-weight: 760;
    color: rgba(24,24,26,0.62);
  }
  .analysis-card {
    border-radius: 22px;
    border: 2px solid rgba(24,24,26,0.08);
    background: #ffffff;
    padding: 22px;
    margin-top: 14px;
  }
  .analysis-card.danger { border-color: rgba(225,60,82,0.28); background: #fff7f7; }
  .analysis-card.warn { border-color: rgba(204,165,92,0.35); background: #fffaf0; }
  .analysis-card.missing { border-color: rgba(37,94,77,0.22); background: #f6fbf8; }
  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 11px;
  }
  .card-title {
    font-size: 30px;
    line-height: 1.15;
    font-weight: 950;
  }
  .risk-chip {
    border-radius: 999px;
    padding: 9px 14px;
    font-size: 19px;
    line-height: 1;
    font-weight: 950;
    white-space: nowrap;
  }
  .danger .risk-chip { background: #ffe2e6; color: #b81832; }
  .warn .risk-chip { background: #fff0c7; color: #80601a; }
  .missing .risk-chip { background: #def3e8; color: #255e4d; }
  .card-text {
    font-size: 21px;
    line-height: 1.36;
    font-weight: 750;
    color: rgba(24,24,26,0.72);
  }
  .law-line {
    margin-top: 12px;
    border-radius: 14px;
    background: rgba(24,24,26,0.06);
    padding: 11px 13px;
    font-size: 19px;
    line-height: 1.3;
    font-weight: 850;
    color: rgba(24,24,26,0.78);
  }
  .recommend {
    margin-top: 10px;
    font-size: 20px;
    line-height: 1.34;
    font-weight: 900;
    color: #255e4d;
  }
`;

const posts = [
  {
    file: "01-sign-before-check.png",
    html: `
      <section class="post">
        <div class="brand"><span>내편계약서</span><span class="pill">출시 이벤트</span></div>
        <h1>받은 계약서,<br>사인 전에<br>내 편인지 확인</h1>
        <p class="sub">전월세·근로·인테리어·프리랜서 계약서의 위험 조항을 AI가 법령 근거와 함께 정리합니다.</p>
        <div class="badge-row">
          <span class="badge">위험 조항</span>
          <span class="badge">불리한 문구</span>
          <span class="badge">빠진 보호 조항</span>
        </div>
        <div class="mock"><img src="${sourceData.home}" alt=""></div>
      </section>`
  },
  {
    file: "02-ai-result-preview.png",
    html: `
      <section class="post dark">
        <div class="brand"><span>내편계약서</span><span class="pill">AI 분석</span></div>
        <h2>위험·불리·누락을<br>카드로 바로 확인</h2>
        <p class="sub">조항 원문, 위험 등급, 법 조항 근거, 쉬운 설명, 수정 권고 문구까지 한 번에 봅니다.</p>
        <div class="result-sample">
          <div class="result-card"><strong>🔴 불법 가능</strong><span>법정 권리를 포기시키는 문구를 먼저 표시합니다.</span></div>
          <div class="result-card"><strong>🟡 수정 권고</strong><span>일방적으로 불리한 조항은 대안 문구를 제안합니다.</span></div>
          <div class="result-card"><strong>⚠️ 빠진 보호</strong><span>보증금 반환, 임금 지급일처럼 빠진 내용을 짚습니다.</span></div>
          <div class="result-card"><strong>🟢 정상 확인</strong><span>즉시 위험이 낮아도 다시 볼 항목을 정리합니다.</span></div>
        </div>
      </section>`
  },
  {
    file: "03-supported-contracts.png",
    html: `
      <section class="post">
        <div class="brand"><span>내편계약서</span><span class="pill">지원 계약서</span></div>
        <h2>지금 바로<br>분석 가능한<br>계약서 4종</h2>
        <div class="list">
          <div class="item">전월세<br>계약서</div>
          <div class="item">근로<br>계약서</div>
          <div class="item">인테리어<br>계약서</div>
          <div class="item">프리랜서<br>계약서</div>
        </div>
        <p class="wide-sub">텍스트 붙여넣기, TXT/MD 파일 업로드, PDF·사진 OCR까지 지원합니다. 계약 전날에도 빠르게 확인할 수 있습니다.</p>
        <div class="cta"><span>전월세 · 근로 · 인테리어 · 프리랜서</span><span>3,900원</span></div>
      </section>`
  },
  {
    file: "04-first-10-free-code.png",
    html: `
      <section class="post dark">
        <div class="brand"><span>내편계약서</span><span class="pill">무료 이벤트</span></div>
        <h1>선착순<br>10명<br>무료 분석권</h1>
        <div class="big-number">10</div>
        <p class="sub">결제 페이지에서 이름과 이메일만 남겨주세요. 선착순 10명은 입금 없이 승인해드립니다.</p>
        <div class="cta"><span>이름·이메일 신청</span><span>입금 없이 승인</span></div>
      </section>`
  },
  {
    file: "05-result-example.png",
    html: `
      <section class="post">
        <div class="brand"><span>내편계약서</span><span class="pill">결과 예시</span></div>
        <h2>분석 결과는<br>이렇게 보여요</h2>
        <p class="sub">위험도, 법 조항 근거, 수정 권고까지 한눈에 확인합니다.</p>
        <div class="analysis-ui">
          <div class="summary-bar">
            <div class="summary-box">
              <b>종합 위험도: 높음</b>
              <span>서명 전 삭제·수정해야 할 조항이 있습니다.</span>
            </div>
            <div class="summary-box">
              <b>다음 행동</b>
              <span>상대방에게 수정 문구를 요청하세요.</span>
            </div>
          </div>
          <div class="analysis-card danger">
            <div class="card-head">
              <div class="card-title">퇴사 시 위약금 300만 원</div>
              <div class="risk-chip">위험</div>
            </div>
            <div class="card-text">근로자가 퇴사했다는 이유만으로 정해진 위약금을 물리는 조항은 문제가 될 수 있습니다.</div>
            <div class="law-line">근거: 근로기준법 제20조 위약 예정 금지</div>
            <div class="recommend">권고: 해당 위약금 문구 삭제 요청</div>
          </div>
          <div class="analysis-card warn">
            <div class="card-head">
              <div class="card-title">모든 수리비 임차인 부담</div>
              <div class="risk-chip">불리</div>
            </div>
            <div class="card-text">입주 전 하자와 사용 중 과실을 구분하지 않으면 임차인에게 과도하게 불리합니다.</div>
            <div class="law-line">근거: 민법 임대차 수선의무 관련 원칙</div>
            <div class="recommend">권고: 하자·노후·과실 책임을 나눠 기재</div>
          </div>
          <div class="analysis-card missing">
            <div class="card-head">
              <div class="card-title">보증금 반환 시점 누락</div>
              <div class="risk-chip">누락</div>
            </div>
            <div class="card-text">반환일과 방법이 없으면 계약 종료 시 분쟁이 생길 수 있습니다.</div>
            <div class="recommend">권고: 반환일, 계좌, 지연 시 처리 기준 추가</div>
          </div>
        </div>
      </section>`
  }
];

async function renderPost(post) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${baseCss}</style></head><body>${post.html}</body></html>`, {
    waitUntil: "networkidle"
  });
  await page.screenshot({ path: path.join(OUT_DIR, post.file), fullPage: false });
  await page.close();
}

for (const post of posts) {
  await renderPost(post);
}

const caption = `# 인스타 게시글 문안

계약서 사인하기 전, 불리한 조항이 있는지 확인해보세요.

내편계약서는 전월세·근로·인테리어·프리랜서 계약서를 AI로 분석해 위험 조항, 불리한 문구, 빠진 보호 조항을 법령 근거와 함께 쉬운 말로 정리해주는 서비스입니다.

출시 이벤트로 선착순 10명에게 계약서 분석 1회를 무료로 드립니다.

참여 방법:
1. 서비스에서 "3,900원으로 분석하기" 클릭
2. 이름과 이메일 입력 후 "결제 신청하기" 제출
3. 선착순 10명은 입금 없이 관리자가 승인
4. 이메일로 받은 6자리 코드로 계약서 분석

분석 결과는 참고용이며 법적 효력은 없습니다. 중요한 계약은 전문가 상담과 함께 확인하세요.

서비스: https://my-side-contract.vercel.app

#계약서검토 #전월세계약 #근로계약서 #프리랜서계약 #인테리어계약 #계약서분석 #AI계약서 #부동산계약 #노동법 #계약전확인
`;

const brief = `# 내편계약서 인스타 캠페인 요약

## 핵심 소개
내편계약서는 사용자가 받은 계약서를 사인하기 전에 AI로 빠르게 점검하는 서비스입니다. 전월세·근로·인테리어·프리랜서 계약서의 위험 조항, 불리한 문구, 빠진 보호 조항을 법령 근거와 함께 쉬운 말로 보여줍니다.

## 사용자에게 강조할 포인트
- 사인 전 불리한 조항을 먼저 발견
- 법령 근거와 쉬운 설명 제공
- 수정·삭제·추가 권고 문구 제공
- 텍스트 입력, 파일 업로드, PDF·사진 OCR 지원
- 분석 결과는 참고용이며 중요한 계약은 전문가 상담 권장

## 무료 이벤트 운영 문구
선착순 10명 무료 분석권 지급. 사용자가 결제 페이지에서 이름과 이메일을 입력해 신청하면, 관리자 화면의 결제 요청 목록에서 선착순 10명을 입금 확인 없이 승인합니다. 승인 시 시스템이 6자리 코드를 발급하고 이메일로 전송합니다.

## 생성 이미지
${posts.map((post) => `- ${post.file}`).join("\n")}
`;

await fs.writeFile(path.join(OUT_DIR, "instagram-caption.md"), caption, "utf8");
await fs.writeFile(path.join(OUT_DIR, "campaign-brief.md"), brief, "utf8");

await browser.close();

console.log(JSON.stringify({
  outDir: OUT_DIR,
  images: posts.map((post) => path.join(OUT_DIR, post.file)),
  sourceCaptures: Object.values(sources),
  docs: [
    path.join(OUT_DIR, "instagram-caption.md"),
    path.join(OUT_DIR, "campaign-brief.md")
  ]
}, null, 2));
