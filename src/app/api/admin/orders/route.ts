import { NextResponse } from "next/server";
import { listAllOrders } from "@/lib/orders";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession();
  if (!session || session.role !== "merchant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orders = await listAllOrders();
  return NextResponse.json({ orders });
}
