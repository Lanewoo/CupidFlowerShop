import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { updateConsumerPassword } from "@/lib/users";

export const runtime = "nodejs";

type Body = {
  oldPassword?: string;
  newPassword?: string;
};

export async function POST(request: Request) {
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
  const oldPassword =
    typeof body.oldPassword === "string" ? body.oldPassword : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  try {
    const ok = await updateConsumerPassword(
      session.userId,
      oldPassword,
      newPassword,
    );
    if (!ok) {
      return NextResponse.json({ error: "bad_old_password" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "password_short") {
      return NextResponse.json({ error: "password_short" }, { status: 400 });
    }
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
