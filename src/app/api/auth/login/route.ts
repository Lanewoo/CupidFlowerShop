import { NextResponse } from "next/server";
import {
  createSessionToken,
  newSessionCookieAttributes,
  SESSION_COOKIE,
} from "@/lib/session";
import { resolvePostLoginRedirect } from "@/lib/redirect";
import {
  findConsumerByEmail,
  findMerchantByUsername,
  normalizeEmail,
  verifyPassword,
} from "@/lib/users";

export const runtime = "nodejs";

type Body = {
  kind?: string;
  identifier?: string;
  password?: string;
  redirect?: string | null;
  locale?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const kind = body.kind === "merchant" ? "merchant" : "consumer";
  const identifier = typeof body.identifier === "string" ? body.identifier : "";
  const password = typeof body.password === "string" ? body.password : "";
  const locale =
    body.locale === "en" || body.locale === "hu" || body.locale === "zh"
      ? body.locale
      : "zh";

  if (!identifier || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  let user:
    | {
        id: string;
        role: "merchant" | "consumer";
        profile?: { email?: string; username?: string };
      }
    | null = null;

  if (kind === "merchant") {
    const u = await findMerchantByUsername(identifier);
    if (u && (await verifyPassword(password, u.passwordHash))) {
      user = {
        id: u.id,
        role: "merchant",
        profile: u.username ? { username: u.username } : undefined,
      };
    }
  } else {
    const u = await findConsumerByEmail(normalizeEmail(identifier));
    if (u && (await verifyPassword(password, u.passwordHash))) {
      user = {
        id: u.id,
        role: "consumer",
        profile: u.email ? { email: u.email } : undefined,
      };
    }
  }

  if (!user) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const token = await createSessionToken(user.id, user.role, user.profile);
  const target = resolvePostLoginRedirect(
    body.redirect ?? null,
    locale,
    user.role,
  );

  const res = NextResponse.json({ ok: true, redirect: target });
  res.cookies.set(SESSION_COOKIE, token, newSessionCookieAttributes(request));
  return res;
}
