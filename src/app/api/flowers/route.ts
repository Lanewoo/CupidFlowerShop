import { NextResponse } from "next/server";
import { readFlowerCatalog, writeFlowerCatalog } from "@/lib/flowers";
import { getServerSession } from "@/lib/session";
import type { FlowerCatalog } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const catalog = await readFlowerCatalog();
  return NextResponse.json(catalog);
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "merchant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !Array.isArray((body as FlowerCatalog).flowers)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const incoming = body as FlowerCatalog;
  await writeFlowerCatalog({
    updatedAt: incoming.updatedAt,
    flowers: incoming.flowers,
  });

  const saved = await readFlowerCatalog();
  return NextResponse.json(saved);
}
