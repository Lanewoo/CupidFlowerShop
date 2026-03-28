"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

type Props = {
  flowerId: string;
};

export function OrderButton({ flowerId }: Props) {
  const t = useTranslations("Shop");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const place = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ flowerId, quantity: 1 }],
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (res.status === 401) {
        setMsg(t("orderNeedLogin"));
        return;
      }
      if (!res.ok) {
        setMsg(t("orderFail"));
        return;
      }
      router.refresh();
      setMsg(t("orderSuccess"));
    } catch {
      setMsg(t("orderFail"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-1">
      <button
        type="button"
        disabled={loading}
        onClick={() => void place()}
        className="w-full rounded-full bg-rose-700 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-800 disabled:opacity-60"
      >
        {loading ? "…" : t("placeOrder")}
      </button>
      {msg && (
        <p className="text-center text-xs text-stone-600" role="status">
          {msg}
        </p>
      )}
    </div>
  );
}
