export function paginate<T>(
  items: T[],
  page: number,
  size: number,
): { items: T[]; totalPages: number; outOfRange: boolean } {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const valid = Number.isInteger(page) && page >= 1 && page <= totalPages;
  if (!valid) return { items: [], totalPages, outOfRange: true };
  const start = (page - 1) * size;
  return { items: items.slice(start, start + size), totalPages, outOfRange: false };
}
