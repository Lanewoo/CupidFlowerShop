import { getTranslations, setRequestLocale } from "next-intl/server";
import { isAppLocale } from "@/i18n/routing";
import { readFlowerCatalog } from "@/lib/flowers";
import { listAllOrders } from "@/lib/orders";
import type { LocaleCode } from "@/lib/types";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminOrdersPage({ params }: Props) {
  const { locale } = await params;
  if (!isAppLocale(locale)) {
    return null;
  }
  setRequestLocale(locale);
  const loc = (["zh", "en", "hu"].includes(locale) ? locale : "zh") as LocaleCode;
  const t = await getTranslations("Admin");
  const tNav = await getTranslations("Nav");
  const tShop = await getTranslations("Shop");
  const orders = await listAllOrders();
  const catalog = await readFlowerCatalog();
  const nameById = new Map(
    catalog.flowers.map((f) => [
      f.id,
      f.names[loc] || f.names.zh || f.id,
    ]),
  );

  const statusLabel = (s: string) => {
    if (s === "pending") return tShop("statusPending");
    if (s === "cancelled") return tShop("statusCancelled");
    if (s === "completed") return tShop("statusCompleted");
    return s;
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-rose-900">
          {t("ordersTitle")}
        </h1>
        <Link
          href="/"
          className="text-sm font-medium text-rose-700 hover:text-rose-600 hover:underline"
        >
          ← {tNav("shop")}
        </Link>
      </div>
      <div className="space-y-6">
        {orders.map((o) => (
          <article
            key={o.id}
            className="rounded-2xl border border-rose-200/70 bg-white/90 p-4 shadow-sm sm:p-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rose-100 pb-3">
              <p className="font-mono text-xs text-stone-500">{o.id}</p>
              <span className="rounded-full bg-rose-100 px-3 py-0.5 text-xs font-semibold text-rose-800">
                {statusLabel(o.status)}
              </span>
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-stone-500">{t("orderUserEmail")}</dt>
                <dd className="font-medium text-stone-900">{o.userEmail}</dd>
              </div>
              <div>
                <dt className="text-stone-500">{t("orderPhone")}</dt>
                <dd>{o.phoneSnapshot || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-stone-500">{t("orderAddress")}</dt>
                <dd className="whitespace-pre-wrap">{o.addressSnapshot || "—"}</dd>
              </div>
              <div>
                <dt className="text-stone-500">{t("orderTime")}</dt>
                <dd className="text-stone-600">
                  {new Date(o.createdAt).toLocaleString(locale)}
                </dd>
              </div>
            </dl>
            <ul className="mt-4 space-y-1 text-sm">
              {o.items.map((it, i) => (
                <li key={`${o.id}-${i}`}>
                  ×{it.quantity}{" "}
                  {nameById.get(it.flowerId) ?? it.flowerId}
                </li>
              ))}
            </ul>
          </article>
        ))}
        {orders.length === 0 && (
          <p className="rounded-2xl border border-dashed border-rose-200 bg-white/60 px-6 py-12 text-center text-stone-600">
            {t("ordersEmpty")}
          </p>
        )}
      </div>
    </main>
  );
}
