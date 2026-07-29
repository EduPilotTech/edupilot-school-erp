// Splits students into per-A4-page groups for batch ID card printing. Extracted from page.tsx
// so the batching math (which directly drives id-card-batch-print.css's print layout) is
// independently testable without rendering the whole Server Component page.
export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
