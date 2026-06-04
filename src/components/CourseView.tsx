"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Course, Place, Stop, SelectedPlaces } from "@/lib/types";
import { MODE_LABEL, MODE_EMOJI } from "@/lib/types";
import { fmtDist, fmtDur, naverDirUrl } from "@/lib/format";
import type { MapLeg, MapPoint } from "./CourseMap";
import BrandLogo from "./BrandLogo";

const CourseMap = dynamic(() => import("./CourseMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 230,
        borderRadius: 16,
        background: "#f1e9dd",
        display: "grid",
        placeItems: "center",
        color: "var(--ink-soft)",
        fontSize: 13,
      }}
    >
      지도 불러오는 중…
    </div>
  ),
});

type Leg = { geometry: [number, number][]; distance: number; duration: number; estimated: boolean };

interface CourseViewProps {
  course: Course;
}

export default function CourseView({ course }: CourseViewProps) {
  const modes = course.modes.length ? course.modes : ["walk"];

  // local stops state so partner-added places appear without reload
  const [stops, setStops] = useState<Stop[]>(course.stops);

  function handleAddPlace(stopId: string, place: Place) {
    setStops((prev) =>
      prev.map((s) =>
        s.id === stopId && !s.places.some((p) => p.placeId === place.placeId)
          ? { ...s, places: [...s.places, place] }
          : s
      )
    );
  }

  // auto-select stops that have exactly one place
  const initialSel = useMemo(() => {
    const s: SelectedPlaces = {};
    stops.forEach((st) => {
      s[st.id] = st.places.length === 1 ? [st.places[0].name] : [];
    });
    return s;
  }, [stops]);

  const [selected, setSelected] = useState<SelectedPlaces>(initialSel);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(modes[0]);
  const [legs, setLegs] = useState<Leg[]>([]);
  const [routing, setRouting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [respName, setRespName] = useState("");
  const [respMsg, setRespMsg] = useState("");
  const [submitErr, setSubmitErr] = useState("");

  // 선택한 장소들을 선택 순서대로 수집
  const pickedPlaces = useMemo<Place[]>(() => {
    const out: Place[] = [];
    for (const st of stops) {
      const names = selected[st.id] || [];
      for (const name of names) {
        const p = st.places.find((pl) => pl.name === name);
        if (p) out.push(p);
      }
    }
    return out;
  }, [selected, stops]);

  const geoPoints = useMemo<MapPoint[]>(
    () =>
      pickedPlaces
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({ lat: p.lat as number, lng: p.lng as number, name: p.name, cat: p.category })),
    [pickedPlaces]
  );

  const fetchRoute = useCallback(async () => {
    if (geoPoints.length < 2) {
      setLegs([]);
      return;
    }
    setRouting(true);
    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, points: geoPoints.map((p) => ({ lat: p.lat, lng: p.lng })) }),
      });
      const j = await res.json();
      setLegs(j.legs ?? []);
    } catch {
      setLegs([]);
    } finally {
      setRouting(false);
    }
  }, [geoPoints, mode]);

  useEffect(() => {
    if (open) fetchRoute();
  }, [open, mode, fetchRoute]);

  function togglePlace(stopId: string, name: string) {
    setSelected((prev) => {
      const current = prev[stopId] || [];
      const isSelected = current.includes(name);
      return {
        ...prev,
        [stopId]: isSelected ? current.filter((n) => n !== name) : [...current, name],
      };
    });
  }

  const mapLegs: MapLeg[] = legs.map((l) => ({ geometry: l.geometry, estimated: l.estimated }));

  async function copyCourse() {
    const lines = stops.map((st, i) => {
      const names = selected[st.id] || [];
      const picked = names.length > 0 ? names.join(", ") : "미정";
      return `${i + 1}. ${st.label} · ${picked}`;
    });
    const txt = `${course.title}\n${lines.join("\n")}`;
    try {
      await navigator.clipboard.writeText(txt);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function submitResponse() {
    setSubmitErr("");
    const picks: Record<string, string[]> = {};
    for (const st of stops) {
      const names = selected[st.id];
      if (names && names.length > 0) {
        picks[st.id] = names;
      }
    }
    if (Object.keys(picks).length === 0) {
      setSubmitErr("장소를 먼저 골라줘.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${course.slug}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: respName, message: respMsg, picks }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "전송에 실패했어요.");
      setSubmitted(true);
      setSubmitOpen(false);
    } catch (e: unknown) {
      setSubmitErr(e instanceof Error ? e.message : "전송에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  const courseDone = stops.every((st) => (selected[st.id] || []).length > 0);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 18px 110px" }}>
      {/* hero */}
      <header style={{ textAlign: "center", padding: "48px 6px 22px" }}>
        <BrandLogo height={40} />
        <h1
          className="serif"
          style={{ fontSize: 34, lineHeight: 1.22, margin: "12px 0 8px", color: "var(--wine)", fontWeight: 700 }}
        >
          {course.title}
        </h1>
        {course.intro && (
          <p style={{ color: "var(--ink-soft)", fontSize: 15, margin: "0 auto", maxWidth: 360 }}>
            {course.intro}
          </p>
        )}
        <div
          style={{
            display: "flex",
            gap: 6,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 18,
            alignItems: "center",
          }}
        >
          {stops.map((st, i) => (
            <span key={st.id} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {i > 0 && <i style={{ color: "var(--gold)", fontStyle: "normal", fontWeight: 700 }}>→</i>}
              <span className="chip">
                {st.emoji} {st.label}
              </span>
            </span>
          ))}
        </div>
      </header>

      {/* stops */}
      {stops.map((st, idx) => (
        <StopSection
          key={st.id}
          stop={st}
          no={idx + 1}
          slug={course.slug}
          selectedNames={selected[st.id] || []}
          onToggle={(name) => togglePlace(st.id, name)}
          onPlaceAdded={(place) => handleAddPlace(st.id, place)}
        />
      ))}

      {/* summary bar */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          background: "rgba(252,248,241,.93)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--line)",
          padding: "11px 16px calc(11px + env(safe-area-inset-bottom))",
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, letterSpacing: ".1em", color: "var(--ink-soft)", fontWeight: 700 }}>
              오늘의 코스
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--wine)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {stops.map((st, i) => {
                const names = selected[st.id] || [];
                const picked = names.length > 0 ? names.join(", ") : "미정";
                return (
                  <span key={st.id}>
                    {i > 0 && <span style={{ color: "var(--ink-soft)", fontWeight: 500 }}> → </span>}
                    <span>
                      {st.emoji} {picked}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
          <div style={{ flex: "none", display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" style={{ padding: "11px 13px", fontSize: 14 }} onClick={() => setOpen(true)}>
              🗺️ 동선
            </button>
            <button
              className="btn btn-wine"
              style={{ padding: "11px 14px", fontSize: 14 }}
              onClick={() => setSubmitOpen(true)}
              disabled={submitted}
            >
              {submitted ? "보냈어요 ✓" : "선택 보내기"}
            </button>
          </div>
        </div>
      </div>

      {/* submit sheet */}
      {submitOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSubmitOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            background: "rgba(35,12,18,.5)",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            className="hide-scroll"
            style={{
              width: "100%",
              maxWidth: 560,
              background: "var(--paper)",
              borderRadius: "26px 26px 0 0",
              padding: "10px 20px calc(22px + env(safe-area-inset-bottom))",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ width: 42, height: 5, borderRadius: 999, background: "rgba(110,20,35,.18)", margin: "4px auto 14px" }} />
            <div className="serif" style={{ fontSize: 22, fontWeight: 700, color: "var(--wine)", marginBottom: 4 }}>
              내 선택 보내기 💌
            </div>
            <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 14px" }}>
              고른 코스를 상대에게 알려줄게요.
            </p>

            <div
              style={{
                background: "#fff",
                border: "1px solid var(--line)",
                borderRadius: 14,
                padding: "12px 14px",
                marginBottom: 14,
                display: "grid",
                gap: 8,
              }}
            >
              {stops.map((st) => {
                const names = selected[st.id] || [];
                const picked = names.length > 0 ? names.join(", ") : "미정";
                return (
                  <div key={st.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "var(--ink-soft)" }}>
                      {st.emoji} {st.label}
                    </span>
                    <span style={{ fontWeight: 700, color: names.length > 0 ? "var(--wine)" : "var(--ink-soft)" }}>
                      {picked}
                    </span>
                  </div>
                );
              })}
            </div>

            <input className="field" aria-label="이름" placeholder="이름 (선택)" value={respName} onChange={(e) => setRespName(e.target.value)} style={{ marginBottom: 10 }} />
            <textarea
              className="field"
              aria-label="한마디"
              placeholder="한마디 남기기 (선택) — 예: 여기 너무 좋다! 토요일 어때?"
              value={respMsg}
              onChange={(e) => setRespMsg(e.target.value)}
              rows={2}
              style={{ marginBottom: 12, resize: "none" }}
            />
            {submitErr && <div style={{ color: "var(--wine-2)", fontSize: 13, marginBottom: 10 }}>{submitErr}</div>}
            <div style={{ display: "flex", gap: 9 }}>
              <button className="btn btn-ghost" style={{ flex: "none", padding: "13px 18px" }} onClick={() => setSubmitOpen(false)}>
                취소
              </button>
              <button className="btn btn-wine" style={{ flex: 1 }} onClick={submitResponse} disabled={submitting}>
                {submitting ? "보내는 중…" : "보내기 →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* modal */}
      {open && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            background: "rgba(35,12,18,.5)",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            className="hide-scroll"
            style={{
              width: "100%",
              maxWidth: 560,
              background: "var(--paper)",
              borderRadius: "26px 26px 0 0",
              padding: "10px 20px calc(22px + env(safe-area-inset-bottom))",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ width: 42, height: 5, borderRadius: 999, background: "rgba(110,20,35,.18)", margin: "4px auto 12px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div className="serif" style={{ fontSize: 22, fontWeight: 700, color: "var(--wine)" }}>
                {courseDone ? "코스 완성 ✨" : "지금까지의 동선"}
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="닫기"
                style={{ background: "#fff", border: "1px solid var(--line)", width: 44, height: 44, borderRadius: "50%", fontSize: 20, color: "var(--ink-soft)", cursor: "pointer", flex: "none" }}
              >
                ×
              </button>
            </div>

            {/* transport toggle */}
            {modes.length > 1 && (
              <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
                {modes.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      flex: 1,
                      borderRadius: 11,
                      padding: "9px 0",
                      fontSize: 13.5,
                      fontWeight: 700,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      border: mode === m ? "1.6px solid var(--wine)" : "1px solid var(--line)",
                      background: mode === m ? "var(--wine)" : "#fff",
                      color: mode === m ? "#fff" : "var(--ink-soft)",
                    }}
                  >
                    {mode === m ? "✓ " : ""}
                    {MODE_EMOJI[m]} {MODE_LABEL[m]}
                  </button>
                ))}
              </div>
            )}

            {/* map */}
            <CourseMap legs={mapLegs} points={geoPoints} />

            {/* route info */}
            {geoPoints.length < 2 ? (
              <div style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: 13, margin: "14px 0" }}>
                장소를 2개 이상 선택하면 동선이 표시돼요
              </div>
            ) : (
              <>
                {legs.length > 0 && (
                  <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                    {legs.map((leg, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--ink-soft)" }}>
                        <span>
                          {geoPoints[i]?.name} → {geoPoints[i + 1]?.name}
                        </span>
                        <span style={{ fontWeight: 700, color: "var(--wine)" }}>
                          {fmtDist(leg.distance)} · {fmtDur(leg.duration)}
                          {leg.estimated && " (예상)"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {geoPoints.length >= 2 && (
                  <div style={{ marginTop: 12 }}>
                    <a
                      href={naverDirUrl(geoPoints[0], geoPoints[geoPoints.length - 1], mode)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost"
                      style={{ width: "100%", textAlign: "center", textDecoration: "none" }}
                    >
                      네이버 지도에서 보기 →
                    </a>
                  </div>
                )}
              </>
            )}

            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={copyCourse}>
                {copied ? "복사됨 ✓" : "📋 복사"}
              </button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setOpen(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StopSection({
  stop,
  no,
  slug,
  selectedNames,
  onToggle,
  onPlaceAdded,
}: {
  stop: Stop;
  no: number;
  slug: string;
  selectedNames: string[];
  onToggle: (name: string) => void;
  onPlaceAdded: (place: Place) => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [armed, setArmed] = useState(false);

  async function add() {
    setErr("");
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "불러오기 실패");
      onPlaceAdded(j.place as Place);
      setUrl("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "불러오기에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card" style={{ padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontWeight: 800, color: "var(--wine)", fontSize: 16, flex: "none" }}>{no}</span>
        <h2 style={{ fontWeight: 800, fontSize: 18, color: "var(--wine)", margin: 0, flex: 1 }}>
          {stop.emoji} {stop.label}
        </h2>
      </div>

      {/* places list with multi-select */}
      {stop.places.length > 0 && (
        <div style={{ marginBottom: 12, display: "grid", gap: 8 }}>
          {stop.places.map((p) => {
            const isSelected = selectedNames.includes(p.name);
            return (
              <button
                key={p.placeId}
                onClick={() => onToggle(p.name)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: isSelected ? "2px solid var(--wine)" : "1px solid var(--line)",
                  background: isSelected ? "rgba(206,20,35,.08)" : "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.name} style={{ width: 46, height: 46, borderRadius: 10, objectFit: "cover", flex: "none" }} />
                ) : (
                  <div style={{ width: 46, height: 46, borderRadius: 10, background: "#efe7da", display: "grid", placeItems: "center", flex: "none", fontSize: 20 }}>
                    {p.emoji}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--ink)" }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {p.emoji} {p.category}
                  </div>
                </div>
                {isSelected && (
                  <div style={{ flex: "none", width: 24, height: 24, borderRadius: "50%", background: "var(--wine)", color: "#fff", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 700 }}>
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* add place input */}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          className="field"
          style={{ flex: 1 }}
          aria-label="네이버 지도 공유 링크"
          placeholder="네이버 지도 공유 링크 (naver.me/...)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
        />
        <button className="btn btn-wine" style={{ flex: "none", padding: "0 16px" }} onClick={add} disabled={loading}>
          {loading ? "…" : "추가"}
        </button>
      </div>
      {err && <div style={{ color: "var(--wine-2)", fontSize: 12.5, marginTop: 6 }}>{err}</div>}
    </section>
  );
}
