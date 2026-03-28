import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./auth-cookie";
import { getAuthSecretKey } from "./auth-secret";

export { SESSION_COOKIE };

export const SESSION_MAX_SEC = 60 * 60 * 24 * 7;

/**
 * Whether the session cookie should use the `Secure` flag.
 * Browsers ignore Secure cookies on plain HTTP — login then looks like a no-op.
 * Uses the incoming request (URL + X-Forwarded-Proto) so HTTP on :3000 works without .env.
 * Override: COOKIE_SECURE=1 to force Secure; AUTH_COOKIE_INSECURE=1 to never use Secure.
 */
export function sessionCookieSecureForRequest(request?: Request): boolean {
  if (process.env.AUTH_COOKIE_INSECURE === "1") return false;
  if (process.env.COOKIE_SECURE === "1") return true;
  if (process.env.NODE_ENV !== "production") return false;

  const forwarded = request?.headers.get("x-forwarded-proto");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim().toLowerCase();
    if (first === "https") return true;
    if (first === "http") return false;
  }

  try {
    if (request?.url) {
      const u = new URL(request.url);
      if (u.protocol === "https:") return true;
      if (u.protocol === "http:") return false;
    }
  } catch {
    /* ignore */
  }

  // e.g. http://IP:3000 with no proxy headers
  return false;
}

/** Browser cookie: production keeps you signed in for a week; dev uses a session cookie (cleared when the browser closes). */
export function newSessionCookieAttributes(request?: Request): {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge?: number;
} {
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: sessionCookieSecureForRequest(request),
    path: "/",
  };
  if (process.env.NODE_ENV === "production") {
    return { ...base, maxAge: SESSION_MAX_SEC };
  }
  return base;
}

export function clearSessionCookieAttributes(request?: Request): {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: sessionCookieSecureForRequest(request),
    path: "/",
    maxAge: 0,
  };
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
