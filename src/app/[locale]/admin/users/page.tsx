import { getTranslations, setRequestLocale } from "next-intl/server";
import { isAppLocale } from "@/i18n/routing";
import { listAllUsersPublic } from "@/lib/users";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminUsersPage({ params }: Props) {
  const { locale } = await params;
  if (!isAppLocale(locale)) {
    return null;
  }
  setRequestLocale(locale);
  const t = await getTranslations("Admin");
  const tNav = await getTranslations("Nav");
  const users = await listAllUsersPublic();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-rose-900">
          {t("usersTitle")}
        </h1>
        <Link
          href="/"
          className="text-sm font-medium text-rose-700 hover:text-rose-600 hover:underline"
        >
          ← {tNav("shop")}
        </Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-rose-200/70 bg-white/90 shadow-sm">
        <table className="min-w-full text-left text-sm text-stone-800">
          <thead className="border-b border-rose-100 bg-rose-50/50 text-xs font-semibold uppercase tracking-wide text-rose-800">
            <tr>
              <th className="px-4 py-3">{t("colRole")}</th>
              <th className="px-4 py-3">{t("colEmail")}</th>
              <th className="px-4 py-3">{t("colUsername")}</th>
              <th className="px-4 py-3">{t("colPhone")}</th>
              <th className="px-4 py-3">{t("colAddress")}</th>
              <th className="px-4 py-3">{t("colCreated")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-rose-100/80 last:border-0"
              >
                <td className="px-4 py-3">
                  {u.role === "merchant" ? t("roleMerchant") : t("roleConsumer")}
                </td>
                <td className="px-4 py-3">{u.email ?? "—"}</td>
                <td className="px-4 py-3">{u.username ?? "—"}</td>
                <td className="px-4 py-3">{u.phone ?? "—"}</td>
                <td className="max-w-xs whitespace-pre-wrap px-4 py-3">
                  {u.address ?? "—"}
                </td>
                <td className="px-4 py-3 text-stone-500">
                  {new Date(u.createdAt).toLocaleString(locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
