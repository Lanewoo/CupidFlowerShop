import { getTranslations, setRequestLocale } from "next-intl/server";
import { isAppLocale } from "@/i18n/routing";
import { SiteHeader } from "@/components/SiteHeader";
import { AccountPanel } from "@/components/AccountPanel";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  if (!isAppLocale(locale)) {
    return null;
  }
  setRequestLocale(locale);
  const t = await getTranslations("Account");
  const tNav = await getTranslations("Nav");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-display text-3xl font-semibold text-rose-950">
            {t("pageTitle")}
          </h1>
          <Link
            href="/"
            className="text-sm font-medium text-rose-700 hover:text-rose-600 hover:underline"
          >
            ← {tNav("shop")}
          </Link>
        </div>
        <AccountPanel />
      </main>
    </>
  );
}
