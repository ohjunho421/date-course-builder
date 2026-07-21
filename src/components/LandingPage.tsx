import Link from "next/link";
import BrandLogo from "./BrandLogo";
import PrimaryCta from "./PrimaryCta";
import AdBanner from "./AdBanner";

const arrow: React.CSSProperties = { color: "var(--gold-deep)", fontWeight: 800, fontSize: 13 };

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "1.5px dashed var(--line)",
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 13,
  color: "var(--ink-soft)",
  background: "#fff",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

// 한국어 문맥 줄바꿈: 의미 덩어리(명사구)가 줄 끝에서 쪼개지지 않게 묶는다
function NW({ children }: { children: React.ReactNode }) {
  return <span style={{ whiteSpace: "nowrap" }}>{children}</span>;
}

type Step = {
  icon: string;
  title: string;
  desc: React.ReactNode;
  extra?: React.ReactNode;
};

const steps: Step[] = [
  {
    icon: "🔗",
    title: "네이버 지도 링크 붙여넣기",
    desc: (
      <>
        가고 싶은 가게의 <NW>네이버 지도 공유 링크</NW>만 넣으면
        <br />
        <NW>사진·리뷰·영업시간</NW>이 자동으로 채워져요.
      </>
    ),
    extra: <div style={pill}>🔗 naver.me/xxxxx</div>,
  },
  {
    icon: "🗂️",
    title: "단계별로 후보 담기",
    desc: (
      <>
        <NW>‘카페 → 저녁 → 한 잔’</NW>처럼 흐름을 만들고,
        <br />
        각 단계에 가고 싶은 곳을 여러 곳 담아요.
      </>
    ),
    extra: (
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span className="chip">☕ 카페</span>
        <span style={arrow}>→</span>
        <span className="chip">🍽️ 저녁</span>
        <span style={arrow}>→</span>
        <span className="chip">🍸 한 잔</span>
      </div>
    ),
  },
  {
    icon: "💌",
    title: "링크 하나로 공유",
    desc: (
      <>
        완성된 코스를 <NW>카카오톡이나 링크</NW>로 보내면,
        <br />
        <NW>앱 설치 없이</NW> 상대 폰에서 바로 열려요.
      </>
    ),
  },
  {
    icon: "🎉",
    title: "상대가 고르면 코스 완성",
    desc: (
      <>
        상대가 마음에 드는 곳을 고르면,
        <br />
        <NW>지도 동선과 함께</NW> 우리 둘만의 코스가 완성돼요.
      </>
    ),
  },
];

function Badge({ n }: { n: number }) {
  return (
    <span
      className="serif"
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: "var(--wine)",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontSize: 15,
        fontWeight: 700,
        flex: "none",
      }}
    >
      {n}
    </span>
  );
}

export default function LandingPage() {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 22px 64px" }}>
      {/* hero */}
      <section style={{ textAlign: "center" }}>
        <div>
          <BrandLogo height={66} />
        </div>
        <div style={{ marginTop: 16 }}>
          <span className="chip" style={{ color: "var(--wine-2)" }}>
            🌙 우리 둘만의 데이트 코스
          </span>
        </div>
        <h1
          className="serif"
          style={{ fontSize: 28, color: "var(--wine)", fontWeight: 700, lineHeight: 1.3, margin: "14px 0 10px" }}
        >
          가고 싶은 곳을 모아
          <br />
          링크 하나로 보내요
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.7, margin: "0 0 24px" }}>
          내가 후보를 담아 코스를 만들면,
          <br />
          상대가 직접 골라서 보내줘요.
          <br />
          <NW>사진·리뷰·지도 동선</NW>까지 한 장의 링크에 담겨요.
        </p>
        <PrimaryCta />
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 12, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <div>
            <NW>로그인 없이 바로 시작</NW> · <NW>설치 없이 링크로</NW> · <NW>무료</NW>
          </div>
          <Link href="/history" style={{ color: "var(--wine)", fontWeight: 700, textDecoration: "none" }}>
            📑 내가 만든 코스 보기 →
          </Link>
        </div>
      </section>

      {/* how it works */}
      <section style={{ marginTop: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 12, letterSpacing: ".2em", fontWeight: 700, color: "var(--wine-2)" }}>
            HOW IT WORKS
          </div>
          <h2 className="serif" style={{ fontSize: 22, color: "var(--wine)", fontWeight: 700, margin: "6px 0 0" }}>
            이렇게 만들어요
          </h2>
        </div>

        <div>
          {steps.map((s, i) => {
            const last = i === steps.length - 1;
            return (
              <div key={s.title} style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
                {/* rail: badge + connector */}
                <div style={{ flex: "none", width: 30, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Badge n={i + 1} />
                  {!last && (
                    <div style={{ flex: 1, width: 2, background: "var(--line)", marginTop: 4, borderRadius: 2 }} />
                  )}
                </div>
                {/* content card */}
                <div className="card" style={{ flex: 1, padding: "15px 17px", marginBottom: last ? 0 : 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 20, flex: "none" }}>{s.icon}</span>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>{s.title}</h3>
                  </div>
                  <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                  {s.extra && <div style={{ marginTop: 12 }}>{s.extra}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* bottom CTA */}
      <section style={{ textAlign: "center", marginTop: 40 }}>
        <p className="serif" style={{ fontSize: 18, color: "var(--wine)", fontWeight: 700, margin: "0 0 16px" }}>
          이번 데이트, 같이 골라볼까요?
        </p>
        <PrimaryCta full />
      </section>

      {/* 광고 — 콘텐츠 끝, 하단에 은은하게 */}
      <AdBanner style={{ marginTop: 40 }} />
    </div>
  );
}
