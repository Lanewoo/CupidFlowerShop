import { NextResponse } from "next/server";
import { cancelOrderByUser } from "@/lib/orders";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await getServerSession();
  if (!session || session.role !== "consumer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const order = await cancelOrderByUser(id, session.userId);
  if (!order) {
    return NextResponse.json({ error: "not_found_or_locked" }, { status: 400 });
  }
  return NextResponse.json({ order });
}
