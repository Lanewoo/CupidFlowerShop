"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations("Admin");

  if (pathname === "/admin/login" || pathname?.startsWith("/admin/login")) {
    return null;
  }

  const tab = (href: string, label: string) => {
    const active = pathname === href || pathname?.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
          active
            ? "bg-rose-700 text-white shadow-sm"
            : "bg-white/80 text-stone-600 hover:text-rose-800"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="border-b border-rose-200/50 bg-rose-50/40">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-3 sm:px-6">
        {tab("/admin", t("navFlowers"))}
        {tab("/admin/users", t("navUsers"))}
        {tab("/admin/orders", t("navOrders"))}
      </div>
    </div>
  );
}
