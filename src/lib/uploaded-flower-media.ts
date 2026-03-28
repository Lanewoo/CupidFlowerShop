import path from "path";

/** Filenames produced by POST /api/upload (UUID + safe ext). */
export const UPLOADED_FLOWER_FILENAME_RE =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(jpg|jpeg|png|gif|webp)$/i;

const PUBLIC_PREFIX = "/uploads/flowers/";
const MEDIA_PREFIX = "/api/media/flowers/";

export function flowerFilenameToMediaUrl(filename: string): string {
  return `${MEDIA_PREFIX}${filename}`;
}

/** Map legacy public path to API route (works when nginx proxies /api but not /uploads). */
export function publicFlowerPathToMediaUrl(pathname: string): string | null {
  if (!pathname.startsWith(PUBLIC_PREFIX)) return null;
  const name = pathname.slice(PUBLIC_PREFIX.length);
  if (!name || name.includes("/") || name.includes("..")) return null;
  if (!UPLOADED_FLOWER_FILENAME_RE.test(name)) return null;
  return `${MEDIA_PREFIX}${name}`;
}

export function resolveUploadedFlowerPath(filename: string): string | null {
  if (!UPLOADED_FLOWER_FILENAME_RE.test(filename)) return null;
  const dir = path.join(process.cwd(), "public", "uploads", "flowers");
  const full = path.join(dir, filename);
  const resolvedDir = path.resolve(dir);
  const resolvedFull = path.resolve(full);
  if (!resolvedFull.startsWith(resolvedDir + path.sep) && resolvedFull !== resolvedDir) {
    return null;
  }
  return resolvedFull;
}
