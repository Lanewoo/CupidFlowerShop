import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { ensureUploadsDir } from "@/lib/flowers";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "merchant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const uploadDir = ensureUploadsDir();
  await fs.mkdir(uploadDir, { recursive: true });

  const original =
    typeof (file as File).name === "string" ? (file as File).name : "image";
  const ext = path.extname(original) || ".jpg";
  const safeExt = ext.match(/^\.\w{2,5}$/) ? ext : ".jpg";
  const filename = `${randomUUID()}${safeExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const fullPath = path.join(uploadDir, filename);
  await fs.writeFile(fullPath, buffer);

  const publicPath = `/uploads/flowers/${filename}`;
  return NextResponse.json({ url: publicPath });
}
