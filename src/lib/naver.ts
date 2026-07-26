import type { Place } from "./types";

const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
/**
 * 네이버지도 앱에서 공유한 naver.me 링크는 모바일 UA로 열면 앱 딥링크(nmap://)나
 * 앱 설치 유도 페이지로 빠져서 장소 ID를 못 얻는 경우가 있다.
 * 그래서 리다이렉트 추적은 PC UA를 먼저 쓰고, 실패하면 모바일 UA로 한 번 더 시도한다.
 */
const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const PROXY = "https://search.pstatic.net/common/?type=f640_480&quality=95&src=https%3A%2F%2F";

function headers(ua: string): Record<string, string> {
  return {
    "User-Agent": ua,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
  };
}

function emojiFor(category: string): string {
  const c = category;
  if (/카페|커피|디저트|베이커리|빵/.test(c)) return "☕";
  if (/바|BAR|칵테일|위스키|와인|펍|호프/.test(c)) return "🍸";
  if (/주점|술집|요리주점|이자카야|포차/.test(c)) return "🍶";
  if (/브런치/.test(c)) return "🥞";
  if (/디저트|케이크|아이스크림/.test(c)) return "🍰";
  if (/한식|고기|구이|찌개|국밥|분식|양식|일식|중식|음식|레스토랑|food/i.test(c))
    return "🍽️";
  // 네이버지도에서 담아오는 곳은 음식점이 아닌 경우도 많다
  if (/영화|극장|공연|연극|뮤지컬/.test(c)) return "🎬";
  if (/전시|미술관|박물관|갤러리/.test(c)) return "🖼️";
  if (/공원|산책|수목원|식물원|해변|계곡/.test(c)) return "🌳";
  if (/볼링|당구|오락|방탈출|보드게임|PC방|노래방|스크린/.test(c)) return "🎳";
  if (/사진|스튜디오|포토/.test(c)) return "📸";
  if (/호텔|펜션|숙박|모텔|게스트하우스/.test(c)) return "🛏️";
  if (/미용|헤어|네일|왁싱|피부|스파|마사지/.test(c)) return "💇";
  if (/쇼핑|백화점|아울렛|마트|서점|편집샵/.test(c)) return "🛍️";
  return "📍";
}

function withScheme(url: string): string {
  return /^https?:\/\//i.test(url) ? url : "https://" + url;
}

/**
 * 붙여넣은 텍스트에서 네이버 링크만 뽑아낸다.
 * 카카오톡 공유 등으로 복사하면 "가게이름 https://naver.me/xxx 네이버지도"처럼
 * 가게 이름·줄바꿈·안내문구가 URL과 함께 들어오는데, 그 중 URL만 추출한다.
 */
export function extractNaverUrl(input: string): string {
  const text = (input || "").trim();

  // 1) naver.me 단축링크 — 코드는 항상 영숫자라 뒤에 한글이 바로 붙어도 안전하게 끊긴다.
  const short = text.match(/(?:https?:\/\/)?naver\.me\/[A-Za-z0-9]+/i);
  if (short) return withScheme(short[0]);

  // 2) 그 외 네이버 도메인. 네이버지도 주소창에서 복사하면
  //    map.naver.com/p/search/성수동 카페/place/1234567890 처럼 경로에 한글이
  //    그대로 들어오기도 한다. 예전엔 한글에서 끊어버려 place ID를 통째로 잃었다.
  const full = text.match(/(?:https?:\/\/)?(?:[\w-]+\.)*naver\.com\/[^\s"'<>]*/i);
  if (full) {
    // 문장 끝 문장부호가 URL에 딸려오는 경우 제거
    return withScheme(full[0].replace(/[.,;:!?)\]}>"'」』…]+$/, ""));
  }

  // 추출 실패 시 원본을 그대로 돌려준다 (기존 동작 유지)
  return text;
}

/** 네이버 장소 참조: ID와 (알아냈다면) 장소 타입 */
type PlaceRef = { id: string; type?: string };

/**
 * URL이든 HTML 본문이든, 문자열에서 네이버 장소 ID를 뽑아낸다.
 * 네이버 링크는 형태가 제각각이라 알려진 패턴을 순서대로 시도한다.
 *  - https://m.place.naver.com/restaurant/1234567890/home   (네이버 검색 → 장소)
 *  - https://pcmap.place.naver.com/hairshop/1234567890/home
 *  - https://map.naver.com/p/entry/place/1234567890         (네이버지도 PC)
 *  - nmap://place?id=1234567890&appname=map.naver.com       (네이버지도 앱 딥링크)
 */
export function extractPlaceRef(text: string): PlaceRef | null {
  // place.naver.com/{타입}/{id} — 타입까지 알 수 있는 가장 좋은 형태
  let m = text.match(/place\.naver\.com\/([a-z]+)\/(\d{4,})/i);
  if (m) return { type: m[1].toLowerCase(), id: m[2] };

  // .../place/{id} (map.naver.com, nmap://v5/entry/place/... 등)
  m = text.match(/\/place\/(\d{4,})/);
  if (m) return { id: m[1] };

  // 앱 딥링크나 쿼리스트링에 실려오는 ID
  m = text.match(/[?&](?:id|placeId|entryId)=(\d{6,})/i);
  if (m) return { id: m[1] };

  // HTML/JSON 본문에 박혀 있는 ID
  m = text.match(/"placeId"\s*:\s*"?(\d{4,})/);
  if (m) return { id: m[1] };

  return null;
}

/** 리다이렉트를 수동으로 따라가며 장소 참조를 찾는다. */
async function followToRef(startUrl: string, ua: string): Promise<PlaceRef | null> {
  let current = startUrl;

  for (let i = 0; i < 8; i++) {
    const ref = extractPlaceRef(current);
    if (ref) return ref;

    // nmap:// 같은 앱 스킴은 fetch할 수 없다. 여기서 ID를 못 뽑았으면 이 경로는 실패.
    if (!/^https?:\/\//i.test(current)) return null;

    const res = await fetch(current, {
      redirect: "manual",
      cache: "no-store",
      headers: headers(ua),
      signal: AbortSignal.timeout(8000),
    });

    const loc = res.headers.get("location");
    if (loc && res.status >= 300 && res.status < 400) {
      // Location이 nmap://... 처럼 절대 스킴이면 그대로, 아니면 상대경로로 해석
      current = /^[a-z][a-z0-9+.-]*:/i.test(loc) ? loc : new URL(loc, current).href;
      continue;
    }

    if (!res.ok) return null;

    const body = await res.text();

    // 단축링크가 200 + JS/meta 리다이렉트로 응답하는 경우
    const jump = body.match(
      /(?:location\s*\.\s*(?:replace|assign|href)\s*=?\s*\(?\s*["']|url=)((?:https?|nmap|naversearchapp):\/\/[^"'\s>]+)/i
    );
    if (jump) {
      const next = jump[1].replace(/&amp;/g, "&");
      if (next !== current) {
        current = next;
        continue;
      }
    }

    const bodyRef = extractPlaceRef(body);
    if (bodyRef) return bodyRef;
    return null;
  }

  return null;
}

/**
 * naver.me 단축링크 또는 map.naver 링크 → 장소 참조
 * rawInput은 사용자가 붙여넣은 원본 텍스트. 네이버지도 주소를 그대로 복사하면
 * "…/p/search/성수동 카페/place/1234567890"처럼 URL 중간에 공백이 섞여 들어와
 * URL 추출이 앞에서 끊기는데, 그런 경우에도 원본에서 ID를 건져낸다.
 */
async function resolvePlaceRef(url: string, rawInput: string): Promise<PlaceRef> {
  const direct = extractPlaceRef(url) || extractPlaceRef(rawInput);
  if (direct) return direct;

  for (const ua of [DESKTOP_UA, MOBILE_UA]) {
    try {
      const ref = await followToRef(url, ua);
      if (ref) return ref;
    } catch {
      // 다음 UA로 재시도
    }
  }

  throw new Error(
    "장소 ID를 찾지 못했어요. 네이버지도에서 장소를 연 뒤 '공유 → URL 복사'로 받은 링크인지 확인해 주세요. (길찾기·지도 위치 공유 링크는 사용할 수 없어요)"
  );
}

/**
 * 장소 상세 페이지 HTML을 가져온다.
 * 예전엔 항상 /restaurant/ 경로로만 요청해서 음식점이 아닌 곳
 * (카페 외 전시·공원·미용실·숙소 등)은 페이지를 못 불러왔다.
 * /place/ 는 타입에 맞는 페이지로 리다이렉트해 주는 범용 경로다.
 */
async function fetchPlaceHtml(ref: PlaceRef): Promise<string> {
  const candidates = [ref.type, "place", "restaurant"].filter(
    (t, i, arr): t is string => Boolean(t) && arr.indexOf(t) === i
  );

  let lastStatus = 0;
  for (const type of candidates) {
    let res: Response;
    try {
      res = await fetch(`https://m.place.naver.com/${type}/${ref.id}/home`, {
        cache: "no-store",
        headers: headers(MOBILE_UA),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      continue;
    }
    if (!res.ok) {
      lastStatus = res.status;
      continue;
    }
    const html = await res.text();
    if (/og:title/.test(html)) return html;
    lastStatus = 200;
  }

  throw new Error(`네이버 페이지를 불러오지 못했어요 (${lastStatus || "응답 없음"})`);
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

function collectImages(re: RegExp, html: string, seen: Set<string>, out: string[]) {
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 6) {
    const enc = m[0];
    if (seen.has(enc)) continue;
    seen.add(enc);
    out.push(PROXY + enc);
  }
}

function extractImages(html: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  // 업체 대표 사진 우선
  collectImages(
    /(?:ldb-phinf|naverbooking-phinf)\.pstatic\.net%2F[^"\\]+?\.(?:jpe?g|png)/gi,
    html,
    seen,
    out
  );
  // 음식점이 아닌 장소는 다른 phinf 호스트를 쓴다 (전시·숙소·미용실 등)
  collectImages(
    /[a-z0-9-]*phinf\.pstatic\.net%2F[^"\\]+?\.(?:jpe?g|png)/gi,
    html,
    seen,
    out
  );
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
  let m = html.match(/"x":\s*"?(12[6-9]\.\d+)"?,\s*"y":\s*"?(3[3-9]\.\d+)"?/);
  if (m) return { lng: parseFloat(m[1]), lat: parseFloat(m[2]) };
  m = html.match(/"y":\s*"?(3[3-9]\.\d+)"?,\s*"x":\s*"?(12[6-9]\.\d+)"?/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  return { lat: null, lng: null };
}

export async function resolveNaverPlace(url: string): Promise<Place> {
  const cleanUrl = extractNaverUrl(url);
  const ref = await resolvePlaceRef(cleanUrl, url || "");
  const html = await fetchPlaceHtml(ref);
  const placeId = ref.id;

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
