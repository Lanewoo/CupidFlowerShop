import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { resolveUploadedFlowerPath } from "@/lib/uploaded-flower-media";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const fullPath = resolveUploadedFlowerPath(name);
  if (!fullPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buf = await fs.readFile(fullPath);
    const ext = path.extname(name).toLowerCase();
    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
            ? "image/gif"
            : "image/jpeg";

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
