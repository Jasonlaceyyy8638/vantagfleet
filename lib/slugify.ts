/** URL-safe slug from title; ensures non-empty fallback. */
export function slugifyTitle(title: string, fallback = 'item'): string {
  const s = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return s.length > 0 ? s : fallback;
}
