import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getServerSession } from "@/lib/session";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LogoutButton } from "./LogoutButton";

export async function SiteHeader() {
  const tNav = await getTranslations("Nav");
  const tBrand = await getTranslations("Brand");
  const tAuth = await getTranslations("Auth");
  const session = await getServerSession();
  const who = session?.email ?? session?.username;

  return (
    <header className="sticky top-0 z-20 border-b border-rose-200/55 bg-white/80 shadow-sm shadow-rose-900/[0.04] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex min-w-0 flex-col gap-0.5">
          <span className="font-display text-xl font-semibold tracking-tight text-rose-950 transition group-hover:text-rose-800 sm:text-2xl">
            {tBrand("name")}
          </span>
          <span className="text-xs text-stone-500 sm:text-sm">
            {tBrand("tagline")}
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6">
          <Link
            href="/"
            className="text-sm font-medium text-stone-600 transition hover:text-rose-700"
          >
            {tNav("shop")}
          </Link>
          {session?.role === "merchant" && (
            <Link
              href="/admin"
              className="text-sm font-medium text-stone-600 transition hover:text-rose-700"
            >
              {tNav("admin")}
            </Link>
          )}
          {session?.role === "consumer" && (
            <>
              <Link
                href="/account"
                className="text-sm font-medium text-stone-600 transition hover:text-rose-700"
              >
                {tNav("account")}
              </Link>
              <Link
                href="/orders"
                className="text-sm font-medium text-stone-600 transition hover:text-rose-700"
              >
                {tNav("orders")}
              </Link>
            </>
          )}
          {!session && (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-stone-600 transition hover:text-rose-700"
              >
                {tNav("login")}
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium text-rose-700 transition hover:text-rose-800"
              >
                {tNav("register")}
              </Link>
            </>
          )}
          {session && (
            <>
              {who && (
                <span className="max-w-[10rem] truncate text-xs text-stone-500 sm:max-w-xs sm:text-sm">
                  {tAuth("loggedInAs")}: {who}
                </span>
              )}
              <LogoutButton
                label={tNav("logout")}
                className="text-sm font-medium text-stone-500 underline-offset-2 transition hover:text-rose-700 hover:underline"
              />
            </>
          )}
          <LanguageSwitcher navLabel={tNav("language")} />
        </nav>
      </div>
    </header>
  );
}
