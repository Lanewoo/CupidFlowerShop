/**
 * Pathname without locale prefix, for `useRouter` / `Link` from `next-intl/navigation`
 * (they add the current locale themselves).
 */
export function resolvePostLoginRedirect(
  raw: string | null,
  _locale: string,
  role: "merchant" | "consumer",
): string {
  const home = "/";
  const admin = "/admin";
  const fallback = role === "merchant" ? admin : home;

  if (!raw || raw[0] !== "/") return fallback;

  const m = raw.match(/^\/(zh|en|hu)(\/.*)?$/);
  if (!m) return fallback;

  const rest = m[2] ?? "";
  const pathAfterLocale = rest === "" ? "/" : rest;

  if (role === "consumer" && pathAfterLocale.startsWith("/admin")) {
    return home;
  }
  if (role === "merchant" && !pathAfterLocale.startsWith("/admin")) {
    return admin;
  }
  return pathAfterLocale;
}
