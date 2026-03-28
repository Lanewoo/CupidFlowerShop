"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAutofillFieldGate } from "@/hooks/useAutofillFieldGate";
import type { PublicUser } from "@/lib/user-types";

export function AccountPanel() {
  const t = useTranslations("Account");
  const tNav = useTranslations("Nav");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const oldPwGate = useAutofillFieldGate();
  const newPwGate = useAutofillFieldGate();
  const newPw2Gate = useAutofillFieldGate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/me");
        if (!res.ok) throw new Error("me");
        const data = (await res.json()) as { user: PublicUser };
        if (!cancelled) {
          setUser(data.user);
          setPhone(data.user.phone ?? "");
          setAddress(data.user.address ?? "");
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, address }),
      });
      const data = (await res.json()) as { user?: PublicUser; error?: string };
      if (!res.ok) {
        if (data.error === "invalid_phone") setProfileMsg(t("errorPhone"));
        else if (data.error === "invalid_address") setProfileMsg(t("errorAddress"));
        else setProfileMsg(t("errorGeneric"));
        return;
      }
      if (data.user) setUser(data.user);
      setProfileMsg(t("profileSaved"));
    } catch {
      setProfileMsg(t("errorGeneric"));
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== newPw2) {
      setPwMsg(t("errorPasswordMismatch"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (data.error === "bad_old_password") setPwMsg(t("errorOldPassword"));
        else if (data.error === "password_short") setPwMsg(t("errorPasswordShort"));
        else setPwMsg(t("errorGeneric"));
        return;
      }
      setOldPw("");
      setNewPw("");
      setNewPw2("");
      setPwMsg(t("passwordSaved"));
    } catch {
      setPwMsg(t("errorGeneric"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-stone-600">{t("loading")}</p>
    );
  }

  if (!user) {
    return (
      <p className="text-rose-700">
        {t("unauthorized")}{" "}
        <Link href="/login" className="font-medium underline">
          {tNav("login")}
        </Link>
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-10">
      <section className="rounded-2xl border border-rose-200/70 bg-white/90 p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-rose-950">
          {t("emailLabel")}
        </h2>
        <p className="mt-2 text-sm text-stone-600">{user.email}</p>
      </section>

      <section className="rounded-2xl border border-rose-200/70 bg-white/90 p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-rose-950">
          {t("profileSection")}
        </h2>
        <form onSubmit={(e) => void saveProfile(e)} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-800">
              {t("phone")}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-rose-200 px-3 py-2 text-stone-900 outline-none ring-rose-400/30 focus:ring-2"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-800">
              {t("address")}
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-y rounded-xl border border-rose-200 px-3 py-2 text-stone-900 outline-none ring-rose-400/30 focus:ring-2"
              required
              minLength={2}
            />
          </div>
          {profileMsg && (
            <p className="text-sm text-stone-700" role="status">
              {profileMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-rose-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
          >
            {t("saveProfile")}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-rose-200/70 bg-white/90 p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-rose-950">
          {t("passwordSection")}
        </h2>
        <form
          autoComplete="off"
          onSubmit={(e) => void savePassword(e)}
          className="mt-4 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-stone-800">
              {t("oldPassword")}
            </label>
            <input
              type="password"
              name="account-old-password"
              autoComplete="current-password"
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              readOnly={oldPwGate.readOnly}
              onFocus={oldPwGate.onFocus}
              className="mt-1 w-full rounded-xl border border-rose-200 px-3 py-2 outline-none ring-rose-400/30 focus:ring-2 read-only:bg-stone-50/80"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-800">
              {t("newPassword")}
            </label>
            <input
              type="password"
              name="account-new-password"
              autoComplete="new-password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              readOnly={newPwGate.readOnly}
              onFocus={newPwGate.onFocus}
              className="mt-1 w-full rounded-xl border border-rose-200 px-3 py-2 outline-none ring-rose-400/30 focus:ring-2 read-only:bg-stone-50/80"
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
              name="account-new-password2"
              autoComplete="new-password"
              value={newPw2}
              onChange={(e) => setNewPw2(e.target.value)}
              readOnly={newPw2Gate.readOnly}
              onFocus={newPw2Gate.onFocus}
              className="mt-1 w-full rounded-xl border border-rose-200 px-3 py-2 outline-none ring-rose-400/30 focus:ring-2 read-only:bg-stone-50/80"
              required
              minLength={6}
            />
          </div>
          {pwMsg && (
            <p className="text-sm text-stone-700" role="status">
              {pwMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-full border border-rose-300 bg-white px-6 py-2.5 text-sm font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-60"
          >
            {t("savePassword")}
          </button>
        </form>
      </section>
    </div>
  );
}
