import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { updateConsumerProfile } from "@/lib/users";

export const runtime = "nodejs";

type Body = {
  phone?: string;
  address?: string;
};

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "consumer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const phone = typeof body.phone === "string" ? body.phone : "";
  const address = typeof body.address === "string" ? body.address : "";
  if (!phone || !address) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  try {
    const user = await updateConsumerProfile(session.userId, phone, address);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { passwordHash: _, ...pub } = user;
    return NextResponse.json({ user: pub });
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "invalid_phone" || code === "invalid_address") {
      return NextResponse.json({ error: code }, { status: 400 });
    }
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
