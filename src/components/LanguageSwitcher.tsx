"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const labels: Record<string, string> = {
  zh: "中文",
  en: "English",
  hu: "Magyar",
};

export function LanguageSwitcher({ navLabel }: { navLabel: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="flex items-center gap-2 text-sm text-stone-600">
      <span className="sr-only">{navLabel}</span>
      <span aria-hidden className="hidden sm:inline">
        {navLabel}
      </span>
      <select
        className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-stone-800 shadow-sm outline-none ring-rose-400/40 transition hover:border-stone-300 focus:ring-2 focus:ring-rose-500"
        value={locale}
        onChange={(e) => {
          const next = e.target.value;
          router.replace(pathname, { locale: next });
        }}
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {labels[loc] ?? loc}
          </option>
        ))}
      </select>
    </label>
  );
}
