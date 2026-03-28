"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Order } from "@/lib/order-types";

type OrderItemRow = Order["items"][number] & { label?: string };

type OrderRow = Omit<Order, "items"> & { items: OrderItemRow[] };

export function MyOrdersPanel() {
  const t = useTranslations("Shop");
  const tNav = useTranslations("Nav");
  const locale = useLocale();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?locale=${encodeURIComponent(locale)}`);
      if (!res.ok) throw new Error("fail");
      const data = (await res.json()) as { orders: OrderRow[] };
      setOrders(data.orders);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when locale changes
  }, [locale]);

  const statusLabel = (s: Order["status"]) => {
    if (s === "pending") return t("statusPending");
    if (s === "cancelled") return t("statusCancelled");
    if (s === "completed") return t("statusCompleted");
    return s;
  };

  const cancel = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, { method: "POST" });
      if (res.ok) await load();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="text-stone-600">{t("ordersLoading")}</p>;
  }

  return (
    <div className="space-y-6">
      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-rose-200 bg-white/60 px-6 py-12 text-center text-stone-600">
          {t("ordersEmpty")}{" "}
          <Link href="/" className="font-medium text-rose-700 hover:underline">
            {tNav("shop")}
          </Link>
        </p>
      ) : (
        orders.map((o) => (
          <article
            key={o.id}
            className="rounded-2xl border border-rose-200/70 bg-white/90 p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-100 pb-3">
              <span className="rounded-full bg-rose-100 px-3 py-0.5 text-xs font-semibold text-rose-800">
                {statusLabel(o.status)}
              </span>
              <time className="text-xs text-stone-500">
                {new Date(o.createdAt).toLocaleString(locale)}
              </time>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-stone-800">
              {o.items.map((it, i) => (
                <li key={i}>
                  ×{it.quantity} · {it.label ?? it.flowerId}
                </li>
              ))}
            </ul>
            {o.status === "pending" && (
              <button
                type="button"
                disabled={busyId === o.id}
                onClick={() => void cancel(o.id)}
                className="mt-4 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:border-rose-300 hover:text-rose-800 disabled:opacity-60"
              >
                {busyId === o.id ? "…" : t("cancelOrder")}
              </button>
            )}
          </article>
        ))
      )}
    </div>
  );
}
