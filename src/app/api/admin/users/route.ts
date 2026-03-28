import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { listAllUsersPublic } from "@/lib/users";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession();
  if (!session || session.role !== "merchant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await listAllUsersPublic();
  return NextResponse.json({ users });
}
