import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "개인정보처리방침 | 내편계약서",
  description: "내편계약서 개인정보처리방침. 계약서 분석을 위해 수집하는 정보와 보호 방법을 안내합니다.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "1. 수집하는 개인정보 항목",
    body: [
      "내편계약서는 계약서 분석 서비스 제공을 위해 다음 정보를 수집합니다.",
    ],
    list: [
      "계약서 텍스트: 사용자가 입력하거나 파일(TXT·PDF·사진)로 업로드한 계약서 내용 — 분석 목적으로만 사용",
      "분석 코드: 결제 확인 후 발급되는 6자리 코드",
      "분석 결과 데이터: AI가 생성한 조항별 위험도, 법령 근거, 권고 문구",
    ],
    after: [
      "별도의 회원가입 절차가 없어 이름·생년월일·주소 등 일반적인 신상정보는 수집하지 않습니다. 계약서에 개인정보(이름, 연락처 등)가 포함되어 있을 수 있으나, 이는 분석 목적 외 용도로 사용하지 않습니다.",
    ],
  },
  {
    title: "2. 개인정보의 이용 목적",
    body: [
      "수집한 정보는 계약서의 불리한 조항·불법 가능 문구·빠진 보호 조항을 분석하고, 그 결과를 사용자가 30일간 재조회할 수 있도록 제공하는 목적으로만 이용합니다.",
    ],
  },
  {
    title: "3. 보유 및 이용 기간",
    body: [
      "계약서 텍스트와 분석 결과 데이터는 분석 완료일로부터 30일간 보관 후 시스템에서 자동으로 영구 삭제됩니다. 30일이 지나면 결과 재조회가 불가능합니다.",
    ],
  },
  {
    title: "4. 개인정보의 제3자 제공",
    body: [
      "내편계약서는 사용자의 정보를 제3자에게 제공하지 않습니다. 다만 AI 분석 처리를 위해 계약서 텍스트가 OpenAI API로 전송되며, 이는 분석 서비스 제공이라는 목적 범위 내의 처리에 해당합니다. 해당 데이터는 분석 응답 생성 외의 용도로 사용되지 않습니다.",
    ],
  },
  {
    title: "5. 개인정보의 파기 절차 및 방법",
    body: [
      "보유 기간(30일)이 경과한 계약서 텍스트와 분석 결과는 복구가 불가능한 방식으로 시스템에서 영구 삭제됩니다. 파기 대상에는 업로드된 원본 파일과 추출된 텍스트가 모두 포함됩니다.",
    ],
  },
  {
    title: "6. 개인정보 보호를 위한 조치",
    body: [
      "계약서 데이터는 암호화된 통신(HTTPS)으로 전송되며, 접근 권한이 통제된 환경에 저장됩니다. 분석 코드 없이는 결과에 접근할 수 없습니다.",
    ],
  },
  {
    title: "7. 이용자의 권리",
    body: [
      "사용자는 자신의 계약서 데이터에 대해 삭제를 요청할 수 있습니다. 보유 기간(30일) 내 삭제를 원하시면 아래 연락처로 분석 코드와 함께 요청해 주세요.",
    ],
  },
  {
    title: "8. 문의처",
    body: [
      "개인정보 처리에 관한 문의는 skfkgksrnr@gmail.com 으로 연락해 주시기 바랍니다.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-5 sm:px-6">
        <Link className="shrink-0 text-xl font-black text-ink" href="/">
          내편계약서
        </Link>
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ink/55 transition hover:text-sage"
          href="/"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          홈으로
        </Link>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">
        <p className="mb-2 text-sm font-black text-sage">개인정보 보호</p>
        <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">
          개인정보처리방침
        </h1>
        <p className="mt-4 text-base leading-7 text-ink/65">
          내편계약서는 사용자의 계약서 정보를 안전하게 보호합니다. 본 방침은 계약서 분석을 위해
          수집하는 정보와 그 처리 방법을 안내합니다.
        </p>
        <p className="mt-2 text-sm font-semibold text-ink/45">시행일: 2026년 5월 22일</p>

        <div className="mt-10 space-y-9">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-black text-ink">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p className="mt-3 text-sm leading-7 text-ink/70" key={paragraph}>
                  {paragraph}
                </p>
              ))}
              {section.list ? (
                <ul className="mt-3 space-y-2">
                  {section.list.map((item) => (
                    <li
                      className="flex gap-2 text-sm leading-7 text-ink/70"
                      key={item}
                    >
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.after?.map((paragraph) => (
                <p className="mt-3 text-sm leading-7 text-ink/70" key={paragraph}>
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-ink/10 pt-6 text-sm font-bold text-sage">
          <Link className="transition hover:underline" href="/terms">
            이용약관 보기
          </Link>
          <Link className="transition hover:underline" href="/">
            홈으로 돌아가기
          </Link>
        </div>
      </article>
    </main>
  );
}
