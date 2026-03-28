import { getTranslations, setRequestLocale } from "next-intl/server";
import { isAppLocale } from "@/i18n/routing";
import { SiteHeader } from "@/components/SiteHeader";
import { RegisterForm } from "@/components/RegisterForm";
import { Link } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string }>;
};

export default async function RegisterPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isAppLocale(locale)) {
    return null;
  }
  setRequestLocale(locale);
  const sp = await searchParams;
  const redirect = typeof sp.redirect === "string" ? sp.redirect : null;
  const t = await getTranslations("Auth");
  const tNav = await getTranslations("Nav");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-display text-3xl font-semibold text-rose-950">
            {t("registerTitle")}
          </h1>
          <Link
            href="/"
            className="text-sm font-medium text-rose-700 hover:text-rose-600 hover:underline"
          >
            ← {tNav("shop")}
          </Link>
        </div>
        <RegisterForm locale={locale} redirect={redirect} />
      </main>
    </>
  );
}
