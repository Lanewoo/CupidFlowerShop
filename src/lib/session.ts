import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./auth-cookie";
import { getAuthSecretKey } from "./auth-secret";

export { SESSION_COOKIE };

export const SESSION_MAX_SEC = 60 * 60 * 24 * 7;

/** Browser cookie: production keeps you signed in for a week; dev uses a session cookie (cleared when the browser closes). */
export function newSessionCookieAttributes(): {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge?: number;
} {
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  if (process.env.NODE_ENV === "production") {
    return { ...base, maxAge: SESSION_MAX_SEC };
  }
  return base;
}

export type SessionPayload = {
  userId: string;
  role: "merchant" | "consumer";
  email?: string;
  username?: string;
};

export async function createSessionToken(
  userId: string,
  role: SessionPayload["role"],
  profile?: { email?: string; username?: string },
) {
  const body: Record<string, unknown> = { role };
  if (profile?.email) body.email = profile.email;
  if (profile?.username) body.username = profile.username;
  return new SignJWT(body)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_SEC}s`)
    .sign(getAuthSecretKey());
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecretKey());
    const role = payload.role;
    if (role !== "merchant" && role !== "consumer") return null;
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    if (!userId) return null;
    return {
      userId,
      role,
      email: typeof payload.email === "string" ? payload.email : undefined,
      username:
        typeof payload.username === "string" ? payload.username : undefined,
    };
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}
