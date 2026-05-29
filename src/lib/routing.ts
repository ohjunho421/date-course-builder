export type LatLng = { lat: number; lng: number };
export type LegResult = {
  geometry: [number, number][]; // [lat,lng] points
  distance: number; // meters
  duration: number; // seconds
  estimated: boolean;
};

// rough average speeds (m/s) for fallback estimates
const SPEED: Record<string, number> = { walk: 1.35, car: 7.5, transit: 5.0 };
const ORS_PROFILE: Record<string, string> = {
  walk: "foot-walking",
  car: "driving-car",
};

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

function estimate(mode: string, a: LatLng, b: LatLng): LegResult {
  const d = haversine(a, b) * 1.3; // detour factor for street routing
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
  const key = process.env.ORS_API_KEY;
  const profile = ORS_PROFILE[mode];
  if (key && profile) {
    try {
      const res = await fetch(
        `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
        {
          method: "POST",
          headers: {
            Authorization: key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            coordinates: [
              [a.lng, a.lat],
              [b.lng, b.lat],
            ],
          }),
        }
      );
      if (res.ok) {
        const j = await res.json();
        const f = j.features?.[0];
        if (f?.geometry?.coordinates) {
          return {
            geometry: f.geometry.coordinates.map(
              (c: [number, number]) => [c[1], c[0]] as [number, number]
            ),
            distance: f.properties.summary.distance,
            duration: f.properties.summary.duration,
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
