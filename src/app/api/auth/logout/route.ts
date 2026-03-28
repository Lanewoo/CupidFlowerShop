import { NextResponse } from "next/server";
import { SESSION_COOKIE, clearSessionCookieAttributes } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", clearSessionCookieAttributes(request));
  return res;
}
