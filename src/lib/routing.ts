export type LatLng = { lat: number; lng: number };
export type LegResult = {
  geometry: [number, number][]; // [lat,lng] points
  distance: number; // meters
  duration: number; // seconds
  estimated: boolean; // true = straight-line estimate, not a real road route
};

// rough average speeds (m/s) for fallback / transit estimates
const SPEED: Record<string, number> = { walk: 1.35, car: 7.5, transit: 5.0 };

// FOSSGIS public Valhalla (keyless) costing per mode
const VALHALLA = "https://valhalla1.openstreetmap.de/route";
const COSTING: Record<string, string> = { walk: "pedestrian", car: "auto" };

export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** decode a Valhalla-encoded polyline (precision 6) into [lat,lng] points */
function decodePolyline(str: string, precision = 6): [number, number][] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coords: [number, number][] = [];
  const factor = Math.pow(10, precision);
  while (index < str.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / factor, lng / factor]);
  }
  return coords;
}

function estimate(mode: string, a: LatLng, b: LatLng): LegResult {
  const d = haversine(a, b) * 1.3; // detour factor
  return {
    geometry: [
      [a.lat, a.lng],
      [b.lat, b.lng],
    ],
    distance: d,
    duration: d / (SPEED[mode] ?? SPEED.walk),
    estimated: true,
  };
}

export async function routeLeg(
  mode: string,
  a: LatLng,
  b: LatLng
): Promise<LegResult> {
  const costing = COSTING[mode];
  // transit has no free geometry source -> honest straight-line estimate
  if (costing) {
    try {
      const res = await fetch(VALHALLA, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          locations: [
            { lat: a.lat, lon: a.lng },
            { lat: b.lat, lon: b.lng },
          ],
          costing,
          directions_options: { units: "kilometers" },
        }),
        signal: AbortSignal.timeout(7000),
      });
      if (res.ok) {
        const j = await res.json();
        const leg = j?.trip?.legs?.[0];
        if (leg?.shape) {
          return {
            geometry: decodePolyline(leg.shape),
            distance: (j.trip.summary.length ?? 0) * 1000,
            duration: j.trip.summary.time ?? 0,
            estimated: false,
          };
        }
      }
    } catch {
      /* fall through to estimate */
    }
  }
  return estimate(mode, a, b);
}
