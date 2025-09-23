export type ParsedPrice = {
  item: string;
  unit: string | null;
  price: number;
  market: string | null;
};

// Attempts to parse strings like:
// "Golden Penny Rice 50kg - ₦47,200 (Jumia)"
// "Rice Bag 50kg  ₦46,800  (Konga)"
// "Honey Beans 5kg — N6,150  (Shoprite)"
// "BEANS 5KG  ₦6,050(Konga)"
// "Tomato 1kg :  ₦1,200  (Local Market)"
export function parsePriceLine(line: any): ParsedPrice | null {
  // Ensure `line` is a string
  if (typeof line !== 'string') {
    console.error('Expected a string, but got:', typeof line, line);
    return null; // Return null if `line` isn't a string
  }

  const text = line.trim();

  const marketMatch = text.match(/\(([^)]+)\)\s*$/);
  const market = marketMatch ? marketMatch[1].trim() : null;

  // Extract price: variants ₦47,200, N6,150, 1200, etc.
  const priceMatch = text.match(/[₦N]?[\s]*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(?:\b)/i);
  if (!priceMatch) return null;
  const price = Number(priceMatch[1].replace(/,/g, ""));

  // Region before price likely contains item + unit
  const beforePrice = text.slice(0, priceMatch.index ?? 0).trim();

  // Common unit patterns
  const unitMatch = beforePrice.match(/\b(\d+\s?(?:kg|g|l|ml|tuber|bag))\b/i);
  const unit = unitMatch ? unitMatch[1].replace(/\s+/g, "").toLowerCase() : null;

  let item = beforePrice
    .replace(/[-—:]+\s*$/g, "")
    .replace(/\b(\d+\s?(?:kg|g|l|ml|tuber|bag))\b/i, "")
    .replace(/\b(bag|tuber)\b/gi, "")
    .replace(/[_–—-]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Clean up casing for item
  if (item) {
    item = item
      .toLowerCase()
      .replace(/\b\w/g, (m) => m.toUpperCase())
      .replace(/\bAnd\b/g, "and");
  }

  // Fallback: if item empty, try grabbing leading words before unit/price
  if (!item) {
    const alt = text.split(/[—:-]/)[0];
    item = alt.replace(/\b(\d+\s?(?:kg|g|l|ml|tuber|bag))\b/i, "").trim();
  }

  if (!item) return null;

  return { item, unit, price, market };
}
