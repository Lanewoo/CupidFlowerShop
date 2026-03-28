"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAutofillFieldGate } from "@/hooks/useAutofillFieldGate";
import { hrefWithLocale } from "@/lib/locale-href";

type Props = {
  locale: string;
  redirect: string | null;
};

export function MerchantLoginForm({ locale, redirect }: Props) {
  const t = useTranslations("Auth");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const usernameGate = useAutofillFieldGate();
  const passwordGate = useAutofillFieldGate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "merchant",
          identifier: username,
          password,
          redirect,
          locale,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        redirect?: string;
        error?: string;
      };
      if (!res.ok) {
        if (data.error === "invalid_credentials") setError(t("errorCredentials"));
        else setError(t("errorGeneric"));
        return;
      }
      window.location.assign(
        hrefWithLocale(locale, data.redirect ?? "/admin"),
      );
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-8">
      <form
        autoComplete="off"
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-stone-800">
            {t("username")}
          </label>
          <input
            type="text"
            name="admin-username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            readOnly={usernameGate.readOnly}
            onFocus={usernameGate.onFocus}
            className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-stone-900 outline-none ring-rose-400/30 focus:ring-2 read-only:bg-stone-50/80"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-800">
            {t("password")}
          </label>
          <input
            type="password"
            name="admin-password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            readOnly={passwordGate.readOnly}
            onFocus={passwordGate.onFocus}
            className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-stone-900 outline-none ring-rose-400/30 focus:ring-2 read-only:bg-stone-50/80"
            required
          />
        </div>
        {error && (
          <p className="text-sm font-medium text-rose-700" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-rose-700 py-3 text-sm font-semibold text-white shadow-md shadow-rose-700/25 transition hover:bg-rose-800 disabled:opacity-60"
        >
          {loading ? "…" : t("submitAdminLogin")}
        </button>
      </form>
      <p className="text-center text-sm text-stone-600">
        <Link href="/" className="font-medium text-rose-700 hover:underline">
          {t("backToShop")}
        </Link>
      </p>
    </div>
  );
}
