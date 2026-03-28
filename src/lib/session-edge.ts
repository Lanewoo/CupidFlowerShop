import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "./auth-cookie";
import { getAuthSecretKey } from "./auth-secret";
import type { SessionPayload } from "./session";

export async function getSessionFromRequest(
  request: NextRequest,
): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
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
