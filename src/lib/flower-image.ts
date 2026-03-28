import { publicFlowerPathToMediaUrl } from "@/lib/uploaded-flower-media";

/**
 * Image URL for next/image. Local uploads are served via /api/media/flowers/…
 * so they work behind nginx that proxies /api but not /uploads.
 * Legacy catalog paths /uploads/flowers/… are rewritten to the same route.
 */
export function flowerImageSrc(image: string): string {
  if (!image) return image;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    try {
      const u = new URL(image);
      const mapped = publicFlowerPathToMediaUrl(u.pathname);
      if (mapped) {
        return `${mapped}${u.search}`;
      }
      if (u.pathname.startsWith("/api/media/flowers/")) {
        return `${u.pathname}${u.search}`;
      }
    } catch {
      /* invalid URL */
    }
    return image;
  }

  if (image.startsWith("//")) return image;

  const withSlash = image.startsWith("/")
    ? image
    : `/${image.replace(/^\/+/, "")}`;

  const qIndex = withSlash.indexOf("?");
  const pathOnly = qIndex === -1 ? withSlash : withSlash.slice(0, qIndex);
  const query = qIndex === -1 ? "" : withSlash.slice(qIndex);

  const fromPublic = publicFlowerPathToMediaUrl(pathOnly);
  if (fromPublic) {
    return `${fromPublic}${query}`;
  }

  if (pathOnly.startsWith("/api/media/flowers/")) {
    return `${pathOnly}${query}`;
  }

  return withSlash;
}

/** Remote URLs and local uploads should skip the image optimizer. */
export function flowerImageUnoptimized(image: string): boolean {
  if (!image) return false;
  const src = flowerImageSrc(image);
  const remote = src.startsWith("http://") || src.startsWith("https://");
  const localUpload = src.startsWith("/api/media/flowers/");
  return remote || localUpload;
}
