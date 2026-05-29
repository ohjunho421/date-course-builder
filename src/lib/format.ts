export function fmtDist(m: number): string {
  return m >= 1000 ? (m / 1000).toFixed(1) + "km" : Math.round(m) + "m";
}

export function fmtDur(seconds: number): string {
  const min = Math.max(1, Math.round(seconds / 60));
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h}시간 ${r}분` : `${h}시간`;
}

const NAVER_MODE: Record<string, string> = {
  walk: "walk",
  car: "car",
  transit: "transit",
};

type Pt = { name: string; lat: number | null; lng: number | null };

export function naverDirUrl(a: Pt, b: Pt, mode: string): string {
  const suffix = NAVER_MODE[mode] ?? "walk";
  const enc = (p: Pt) => `${p.lng},${p.lat},${encodeURIComponent(p.name)}`;
  return `https://map.naver.com/p/directions/${enc(a)}/${enc(b)}/-/${suffix}`;
}
