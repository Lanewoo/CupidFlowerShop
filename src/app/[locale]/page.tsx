import { getTranslations, setRequestLocale } from "next-intl/server";
import { isAppLocale } from "@/i18n/routing";
import { readFlowerCatalog } from "@/lib/flowers";
import { SiteHeader } from "@/components/SiteHeader";
import { FlowerCard } from "@/components/FlowerCard";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isAppLocale(locale)) {
    return null;
  }
  setRequestLocale(locale);

  const t = await getTranslations("Home");
  const tFooter = await getTranslations("Footer");
  const catalog = await readFlowerCatalog();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <header className="mb-12 border-b border-rose-200/50 pb-6 sm:mb-14">
            <h1 className="font-display max-w-2xl text-2xl font-semibold tracking-tight text-rose-950 sm:text-3xl">
              {t("catalogTitle")}
            </h1>
          </header>
          {catalog.flowers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-rose-200/90 bg-white/60 px-6 py-14 text-center text-stone-600">
              {t("empty")}
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {catalog.flowers.map((flower) => (
                <li key={flower.id}>
                  <FlowerCard flower={flower} locale={locale} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <footer className="border-t border-rose-200/55 bg-white/50 py-12 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-sm font-medium text-stone-700">
            © {new Date().getFullYear()}{" "}
            <Link
              href="/"
              className="text-rose-800 transition hover:text-rose-700 hover:underline"
            >
              Cupid&apos;s Flower Shop
            </Link>
          </p>
          <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-stone-500">
            {tFooter("rights")}
          </p>
        </div>
      </footer>
    </>
  );
}
