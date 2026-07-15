"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import type { Place, Stop } from "@/lib/types";
import { MODE_LABEL, MODE_EMOJI } from "@/lib/types";
import { addMyCourse } from "@/lib/my-courses";

const ALL_MODES = ["walk", "car"];

function guessEmoji(label: string): string {
  const l = label;
  if (/카페|커피/.test(l)) return "☕";
  if (/디저트|케이크|빵|베이커리/.test(l)) return "🍰";
  if (/브런치/.test(l)) return "🥞";
  if (/점심|런치/.test(l)) return "🍱";
  if (/저녁|디너|밥|식사|저녘/.test(l)) return "🍽️";
  if (/술|한잔|바|칵테일|와인|맥주|포차|이자카야/.test(l)) return "🍸";
  if (/산책|공원|강|한강/.test(l)) return "🌳";
  if (/영화/.test(l)) return "🎬";
  if (/전시|미술|갤러리|박물관/.test(l)) return "🖼️";
  return "📍";
}

const PRESETS: { name: string; labels: string[] }[] = [
  { name: "카페 → 저녁 → 한 잔", labels: ["카페", "저녁", "한 잔"] },
  { name: "저녁 → 한 잔", labels: ["저녁", "한 잔"] },
  { name: "카페 → 저녁", labels: ["카페", "저녁"] },
  { name: "점심 → 카페 → 저녁 → 한 잔", labels: ["점심", "카페", "저녁", "한 잔"] },
];

function makeStop(label: string): Stop {
  return { id: nanoid(6), label, emoji: guessEmoji(label), places: [] };
}

export default function Builder({ loggedIn = false }: { loggedIn?: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [intro, setIntro] = useState("");
  const [modes, setModes] = useState<string[]>([...ALL_MODES]);
  const [stops, setStops] = useState<Stop[]>([makeStop("카페"), makeStop("저녁"), makeStop("한 잔")]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function applyPreset(labels: string[]) {
    setStops(labels.map(makeStop));
  }
  function addStop() {
    setStops((s) => [...s, makeStop("")]);
  }
  function removeStop(id: string) {
    setStops((s) => s.filter((x) => x.id !== id));
  }
  function moveStop(id: string, dir: -1 | 1) {
    setStops((s) => {
      const i = s.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.length) return s;
      const copy = [...s];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }
  function setStopLabel(id: string, label: string) {
    setStops((s) => s.map((x) => (x.id === id ? { ...x, label, emoji: guessEmoji(label) } : x)));
  }
  function setStopEmoji(id: string, emoji: string) {
    setStops((s) => s.map((x) => (x.id === id ? { ...x, emoji } : x)));
  }
  function addPlace(id: string, place: Place) {
    setStops((s) =>
      s.map((x) =>
        x.id === id
          ? x.places.some((p) => p.placeId === place.placeId)
            ? x
            : { ...x, places: [...x.places, place] }
          : x
      )
    );
  }
  function removePlace(id: string, placeId: string) {
    setStops((s) => s.map((x) => (x.id === id ? { ...x, places: x.places.filter((p) => p.placeId !== placeId) } : x)));
  }
  function toggleMode(m: string) {
    setModes((cur) => {
      if (cur.includes(m)) {
        // keep at least one mode selected
        return cur.length > 1 ? cur.filter((x) => x !== m) : cur;
      }
      return [...cur, m];
    });
  }

  async function submit() {
    setError("");
    if (!title.trim()) return setError("코스 제목을 입력해 주세요.");
    if (!stops.some((s) => s.places.length > 0))
      return setError("최소 한 단계에 장소를 한 곳 이상 추가해 주세요.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          intro: intro.trim(),
          modes: modes.length ? modes : ["walk"],
          stops: stops.filter((s) => s.label.trim() && s.places.length > 0),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "저장 실패");
      // 비로그인 사용자가 만든 코스를 이 기기의 '내 코스'에서 다시 찾을 수 있게 보관한다.
      if (!loggedIn) {
        addMyCourse({
          slug: j.slug,
          ownerToken: j.ownerToken,
          title: title.trim(),
          createdAt: new Date().toISOString(),
        });
      }
      router.push(`/c/${j.slug}?owner=${j.ownerToken}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
      setSubmitting(false);
    }
  }

  // drag-and-drop reordering of stops
  const dragId = useRef<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  function onDragStart(id: string) {
    dragId.current = id;
    setDragging(id);
  }
  function onDragEnter(id: string) {
    const from = dragId.current;
    if (!from || from === id) return;
    setStops((s) => {
      const fi = s.findIndex((x) => x.id === from);
      const ti = s.findIndex((x) => x.id === id);
      if (fi < 0 || ti < 0) return s;
      const copy = [...s];
      const [moved] = copy.splice(fi, 1);
      copy.splice(ti, 0, moved);
      return copy;
    });
  }
  function onDragEnd() {
    dragId.current = null;
    setDragging(null);
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 18px 60px" }}>
      <header style={{ textAlign: "center", padding: "32px 6px 14px" }}>
        <h1 className="serif" style={{ fontSize: 26, margin: "0 0 8px", color: "var(--wine)", fontWeight: 700, lineHeight: 1.2 }}>
          데이트 코스 만들기
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 15, maxWidth: 380, margin: "0 auto" }}>
          네이버 지도 공유 링크만 넣으면, 사진·리뷰·지도 동선까지 담긴 코스 페이지가 완성돼요. 링크 하나로 공유하세요.
        </p>
      </header>

      <Section title="① 코스 정보">
        <label style={lbl}>제목</label>
        <input className="field" placeholder="예: 을지로 첫 데이트 코스" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label style={{ ...lbl, marginTop: 12 }}>한 줄 소개 (선택)</label>
        <input className="field" placeholder="예: 마음에 드는 곳 골라줘 :)" value={intro} onChange={(e) => setIntro(e.target.value)} />
      </Section>

      <Section title="② 코스 구조">
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>빠른 시작 — 자주 쓰는 구성을 골라서 시작해요</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {PRESETS.map((p) => (
            <button key={p.name} className="chip" style={{ cursor: "pointer" }} onClick={() => applyPreset(p.labels)}>
              {p.name}
            </button>
          ))}
        </div>
      </Section>

      <Section title="③ 단계별 장소">
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 10 }}>
          ⠿ 손잡이를 잡고 끌어서 순서를 바꿀 수 있어요
        </div>
        {stops.map((stop, i) => (
          <StopEditor
            key={stop.id}
            stop={stop}
            index={i}
            total={stops.length}
            isDragging={dragging === stop.id}
            onLabel={(v) => setStopLabel(stop.id, v)}
            onEmoji={(v) => setStopEmoji(stop.id, v)}
            onRemove={() => removeStop(stop.id)}
            onMove={(d) => moveStop(stop.id, d)}
            onAddPlace={(pl) => addPlace(stop.id, pl)}
            onRemovePlace={(pid) => removePlace(stop.id, pid)}
            onDragStart={() => onDragStart(stop.id)}
            onDragEnter={() => onDragEnter(stop.id)}
            onDragEnd={onDragEnd}
          />
        ))}
        <button className="btn btn-ghost" style={{ width: "100%", marginTop: 4 }} onClick={addStop}>
          + 단계 추가
        </button>
      </Section>

      <Section title="④ 이동수단 옵션">
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>
          코스 페이지에서 보여줄 이동수단을 골라요 · <span style={{ color: "var(--wine-2)", fontWeight: 700 }}>탭해서 켜고 끄기</span> (최소 1개)
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {ALL_MODES.map((m) => {
            const on = modes.includes(m);
            return (
              <button
                key={m}
                onClick={() => toggleMode(m)}
                aria-pressed={on}
                style={{
                  flex: 1,
                  borderRadius: 11,
                  padding: "11px 0",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  border: on ? "1.6px solid var(--wine)" : "1px solid var(--line)",
                  background: on ? "var(--wine)" : "#fff",
                  color: on ? "#fff" : "var(--ink-soft)",
                }}
              >
                {on ? "✓ " : ""}
                {MODE_EMOJI[m]} {MODE_LABEL[m]}
              </button>
            );
          })}
        </div>
      </Section>

      {error && (
        <div style={{ color: "var(--wine-2)", fontSize: 14, fontWeight: 600, textAlign: "center", margin: "8px 0" }}>{error}</div>
      )}
      <button className="btn btn-wine" style={{ width: "100%", padding: 16, fontSize: 16, marginTop: 8 }} onClick={submit} disabled={submitting}>
        {submitting ? "만드는 중…" : "코스 만들기 →"}
      </button>
    </div>
  );
}

const lbl: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 22 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--wine)", marginBottom: 12 }}>{title}</h2>
      {children}
    </section>
  );
}

function StopEditor({
  stop,
  index,
  total,
  isDragging,
  onLabel,
  onEmoji,
  onRemove,
  onMove,
  onAddPlace,
  onRemovePlace,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: {
  stop: Stop;
  index: number;
  total: number;
  isDragging: boolean;
  onLabel: (v: string) => void;
  onEmoji: (v: string) => void;
  onRemove: () => void;
  onMove: (d: -1 | 1) => void;
  onAddPlace: (p: Place) => void;
  onRemovePlace: (placeId: string) => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
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
      onAddPlace(j.place as Place);
      setUrl("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "불러오기에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="card"
      draggable={armed}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={() => {
        setArmed(false);
        onDragEnd();
      }}
      style={{ padding: 16, marginBottom: 14, opacity: isDragging ? 0.45 : 1 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span
          onMouseDown={() => setArmed(true)}
          onMouseUp={() => setArmed(false)}
          onTouchStart={() => setArmed(true)}
          onTouchEnd={() => setArmed(false)}
          title="끌어서 순서 변경"
          aria-label="드래그 핸들"
          style={{
            cursor: "grab",
            flex: "none",
            color: "var(--ink-soft)",
            fontSize: 16,
            minWidth: 28,
            minHeight: 44,
            display: "grid",
            placeItems: "center",
            userSelect: "none",
            touchAction: "none",
          }}
        >
          ⠿
        </span>
        <span style={{ fontWeight: 800, color: "var(--wine)", fontSize: 14, flex: "none" }}>{index + 1}</span>
        <input
          value={stop.emoji}
          onChange={(e) => onEmoji(e.target.value)}
          aria-label="이모지"
          style={{ width: 44, textAlign: "center", fontSize: 18, border: "1px solid var(--line)", borderRadius: 10, padding: "8px 0", background: "#fff" }}
        />
        <input className="field" style={{ flex: 1 }} aria-label="단계 이름" placeholder="단계 이름 (예: 카페)" value={stop.label} onChange={(e) => onLabel(e.target.value)} />
        <div style={{ display: "flex", gap: 4, flex: "none" }}>
          <IconBtn disabled={index === 0} onClick={() => onMove(-1)}>↑</IconBtn>
          <IconBtn disabled={index === total - 1} onClick={() => onMove(1)}>↓</IconBtn>
          <IconBtn onClick={onRemove}>✕</IconBtn>
        </div>
      </div>

      {/* places */}
      {stop.places.map((p) => (
        <div key={p.placeId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--line)" }}>
          {p.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.images[0]} alt={p.name} style={{ width: 46, height: 46, borderRadius: 10, objectFit: "cover", flex: "none" }} />
          ) : (
            <div style={{ width: 46, height: 46, borderRadius: 10, background: "#efe7da", display: "grid", placeItems: "center", flex: "none" }}>{p.emoji}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              {p.emoji} {p.category}
              {p.lat == null ? " · ⚠️ 좌표 없음" : ""}
            </div>
          </div>
          <button
            onClick={() => onRemovePlace(p.placeId)}
            aria-label={`${p.name} 삭제`}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-soft)",
              cursor: "pointer",
              fontSize: 16,
              flex: "none",
              width: 40,
              height: 40,
              display: "grid",
              placeItems: "center",
            }}
          >
            ✕
          </button>
        </div>
      ))}

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
    </div>
  );
}

function IconBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        border: "1px solid var(--line)",
        background: "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        color: "var(--ink-soft)",
        fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}
