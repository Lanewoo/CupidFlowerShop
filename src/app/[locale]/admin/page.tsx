import { getTranslations, setRequestLocale } from "next-intl/server";
import { isAppLocale } from "@/i18n/routing";
import { AdminPanel } from "@/components/AdminPanel";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;
  if (!isAppLocale(locale)) {
    return null;
  }
  setRequestLocale(locale);

  const t = await getTranslations("Admin");
  const tNav = await getTranslations("Nav");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-rose-900">
            {t("title")}
          </h1>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-rose-700 hover:text-rose-600 hover:underline"
        >
          ← {tNav("shop")}
        </Link>
      </div>
      <AdminPanel />
    </main>
  );
}
