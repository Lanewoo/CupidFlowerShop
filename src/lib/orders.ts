import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { Order, OrderLine, OrderStatus } from "./order-types";

export type { Order, OrderLine, OrderStatus };

type OrderStore = {
  orders: Order[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

async function readRaw(): Promise<OrderStore> {
  try {
    const raw = await fs.readFile(ORDERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as OrderStore;
    if (!parsed || !Array.isArray(parsed.orders)) return { orders: [] };
    return parsed;
  } catch {
    return { orders: [] };
  }
}

async function writeRaw(store: OrderStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ORDERS_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function listOrdersForUser(userId: string): Promise<Order[]> {
  const store = await readRaw();
  return store.orders
    .filter((o) => o.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function listAllOrders(): Promise<Order[]> {
  const store = await readRaw();
  return [...store.orders].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

export async function findOrderById(id: string): Promise<Order | null> {
  const store = await readRaw();
  return store.orders.find((o) => o.id === id) ?? null;
}

export async function createOrder(input: {
  userId: string;
  userEmail: string;
  phoneSnapshot: string;
  addressSnapshot: string;
  items: OrderLine[];
}): Promise<Order> {
  const store = await readRaw();
  const now = new Date().toISOString();
  const order: Order = {
    id: randomUUID(),
    userId: input.userId,
    userEmail: input.userEmail,
    phoneSnapshot: input.phoneSnapshot,
    addressSnapshot: input.addressSnapshot,
    items: input.items.map((i) => ({
      flowerId: i.flowerId,
      quantity: Math.max(1, Math.min(99, Math.floor(i.quantity)) || 1),
    })),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  store.orders.push(order);
  await writeRaw(store);
  return order;
}

export async function cancelOrderByUser(
  orderId: string,
  userId: string,
): Promise<Order | null> {
  const store = await readRaw();
  const idx = store.orders.findIndex(
    (o) => o.id === orderId && o.userId === userId,
  );
  if (idx < 0) return null;
  const o = store.orders[idx];
  if (o.status !== "pending") return null;
  store.orders[idx] = {
    ...o,
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  };
  await writeRaw(store);
  return store.orders[idx];
}
