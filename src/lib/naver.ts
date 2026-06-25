import type { Place } from "./types";

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

const PROXY = "https://search.pstatic.net/common/?type=f640_480&quality=95&src=https%3A%2F%2F";

function emojiFor(category: string): string {
  const c = category;
  if (/카페|커피|디저트|베이커리|빵/.test(c)) return "☕";
  if (/바|BAR|칵테일|위스키|와인|펍|호프/.test(c)) return "🍸";
  if (/주점|술집|요리주점|이자카야|포차/.test(c)) return "🍶";
  if (/브런치/.test(c)) return "🥞";
  if (/디저트|케이크|아이스크림/.test(c)) return "🍰";
  if (/한식|고기|구이|찌개|국밥|분식|양식|일식|중식|음식|레스토랑|food/i.test(c))
    return "🍽️";
  return "📍";
}

/**
 * 붙여넣은 텍스트에서 네이버 링크만 뽑아낸다.
 * 카카오톡 공유 등으로 복사하면 "가게이름 https://naver.me/xxx 네이버지도"처럼
 * 가게 이름·줄바꿈·안내문구가 URL과 함께 들어오는데, 그 중 URL만 추출한다.
 * URL은 항상 ASCII이므로 한글/공백/따옴표를 만나면 거기서 끊는다.
 */
export function extractNaverUrl(input: string): string {
  const text = (input || "").trim();
  // 1) 스킴이 있는 정식 URL (https://naver.me/..., https://m.place.naver.com/...)
  const withScheme = text.match(
    /https?:\/\/[^\s"'<>가-힣]*naver\.(?:me|com)[^\s"'<>가-힣]*/i
  );
  if (withScheme) return withScheme[0];
  // 2) 스킴이 빠진 채로 복사된 경우 (naver.me/..., map.naver.com/...)
  const noScheme = text.match(
    /(?:[\w-]+\.)*naver\.(?:me|com)\/[^\s"'<>가-힣]*/i
  );
  if (noScheme) return "https://" + noScheme[0];
  // 추출 실패 시 원본을 그대로 돌려준다 (기존 동작 유지)
  return text;
}

/** drop ASCII control characters (Naver injects them into og:title) */
function stripControls(str: string): string {
  let out = "";
  for (const ch of str) if (ch.charCodeAt(0) >= 32) out += ch;
  return out;
}

function first(re: RegExp, html: string): string {
  const m = html.match(re);
  return m ? m[1] : "";
}

function extractImages(html: string): string[] {
  const re =
    /(?:ldb-phinf|naverbooking-phinf)\.pstatic\.net%2F[^"\\]+?\.(?:jpe?g|png)/gi;
  const seen = new Set<string>();
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 6) {
    const enc = m[0];
    if (seen.has(enc)) continue;
    seen.add(enc);
    out.push(PROXY + enc);
  }
  return out;
}

function extractKeywords(html: string): string[] {
  const re = /"displayName":"([^"]{2,20}?(?:요|어요|있어요))"/g;
  const seen = new Set<string>();
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 6) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    out.push(m[1]);
  }
  return out;
}

function extractMenu(html: string): string[] {
  const re = /"Menu:\d+"[^}]*?"name":"([^"]{1,40})"/g;
  const seen = new Set<string>();
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 6) {
    const name = m[1].replace(/\\u002F/g, "/").trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

function extractCoords(html: string): { lat: number | null; lng: number | null } {
  // Naver stores x = lng (126..), y = lat (37..)
  let m = html.match(/"x":"(12[6-9]\.\d+)","y":"(3[3-9]\.\d+)"/);
  if (m) return { lng: parseFloat(m[1]), lat: parseFloat(m[2]) };
  m = html.match(/"y":"(3[3-9]\.\d+)","x":"(12[6-9]\.\d+)"/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  return { lat: null, lng: null };
}

/** naver.me 단축링크 또는 map.naver 링크 → placeId (리다이렉트 수동 추적) */
async function resolvePlaceId(url: string): Promise<string> {
  let current = url;
  for (let i = 0; i < 6; i++) {
    const direct = current.match(/place\/(\d+)/);
    if (direct) return direct[1];

    const res = await fetch(current, {
      redirect: "manual",
      cache: "no-store",
      headers: { "User-Agent": UA },
    });

    const loc = res.headers.get("location");
    if (
      loc &&
      (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308)
    ) {
      current = loc.startsWith("http") ? loc : new URL(loc, current).href;
      continue;
    }

    const fromUrl = (res.url || current).match(/place\/(\d+)/);
    if (fromUrl) return fromUrl[1];
    const body = await res.text();
    const b = body.match(/place\/(\d+)/) || body.match(/"placeId"\s*:\s*"?(\d+)/);
    if (b) return b[1];
    break;
  }
  throw new Error("네이버 장소 ID를 찾지 못했어요. 링크를 다시 확인해 주세요.");
}

export async function resolveNaverPlace(url: string): Promise<Place> {
  const cleanUrl = extractNaverUrl(url);
  const placeId = await resolvePlaceId(cleanUrl);
  const placeUrl = `https://m.place.naver.com/restaurant/${placeId}/home`;
  const res = await fetch(placeUrl, {
    cache: "no-store",
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`네이버 페이지를 불러오지 못했어요 (${res.status})`);
  const html = await res.text();

  const rawTitle = first(/<meta id="og:title"[^>]*content="([^"]*)"/, html);
  const name =
    stripControls(rawTitle).replace(/\s*:\s*네이버\s*$/, "").trim() || "이름 미상";

  const desc = first(/<meta id="og:description"[^>]*content="([^"]*)"/, html);
  const visitor = (desc.match(/방문자리뷰\s*([\d,]+)/) || [])[1] || "";
  const blog = (desc.match(/블로그리뷰\s*([\d,]+)/) || [])[1] || "";

  const category = first(/"category":"([^"]*)"/, html) || "장소";
  const address = first(/"roadAddress":"([^"]*)"/, html) || "";
  const hours = first(/"description":"([^"]*?영업[^"]*?)"/, html) || "";
  const micro = stripControls(first(/"microReviews":\["([^"]*)"/, html));
  const { lat, lng } = extractCoords(html);

  let images = extractImages(html);
  if (images.length === 0) {
    const og = first(/<meta id="og:image"[^>]*content="([^"]*)"/, html);
    if (og) images = [og.replace(/&amp;/g, "&")];
  }

  return {
    sourceUrl: cleanUrl,
    placeId,
    placeUrl: `https://map.naver.com/p/entry/place/${placeId}`,
    name,
    category,
    emoji: emojiFor(category),
    address,
    lat,
    lng,
    hours,
    images,
    keywords: extractKeywords(html),
    micro,
    menu: extractMenu(html),
    visitor,
    blog,
  };
}
