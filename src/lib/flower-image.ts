/** Normalize catalog image URLs for next/image and /public static files. */
export function flowerImageSrc(image: string): string {
  if (!image) return image;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return image;
  return `/${image.replace(/^\/+/, "")}`;
}

/** Remote URLs and local uploads should skip the image optimizer (Sharp / VPS edge cases). */
export function flowerImageUnoptimized(image: string): boolean {
  if (!image) return false;
  const remote = image.startsWith("http://") || image.startsWith("https://");
  const upload =
    image.startsWith("/uploads/") || image.startsWith("uploads/");
  return remote || upload;
}
