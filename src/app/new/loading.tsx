// /new 진입 즉시 표시되는 스켈레톤
export default function NewCourseLoading() {
  return (
    <div style={{ width: "100%", maxWidth: 560, margin: "0 auto", padding: "44px 18px 60px" }}>
      <div className="skeleton" style={{ width: "60%", height: 28, margin: "0 auto 14px" }} />
      <div className="skeleton" style={{ width: "80%", height: 15, margin: "0 auto 26px" }} />
      <div className="skeleton" style={{ width: "100%", height: 140, borderRadius: 18, marginBottom: 14 }} />
      <div className="skeleton" style={{ width: "100%", height: 140, borderRadius: 18 }} />
    </div>
  );
}
