"use client";

import { useRef, useState } from "react";
import type { CourseMemory } from "@/lib/types";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 서버 제한과 동일하게 유지
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

interface MemoryLogProps {
  slug: string;
  initial: CourseMemory[];
}

type PendingFile = { file: File; url: string; kind: "image" | "video" };

function mediaUrl(slug: string, id: string): string {
  return `/api/courses/${slug}/memories/${id}`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export default function MemoryLog({ slug, initial }: MemoryLogProps) {
  const [memories, setMemories] = useState<CourseMemory[]>(initial);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<PendingFile | null>(null);
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [viewer, setViewer] = useState<CourseMemory | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const mediaItems = memories.filter((m) => m.kind !== "text");
  const noteItems = memories.filter((m) => m.kind === "text");

  function closePending() {
    if (pending) URL.revokeObjectURL(pending.url);
    setPending(null);
    setCaption("");
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setErr("");
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 재선택 허용
    if (!file) return;
    const kind = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
    if (!kind) {
      setErr("이미지 또는 영상 파일만 올릴 수 있어요.");
      return;
    }
    const limit = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (file.size > limit) {
      setErr(`${kind === "image" ? "사진" : "영상"}은 ${Math.round(limit / 1024 / 1024)}MB까지 올릴 수 있어요.`);
      return;
    }
    setPending({ file, url: URL.createObjectURL(file), kind });
  }

  async function save(file: File | null, text: string) {
    setErr("");
    setSaving(true);
    try {
      const fd = new FormData();
      if (file) fd.append("file", file);
      fd.append("text", text.trim());
      const res = await fetch(`/api/courses/${slug}/memories`, { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "기록을 저장하지 못했어요.");
      setMemories((prev) => [j.memory as CourseMemory, ...prev]);
      return true;
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "기록을 저장하지 못했어요.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveNote() {
    if (!note.trim()) return;
    if (await save(null, note)) setNote("");
  }

  async function savePending() {
    if (!pending) return;
    if (await save(pending.file, caption)) closePending();
  }

  async function remove(id: string) {
    if (!window.confirm("이 기록을 지울까요?")) return;
    try {
      const res = await fetch(`/api/courses/${slug}/memories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMemories((prev) => prev.filter((m) => m.id !== id));
      setViewer((v) => (v?.id === id ? null : v));
    } catch {
      setErr("기록을 지우지 못했어요. 다시 시도해주세요.");
    }
  }

  return (
    <section style={{ marginTop: 36 }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 2px 4px" }}>
        <span
          className="serif"
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#fff",
            background: "var(--gold)",
            width: 30,
            height: 30,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            flex: "none",
          }}
        >
          ✦
        </span>
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.02em", color: "var(--ink)" }}>
          📸 우리의 기록
        </span>
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 2px 14px 42px" }}>
        다녀온 날의 사진·영상과 한 줄을 이 코스에 남겨보세요
      </p>

      {/* add controls */}
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: 16,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <button
          className="btn btn-ghost"
          style={{ width: "100%" }}
          onClick={() => fileRef.current?.click()}
          disabled={saving}
        >
          📷 사진·영상 올리기
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={onPick}
          style={{ display: "none" }}
          aria-label="사진·영상 선택"
        />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            className="field"
            style={{ flex: 1 }}
            aria-label="한 줄 기록"
            placeholder="한 줄 기록 — 예: 오늘 여기 최고였어 🌙"
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveNote();
            }}
          />
          <button
            className="btn btn-wine"
            style={{ flex: "none", padding: "0 16px" }}
            onClick={saveNote}
            disabled={saving || !note.trim()}
          >
            {saving ? "…" : "남기기"}
          </button>
        </div>
        {err && !pending && <div style={{ color: "var(--wine-2)", fontSize: 12.5, marginTop: 8 }}>{err}</div>}
      </div>

      {/* media grid */}
      {mediaItems.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 16 }}>
          {mediaItems.map((m) => (
            <button
              key={m.id}
              onClick={() => setViewer(m)}
              aria-label={m.kind === "video" ? "영상 기록 보기" : "사진 기록 보기"}
              style={{
                position: "relative",
                aspectRatio: "1",
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid var(--line)",
                padding: 0,
                cursor: "pointer",
                background: "#efe7da",
              }}
            >
              {m.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(slug, m.id)}
                  alt={m.text || "추억 사진"}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <video
                  src={mediaUrl(slug, m.id)}
                  preload="metadata"
                  muted
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
              {m.kind === "video" && (
                <span
                  style={{
                    position: "absolute",
                    right: 7,
                    bottom: 7,
                    background: "rgba(20,8,12,.6)",
                    color: "#fff",
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 999,
                  }}
                >
                  ▶ 영상
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* text notes */}
      {noteItems.length > 0 && (
        <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
          {noteItems.map((m) => (
            <div
              key={m.id}
              style={{
                position: "relative",
                padding: "12px 40px 12px 14px",
                borderRadius: 14,
                background: "linear-gradient(180deg,#fdf3ef,#fcf8f1)",
                border: "1px solid var(--line)",
              }}
            >
              <div className="serif" style={{ color: "var(--wine)", fontSize: 14.5 }}>
                “{m.text}”
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 5 }}>{fmtDate(m.createdAt)}</div>
              <button
                onClick={() => remove(m.id)}
                aria-label="기록 지우기"
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "1px solid var(--line)",
                  background: "#fff",
                  color: "var(--ink-soft)",
                  fontSize: 15,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {memories.length === 0 && (
        <div
          style={{
            textAlign: "center",
            color: "var(--ink-soft)",
            fontSize: 13,
            padding: "18px 0 6px",
          }}
        >
          아직 남긴 기록이 없어요 — 첫 순간을 남겨보세요 🌙
        </div>
      )}

      {/* pending file sheet */}
      {pending && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) closePending();
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
            <div className="serif" style={{ fontSize: 22, fontWeight: 700, color: "var(--wine)", marginBottom: 12 }}>
              이 순간 남기기 📸
            </div>
            {pending.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pending.url}
                alt="올릴 사진 미리보기"
                style={{ width: "100%", maxHeight: "45vh", objectFit: "contain", borderRadius: 14, background: "#1c1214", display: "block" }}
              />
            ) : (
              <video
                src={pending.url}
                controls
                muted
                playsInline
                style={{ width: "100%", maxHeight: "45vh", borderRadius: 14, background: "#1c1214", display: "block" }}
              />
            )}
            <input
              className="field"
              aria-label="사진·영상 설명"
              placeholder="이 순간에 대한 한마디 (선택)"
              value={caption}
              maxLength={500}
              onChange={(e) => setCaption(e.target.value)}
              style={{ margin: "12px 0" }}
            />
            {err && <div style={{ color: "var(--wine-2)", fontSize: 13, marginBottom: 10 }}>{err}</div>}
            <div style={{ display: "flex", gap: 9 }}>
              <button className="btn btn-ghost" style={{ flex: "none", padding: "13px 18px" }} onClick={closePending} disabled={saving}>
                취소
              </button>
              <button className="btn btn-wine" style={{ flex: 1 }} onClick={savePending} disabled={saving}>
                {saving ? "저장 중…" : "기록하기 ✨"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* media viewer sheet */}
      {viewer && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewer(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            background: "rgba(35,12,18,.6)",
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
              maxHeight: "92vh",
              overflowY: "auto",
            }}
          >
            <div style={{ width: 42, height: 5, borderRadius: 999, background: "rgba(110,20,35,.18)", margin: "4px auto 14px" }} />
            {viewer.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(slug, viewer.id)}
                alt={viewer.text || "추억 사진"}
                style={{ width: "100%", maxHeight: "62vh", objectFit: "contain", borderRadius: 16, background: "#1c1214", display: "block" }}
              />
            ) : (
              <video
                src={mediaUrl(slug, viewer.id)}
                controls
                autoPlay
                playsInline
                style={{ width: "100%", maxHeight: "62vh", borderRadius: 16, background: "#1c1214", display: "block" }}
              />
            )}
            {viewer.text && (
              <div className="serif" style={{ color: "var(--wine)", fontSize: 15.5, marginTop: 14, textAlign: "center" }}>
                “{viewer.text}”
              </div>
            )}
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6, textAlign: "center" }}>
              {fmtDate(viewer.createdAt)}
            </div>
            <div style={{ display: "flex", gap: 9, marginTop: 16 }}>
              <button className="btn btn-ghost" style={{ flex: "none", padding: "13px 18px" }} onClick={() => remove(viewer.id)}>
                🗑 지우기
              </button>
              <button className="btn btn-wine" style={{ flex: 1 }} onClick={() => setViewer(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
