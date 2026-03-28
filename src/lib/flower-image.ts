/**
 * Normalize catalog image URLs for next/image and /public static files.
 * Strips host from absolute `/uploads/...` URLs so catalogs saved with
 * http://localhost:3000/uploads/... still work on the production domain.
 */
export function flowerImageSrc(image: string): string {
  if (!image) return image;
  if (image.startsWith("http://") || image.startsWith("https://")) {
    try {
      const u = new URL(image);
      if (u.pathname.startsWith("/uploads/")) {
        return `${u.pathname}${u.search}`;
      }
    } catch {
      /* invalid URL */
    }
    return image;
  }
  if (image.startsWith("//")) return image;
  if (image.startsWith("/")) return image;
  return `/${image.replace(/^\/+/, "")}`;
}

/** Remote URLs and local uploads should skip the image optimizer (Sharp / VPS edge cases). */
export function flowerImageUnoptimized(image: string): boolean {
  if (!image) return false;
  const src = flowerImageSrc(image);
  const remote = src.startsWith("http://") || src.startsWith("https://");
  const upload = src.startsWith("/uploads/");
  return remote || upload;
}
