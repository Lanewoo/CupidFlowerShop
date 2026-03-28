"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

/** Syncs <html lang> with the active next-intl locale (root layout uses a static default). */
export function LocaleHtmlLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
