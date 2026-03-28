import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { findUserById, toPublicUser } from "@/lib/users";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession();
  if (!session || session.role !== "consumer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await findUserById(session.userId);
  if (!user || user.role !== "consumer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user: toPublicUser(user) });
}
