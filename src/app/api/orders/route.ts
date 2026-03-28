import { NextResponse } from "next/server";
import { readFlowerCatalog } from "@/lib/flowers";
import { createOrder, listOrdersForUser } from "@/lib/orders";
import type { LocaleCode } from "@/lib/types";
import { getServerSession } from "@/lib/session";
import { findUserById } from "@/lib/users";

export const runtime = "nodejs";

type Line = { flowerId?: string; quantity?: number };

function pickLocale(raw: string | null): LocaleCode {
  if (raw === "en" || raw === "hu" || raw === "zh") return raw;
  return "zh";
}

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "consumer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const locale = pickLocale(url.searchParams.get("locale"));
  const orders = await listOrdersForUser(session.userId);
  const catalog = await readFlowerCatalog();
  const labelFor = (flowerId: string) => {
    const f = catalog.flowers.find((x) => x.id === flowerId);
    if (!f) return flowerId;
    return f.names[locale] || f.names.zh || flowerId;
  };
  const enriched = orders.map((o) => ({
    ...o,
    items: o.items.map((it) => ({
      ...it,
      label: labelFor(it.flowerId),
    })),
  }));
  return NextResponse.json({ orders: enriched });
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "consumer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await findUserById(session.userId);
  if (!user || user.role !== "consumer" || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { items?: Line[] };
  try {
    body = (await request.json()) as { items?: Line[] };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items = rawItems
    .map((i) => ({
      flowerId: typeof i.flowerId === "string" ? i.flowerId : "",
      quantity:
        typeof i.quantity === "number" && !Number.isNaN(i.quantity)
          ? i.quantity
          : 1,
    }))
    .filter((i) => i.flowerId.length > 0);
  if (items.length === 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }
  const catalog = await readFlowerCatalog();
  const ids = new Set(catalog.flowers.map((f) => f.id));
  for (const it of items) {
    if (!ids.has(it.flowerId)) {
      return NextResponse.json({ error: "invalid_flower" }, { status: 400 });
    }
  }
  const order = await createOrder({
    userId: user.id,
    userEmail: user.email,
    phoneSnapshot: user.phone ?? "",
    addressSnapshot: user.address ?? "",
    items,
  });
  return NextResponse.json({ order });
}
