"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Course, Place, Stop } from "@/lib/types";
import { MODE_LABEL, MODE_EMOJI } from "@/lib/types";
import { fmtDist, fmtDur, naverDirUrl } from "@/lib/format";
import type { MapLeg, MapPoint } from "./CourseMap";

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

  // auto-select stops that have exactly one place
  const initialSel = useMemo(() => {
    const s: Record<string, string | null> = {};
    course.stops.forEach((st) => {
      s[st.id] = st.places.length === 1 ? st.places[0].name : null;
    });
    return s;
  }, [course.stops]);

  const [selected, setSelected] = useState<Record<string, string | null>>(initialSel);
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

  const stopById = useCallback(
    (id: string) => course.stops.find((s) => s.id === id),
    [course.stops]
  );

  const pickedPlaces = useMemo<Place[]>(() => {
    const out: Place[] = [];
    for (const st of course.stops) {
      const name = selected[st.id];
      const p = name ? st.places.find((pl) => pl.name === name) : null;
      if (p) out.push(p);
    }
    return out;
  }, [selected, course.stops]);

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

  function pick(stopId: string, name: string) {
    setSelected((prev) => ({ ...prev, [stopId]: prev[stopId] === name ? null : name }));
  }

  const mapLegs: MapLeg[] = legs.map((l) => ({ geometry: l.geometry, estimated: l.estimated }));

  async function copyCourse() {
    const lines = course.stops.map((st, i) => {
      const n = selected[st.id] || "미정";
      return `${i + 1}. ${st.label} · ${n}`;
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
    const picks: Record<string, string> = {};
    for (const st of course.stops) {
      const n = selected[st.id];
      if (n) picks[st.id] = n;
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

  const courseDone = course.stops.every((st) => selected[st.id]);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 18px 110px" }}>
      {/* hero */}
      <header style={{ textAlign: "center", padding: "48px 6px 22px" }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: ".3em",
            fontWeight: 700,
            color: "var(--wine-2)",
          }}
        >
          DATE COURSE
        </div>
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
          {course.stops.map((st, i) => (
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
      {course.stops.map((st, idx) => (
        <StopSection
          key={st.id}
          stop={st}
          no={idx + 1}
          selectedName={selected[st.id]}
          onPick={(name) => pick(st.id, name)}
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
              {course.stops.map((st, i) => {
                const n = selected[st.id];
                return (
                  <span key={st.id}>
                    {i > 0 && <span style={{ color: "var(--ink-soft)", fontWeight: 500 }}> → </span>}
                    {n ? (
                      <span>
                        {st.emoji} {n}
                      </span>
                    ) : (
                      <span style={{ color: "var(--ink-soft)", fontWeight: 500 }}>
                        {st.emoji} {st.label}?
                      </span>
                    )}
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
              {course.stops.map((st) => (
                <div key={st.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: "var(--ink-soft)" }}>
                    {st.emoji} {st.label}
                  </span>
                  <span style={{ fontWeight: 700, color: selected[st.id] ? "var(--wine)" : "var(--ink-soft)" }}>
                    {selected[st.id] || "미정"}
                  </span>
                </div>
              ))}
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
                    {MODE_EMOJI[m]} {MODE_LABEL[m]}
                  </button>
                ))}
              </div>
            )}

            {/* map */}
            {geoPoints.length > 0 ? (
              <div style={{ marginBottom: 18 }}>
                <CourseMap points={geoPoints} legs={mapLegs} />
              </div>
            ) : (
              <div
                style={{
                  height: 110,
                  borderRadius: 16,
                  border: "1px dashed var(--line)",
                  background: "#faf3ec",
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                  color: "var(--ink-soft)",
                  fontSize: 13,
                  marginBottom: 18,
                  padding: "0 20px",
                }}
              >
                장소를 고르면 여기에 지도와 동선이 표시돼요 🗺️
              </div>
            )}

            {/* timeline */}
            <Timeline course={course} selected={selected} legs={legs} mode={mode} routing={routing} />

            <div style={{ display: "flex", gap: 9, marginTop: 6 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={copyCourse}>
                {copied ? "복사됐어 ✓" : "코스 복사"}
              </button>
              <button className="btn btn-wine" style={{ flex: 1 }} onClick={() => setOpen(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- stop section ---------- */
function StopSection({
  stop,
  no,
  selectedName,
  onPick,
}: {
  stop: Stop;
  no: number;
  selectedName: string | null;
  onPick: (name: string) => void;
}) {
  const pickable = stop.places.length > 1;
  return (
    <section style={{ padding: "10px 0 4px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "22px 2px 4px" }}>
        <span
          className="serif"
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#fff",
            background: "var(--wine)",
            width: 30,
            height: 30,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            flex: "none",
          }}
        >
          {no}
        </span>
        <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.02em" }}>
          {stop.emoji} {stop.label}
        </span>
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 2px 16px 42px" }}>
        {pickable ? (
          <>
            {stop.places.length}곳 중에 골라줘 <span style={{ color: "var(--wine-2)", fontWeight: 700 }}>— 골라줘!</span>
          </>
        ) : (
          "✓ 이 코스에 포함된 곳"
        )}
      </div>
      {stop.places.map((p) => (
        <PlaceCard key={p.name + p.placeId} place={p} selected={selectedName === p.name} canPick={pickable} onPick={() => onPick(p.name)} />
      ))}
    </section>
  );
}

/* ---------- place card ---------- */
function PlaceCard({
  place,
  selected,
  canPick,
  onPick,
}: {
  place: Place;
  selected: boolean;
  canPick: boolean;
  onPick: () => void;
}) {
  return (
    <article className={`card${selected ? " selected" : ""}`} style={{ marginBottom: 20, position: "relative" }}>
      {selected && (
        <span
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            zIndex: 3,
            background: "var(--wine-2)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            padding: "6px 12px",
            borderRadius: 999,
          }}
        >
          ✓ 선택됨
        </span>
      )}
      {place.images.length > 0 && (
        <div style={{ position: "relative" }}>
          <div
            className="hide-scroll"
            style={{
              display: "flex",
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              aspectRatio: "5 / 3.4",
              background: "#efe7da",
            }}
          >
            {place.images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={place.name}
                loading="lazy"
                style={{ width: "100%", height: "100%", flex: "0 0 100%", objectFit: "cover", scrollSnapAlign: "center" }}
              />
            ))}
          </div>
          {place.images.length > 1 && (
            <span
              style={{
                position: "absolute",
                bottom: 12,
                left: 12,
                background: "rgba(20,8,12,.55)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 999,
              }}
            >
              ← 사진 {place.images.length}장
            </span>
          )}
        </div>
      )}
      <div style={{ padding: "18px 18px 16px" }}>
        <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.02em" }}>{place.name}</div>
        <div style={{ fontSize: 13, color: "var(--gold-deep)", fontWeight: 700, marginTop: 2 }}>
          {place.emoji} {place.category}
        </div>
        {(place.visitor || place.blog) && (
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 8, display: "flex", gap: 12 }}>
            {place.visitor && (
              <span>
                ⭐ 방문자 <b style={{ color: "var(--wine)" }}>{place.visitor}</b>
              </span>
            )}
            {place.blog && (
              <span>
                ✍️ 블로그 <b style={{ color: "var(--wine)" }}>{place.blog}</b>
              </span>
            )}
          </div>
        )}
        {place.micro && (
          <div
            className="serif"
            style={{
              margin: "14px 0",
              padding: "12px 14px",
              borderRadius: 14,
              background: "linear-gradient(180deg,#fdf3ef,#fcf8f1)",
              border: "1px solid var(--line)",
              color: "var(--wine)",
              fontSize: 14.5,
            }}
          >
            “{place.micro}”
          </div>
        )}
        {place.keywords.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "12px 0 14px" }}>
            {place.keywords.map((k) => (
              <span key={k} className="tag">
                #{k}
              </span>
            ))}
          </div>
        )}
        {place.menu.length > 0 && (
          <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 13, marginBottom: 4 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 12, letterSpacing: ".06em", color: "var(--ink-soft)", fontWeight: 700 }}>
              메뉴 하이라이트
            </h4>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
              {place.menu.map((m) => (
                <li key={m} style={{ fontSize: 13.5, position: "relative", paddingLeft: 13 }}>
                  <span style={{ position: "absolute", left: 0, top: 9, width: 5, height: 5, borderRadius: "50%", background: "var(--gold)" }} />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "14px 0 16px", display: "grid", gap: 5 }}>
          {place.hours && <div>🕒 {place.hours}</div>}
          {place.address && <div>📍 {place.address}</div>}
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <a className="btn btn-naver" style={{ flex: 1 }} href={place.placeUrl} target="_blank" rel="noopener noreferrer">
            N 네이버에서 보기
          </a>
          {canPick && (
            <button
              className={`btn ${selected ? "btn-wine" : "btn-ghost"}`}
              style={{ flex: 1 }}
              onClick={onPick}
            >
              {selected ? "✓ 선택함" : "이 곳 고르기"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/* ---------- timeline ---------- */
function Timeline({
  course,
  selected,
  legs,
  mode,
  routing,
}: {
  course: Course;
  selected: Record<string, string | null>;
  legs: Leg[];
  mode: string;
  routing: boolean;
}) {
  // build ordered node list
  const nodes = course.stops.map((st) => {
    const name = selected[st.id];
    const place = name ? st.places.find((p) => p.name === name) ?? null : null;
    return { st, place };
  });

  // legs correspond to consecutive picked places with coords
  const geoNodes = nodes.filter((n) => n.place && n.place.lat != null && n.place.lng != null);
  let legCursor = 0;

  return (
    <div style={{ paddingLeft: 6, marginBottom: 4 }}>
      {nodes.map((n, i) => {
        const isGeo = !!(n.place && n.place.lat != null && n.place.lng != null);
        // find the leg AFTER this node (between this geo node and next geo node)
        let legEl: React.ReactNode = null;
        if (i < nodes.length - 1) {
          const next = nodes[i + 1];
          const bothGeo = isGeo && !!(next.place && next.place.lat != null && next.place.lng != null);
          if (bothGeo) {
            const leg = legs[legCursor];
            legCursor++;
            const dirUrl = naverDirUrl(
              { name: n.place!.name, lat: n.place!.lat, lng: n.place!.lng },
              { name: next.place!.name, lat: next.place!.lat, lng: next.place!.lng },
              mode
            );
            legEl = (
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "-10px 0 14px 40px", fontSize: 11.5, color: "var(--ink-soft)" }}>
                <span>
                  {MODE_EMOJI[mode]}{" "}
                  {routing
                    ? "경로 계산 중…"
                    : leg
                    ? `${MODE_LABEL[mode]} 약 ${fmtDur(leg.duration)} · ${leg.estimated ? "약 " : ""}${fmtDist(leg.distance)}`
                    : "이동"}
                </span>
                <a
                  href={dirUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontWeight: 700,
                    color: "var(--wine)",
                    textDecoration: "none",
                    background: "#fbeae6",
                    border: "1px solid #f3d3cb",
                    borderRadius: 8,
                    padding: "4px 9px",
                  }}
                >
                  🧭 네이버로 길찾기
                </a>
              </div>
            );
          } else {
            legEl = <div style={{ margin: "-10px 0 14px 40px", fontSize: 11.5, color: "var(--ink-soft)" }}>{MODE_EMOJI[mode]} 이동</div>;
          }
        }

        return (
          <div key={n.st.id}>
            <div style={{ position: "relative", padding: "0 0 4px 40px" }}>
              <span
                className="serif"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "var(--wine)",
                  color: "#fff",
                  fontWeight: 700,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 14,
                }}
              >
                {i + 1}
              </span>
              <div
                className="card"
                style={{
                  padding: "13px 15px",
                  marginBottom: 14,
                  ...(n.place ? {} : { background: "#faf3ec", borderStyle: "dashed" }),
                }}
              >
                <div style={{ fontSize: 11, letterSpacing: ".12em", fontWeight: 700, color: "var(--gold-deep)" }}>
                  {n.st.emoji} {n.st.label}
                </div>
                {n.place ? (
                  <>
                    <div style={{ fontSize: 17, fontWeight: 800, margin: "2px 0" }}>{n.place.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                      {n.place.category}
                      {n.place.hours ? ` · ${n.place.hours}` : ""}
                    </div>
                    <a
                      href={n.place.placeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        marginTop: 9,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "#03c75a",
                        textDecoration: "none",
                        background: "#eafaf0",
                        border: "1px solid #c8eed7",
                        borderRadius: 9,
                        padding: "6px 11px",
                      }}
                    >
                      N 네이버 지도
                    </a>
                  </>
                ) : (
                  <div style={{ fontSize: 14, color: "var(--ink-soft)", fontWeight: 600, marginTop: 2 }}>아직 안 골랐어요</div>
                )}
              </div>
            </div>
            {legEl}
          </div>
        );
      })}
      {/* avoid unused warning for geoNodes */}
      <span style={{ display: "none" }}>{geoNodes.length}</span>
    </div>
  );
}
