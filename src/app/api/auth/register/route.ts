import { NextResponse } from "next/server";
import {
  createSessionToken,
  newSessionCookieAttributes,
  SESSION_COOKIE,
} from "@/lib/session";
import { resolvePostLoginRedirect } from "@/lib/redirect";
import { createConsumer } from "@/lib/users";

export const runtime = "nodejs";

type Body = {
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
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

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  const phone = typeof body.phone === "string" ? body.phone : "";
  const address = typeof body.address === "string" ? body.address : "";
  const locale =
    body.locale === "en" || body.locale === "hu" || body.locale === "zh"
      ? body.locale
      : "zh";

  if (!email || !password || !phone || !address) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  try {
    const user = await createConsumer(email, password, phone, address);
    const token = await createSessionToken(user.id, "consumer", {
      email: user.email,
    });
    const target = resolvePostLoginRedirect(
      body.redirect ?? null,
      locale,
      "consumer",
    );
    const res = NextResponse.json({ ok: true, redirect: target });
    res.cookies.set(SESSION_COOKIE, token, newSessionCookieAttributes());
    return res;
  } catch (e) {
    const code = e instanceof Error ? e.message : "unknown";
    if (code === "invalid_email") {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }
    if (code === "email_taken") {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    if (code === "password_short") {
      return NextResponse.json({ error: "password_short" }, { status: 400 });
    }
    if (code === "invalid_phone") {
      return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
    }
    if (code === "invalid_address") {
      return NextResponse.json({ error: "invalid_address" }, { status: 400 });
    }
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
