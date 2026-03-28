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

export function RegisterForm({ locale, redirect }: Props) {
  const t = useTranslations("Auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailGate = useAutofillFieldGate();
  const phoneGate = useAutofillFieldGate();
  const addressGate = useAutofillFieldGate();
  const passwordGate = useAutofillFieldGate();
  const confirmGate = useAutofillFieldGate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t("errorPasswordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          phone,
          address,
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
        if (data.error === "email_taken") setError(t("errorEmailTaken"));
        else if (data.error === "invalid_email") setError(t("errorEmailInvalid"));
        else if (data.error === "password_short") setError(t("errorPasswordShort"));
        else if (data.error === "invalid_phone") setError(t("errorPhoneInvalid"));
        else if (data.error === "invalid_address")
          setError(t("errorAddressInvalid"));
        else setError(t("errorGeneric"));
        return;
      }
      window.location.assign(hrefWithLocale(locale, data.redirect ?? "/"));
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
            {t("email")}
          </label>
          <input
            type="email"
            name="register-email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={emailGate.readOnly}
            onFocus={emailGate.onFocus}
            className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-stone-900 outline-none ring-rose-400/30 focus:ring-2 read-only:bg-stone-50/80"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-800">
            {t("phone")}
          </label>
          <input
            type="tel"
            name="register-phone"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            readOnly={phoneGate.readOnly}
            onFocus={phoneGate.onFocus}
            className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-stone-900 outline-none ring-rose-400/30 focus:ring-2 read-only:bg-stone-50/80"
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-800">
            {t("address")}
          </label>
          <textarea
            name="register-address"
            autoComplete="street-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            readOnly={addressGate.readOnly}
            onFocus={addressGate.onFocus}
            rows={3}
            className="mt-2 w-full resize-y rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-stone-900 outline-none ring-rose-400/30 focus:ring-2 read-only:bg-stone-50/80"
            required
            minLength={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-800">
            {t("password")}
          </label>
          <input
            type="password"
            name="register-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            readOnly={passwordGate.readOnly}
            onFocus={passwordGate.onFocus}
            className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-stone-900 outline-none ring-rose-400/30 focus:ring-2 read-only:bg-stone-50/80"
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-800">
            {t("confirmPassword")}
          </label>
          <input
            type="password"
            name="register-password2"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            readOnly={confirmGate.readOnly}
            onFocus={confirmGate.onFocus}
            className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-stone-900 outline-none ring-rose-400/30 focus:ring-2 read-only:bg-stone-50/80"
            required
            minLength={6}
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
          {loading ? "…" : t("submitRegister")}
        </button>
      </form>
      <p className="text-center text-sm text-stone-600">
        <Link href="/login" className="font-medium text-rose-700 hover:underline">
          {t("goLogin")}
        </Link>
      </p>
    </div>
  );
}
