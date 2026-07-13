"use client";

import { useSyncExternalStore } from "react";

// 로그인 없이 만든 코스를 이 기기에 보관한다.
// 로그인 사용자는 서버가 기록하므로, 이 목록은 비로그인 '내 코스' 조회에만 쓴다.
const KEY = "dgg_my_courses";
const MAX = 100;

export type LocalCourse = {
  slug: string;
  ownerToken: string;
  title: string;
  createdAt: string;
};

const listeners = new Set<() => void>();
let cacheRaw: string | null = null;
let cache: LocalCourse[] = [];

// localStorage 원문이 바뀔 때만 새 배열을 만든다 → useSyncExternalStore가 안정된
// 참조를 받도록 해서 불필요한 리렌더/루프를 막는다.
function read(): LocalCourse[] {
  try {
    const raw = window.localStorage.getItem(KEY) ?? "[]";
    if (raw !== cacheRaw) {
      cacheRaw = raw;
      const parsed = JSON.parse(raw);
      cache = Array.isArray(parsed) ? parsed : [];
    }
    return cache;
  } catch {
    return cache;
  }
}

function emit() {
  for (const l of listeners) l();
}

function write(next: LocalCourse[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 저장 공간 초과 등 — 무시 */
  }
  cacheRaw = null; // 다음 read에서 새 참조를 만들도록 무효화
  emit();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cacheRaw = null;
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

// 서버 렌더/하이드레이션 첫 프레임에는 null → 로컬 저장소를 읽기 전임을 나타낸다.
function getServerSnapshot(): LocalCourse[] | null {
  return null;
}

/** 이 기기에 보관된 '내 코스' 목록. 하이드레이션 전에는 null. */
export function useMyCourses(): LocalCourse[] | null {
  return useSyncExternalStore(subscribe, read, getServerSnapshot);
}

export function getMyCourses(): LocalCourse[] {
  if (typeof window === "undefined") return [];
  return read();
}

export function addMyCourse(course: LocalCourse): void {
  if (typeof window === "undefined") return;
  const list = read().filter((c) => c.slug !== course.slug);
  write([course, ...list].slice(0, MAX));
}

export function removeMyCourse(slug: string): void {
  if (typeof window === "undefined") return;
  write(read().filter((c) => c.slug !== slug));
}
