import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "dgg_session";
const ALG = "HS256";

export type SessionUser = { id: string; name: string; image?: string };

function secretKey(): Uint8Array {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "");
}

/** Kakao login is available only when both env vars are present */
export function kakaoConfigured(): boolean {
  return !!process.env.KAKAO_REST_KEY && !!process.env.AUTH_SECRET;
}

export async function signSession(user: SessionUser): Promise<string> {
  return await new SignJWT({ name: user.name, image: user.image ?? "" })
    .setProtectedHeader({ alg: ALG })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function getSession(): Promise<SessionUser | null> {
  if (!process.env.AUTH_SECRET) return null;
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    return {
      id: String(payload.sub),
      name: String(payload.name || "사용자"),
      image: (payload.image as string) || undefined,
    };
  } catch {
    return null;
  }
}
