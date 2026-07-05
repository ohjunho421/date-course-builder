// /c/[slug] 진입 즉시 표시되는 스켈레톤 — 코스 조회를 기다리는 동안의 무반응 구간 제거
export default function CourseLoading() {
  return (
    <div style={{ width: "100%", maxWidth: 560, margin: "0 auto", padding: "0 18px 110px" }}>
      <header style={{ textAlign: "center", padding: "34px 6px 22px" }}>
        <div className="skeleton" style={{ width: "70%", height: 30, margin: "0 auto 12px" }} />
        <div className="skeleton" style={{ width: "50%", height: 15, margin: "0 auto 20px" }} />
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ width: 74, height: 30, borderRadius: 999 }} />
          ))}
        </div>
      </header>

      {[0, 1].map((i) => (
        <div key={i} className="card" style={{ marginBottom: 16 }}>
          <div className="skeleton" style={{ aspectRatio: "5 / 3.4", borderRadius: 0 }} />
          <div style={{ padding: "18px 18px 16px" }}>
            <div className="skeleton" style={{ width: "45%", height: 20, marginBottom: 10 }} />
            <div className="skeleton" style={{ width: "30%", height: 13, marginBottom: 14 }} />
            <div className="skeleton" style={{ width: "100%", height: 44, borderRadius: 14 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
