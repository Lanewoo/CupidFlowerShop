import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { ensureUploadsDir } from "@/lib/flowers";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";

function looksLikeRasterImage(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8) return true;
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  )
    return true;
  if (buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP")
    return true;
  if (buf.slice(0, 3).toString("ascii") === "GIF") return true;
  return false;
}

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
  if (buffer.length === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (!looksLikeRasterImage(buffer)) {
    return NextResponse.json(
      { error: "Unsupported or invalid image (use JPG, PNG, GIF, or WebP)" },
      { status: 400 },
    );
  }
  const fullPath = path.join(uploadDir, filename);
  await fs.writeFile(fullPath, buffer);

  const publicPath = `/uploads/flowers/${filename}`;
  return NextResponse.json({ url: publicPath });
}
