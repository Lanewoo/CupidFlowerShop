/** Path without locale (e.g. `/admin`, `/`) → full app path (e.g. `/zh/admin`). */
export function hrefWithLocale(locale: string, pathname: string): string {
  if (!pathname || pathname === "/") return `/${locale}`;
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `/${locale}${p}`;
}
