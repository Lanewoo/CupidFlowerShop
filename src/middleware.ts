import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { getSessionFromRequest } from "./lib/session-edge";

const intlMiddleware = createMiddleware(routing);

function safeAdminRedirect(path: string | null, locale: string): string | null {
  if (!path) return null;
  if (/^\/(zh|en|hu)\/admin(\/.*)?$/.test(path)) return path;
  return null;
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const localeMatch = pathname.match(/^\/(zh|en|hu)$/);
  if (localeMatch) {
    return intlMiddleware(request);
  }

  const adminLogin = /^\/(zh|en|hu)\/admin\/login$/.test(pathname);
  const adminArea = /^\/(zh|en|hu)\/admin(\/.*)?$/.test(pathname);

  if (adminArea && !adminLogin) {
    const session = await getSessionFromRequest(request);
    const locale = pathname.match(/^\/(zh|en|hu)/)?.[1] ?? "zh";
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/admin/login`;
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    if (session.role !== "merchant") {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  const consumerOnly = pathname.match(/^\/(zh|en|hu)\/(account|orders)$/);
  if (consumerOnly) {
    const session = await getSessionFromRequest(request);
    const locale = consumerOnly[1];
    if (!session || session.role !== "consumer") {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  const loginMatch = pathname.match(/^\/(zh|en|hu)\/login$/);
  if (loginMatch) {
    const session = await getSessionFromRequest(request);
    const locale = loginMatch[1];
    if (session?.role === "merchant") {
      const redirect = request.nextUrl.searchParams.get("redirect");
      const target = safeAdminRedirect(redirect, locale) ?? `/${locale}/admin`;
      return NextResponse.redirect(new URL(target, request.url));
    }
    if (session?.role === "consumer") {
      const r = request.nextUrl.searchParams.get("redirect");
      if (r && /^\/(zh|en|hu)\/(account|orders)/.test(r)) {
        return NextResponse.redirect(new URL(r, request.url));
      }
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  const registerMatch = pathname.match(/^\/(zh|en|hu)\/register$/);
  if (registerMatch) {
    const session = await getSessionFromRequest(request);
    const locale = registerMatch[1];
    if (session?.role === "consumer") {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
    if (session?.role === "merchant") {
      return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(zh|en|hu)/:path*"],
};
