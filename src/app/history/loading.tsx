// /history 진입 즉시 표시되는 스켈레톤 — 서버 조회를 기다리는 동안의 무반응 구간 제거
export default function HistoryLoading() {
  return (
    <div style={{ width: "100%", maxWidth: 520, margin: "0 auto", padding: "44px 18px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: 90, height: 12, marginBottom: 10 }} />
          <div className="skeleton" style={{ width: 170, height: 26 }} />
        </div>
        <div className="skeleton" style={{ width: 92, height: 40, borderRadius: 13 }} />
      </div>

      <div className="skeleton" style={{ width: 130, height: 13, margin: "0 2px 12px" }} />
      {[0, 1, 2].map((i) => (
        <div key={i} className="card" style={{ padding: "16px 18px", marginBottom: 14 }}>
          <div className="skeleton" style={{ width: "55%", height: 18, marginBottom: 10 }} />
          <div className="skeleton" style={{ width: "35%", height: 13, marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <div className="skeleton" style={{ flex: 1, height: 38, borderRadius: 13 }} />
            <div className="skeleton" style={{ flex: 1, height: 38, borderRadius: 13 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
