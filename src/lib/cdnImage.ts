/**
 * Returns an optimized variant of a Supabase Storage public URL using the
 * built-in image transformation endpoint. Falls back to the original URL
 * for non-Supabase URLs or when transformation isn't applicable.
 *
 * Quality 80 is visually indistinguishable from the source for photos
 * while typically reducing file size by 70–90%. Width should match the
 * largest size the image is actually rendered at (CSS px * DPR).
 */
export const cdnImage = (
  url: string | null | undefined,
  opts: { width?: number; quality?: number } = {}
): string => {
  if (!url) return url ?? "";
  // Only transform Supabase Storage public URLs
  const marker = "/storage/v1/object/public/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const { width, quality = 80 } = opts;
  const base = url.slice(0, idx);
  const path = url.slice(idx + marker.length);

  const params = new URLSearchParams();
  if (width) params.set("width", String(Math.round(width)));
  params.set("quality", String(quality));
  // Let Supabase auto-pick the best format (WebP) based on Accept header
  params.set("format", "origin");

  return `${base}/storage/v1/render/image/public/${path}?${params.toString()}`;
};

/**
 * Build a srcSet string for responsive images.
 */
export const cdnSrcSet = (
  url: string | null | undefined,
  widths: number[],
  quality = 80
): string | undefined => {
  if (!url) return undefined;
  if (url.indexOf("/storage/v1/object/public/") === -1) return undefined;
  return widths
    .map((w) => `${cdnImage(url, { width: w, quality })} ${w}w`)
    .join(", ");
};