import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ApiItem = {
  id: string;
  name: string;
  averagePrice: number;
  cheapestMarket: string;
  history: number[];
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // If Supabase isn't configured, fall back to static mock so the app still works
  if (!url || !key) {
    const fallback: ApiItem[] = [
      { id: "rice_50kg", name: "Rice 50kg", averagePrice: 47000, cheapestMarket: "Jumia", history: [45000, 46000, 47000] },
      { id: "beans_5kg", name: "Beans 5kg", averagePrice: 6200, cheapestMarket: "Konga", history: [6000, 6100, 6200] },
    ];
    return NextResponse.json(fallback);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const [{ data: items, error: itemsError }, { data: prices, error: pricesError }] = await Promise.all([
    supabase.from("items").select("id,name"),
    supabase
      .from("prices")
      .select("item_id, price, date_scraped, market:markets(name)")
      .order("date_scraped", { ascending: false }),
  ]);

  if (itemsError || pricesError) {
    // Graceful fallback to mock in case of query issues
    const fallback: ApiItem[] = [
      { id: "rice_50kg", name: "Rice 50kg", averagePrice: 47000, cheapestMarket: "Jumia", history: [45000, 46000, 47000] },
      { id: "beans_5kg", name: "Beans 5kg", averagePrice: 6200, cheapestMarket: "Konga", history: [6000, 6100, 6200] },
    ];
    return NextResponse.json(fallback);
  }

  const byItem = new Map<string, { name: string; prices: { price: number; date: string; marketName: string | null }[] }>();
  for (const it of items || []) {
    byItem.set(it.id, { name: it.name, prices: [] });
  }
  for (const p of (prices as any[]) || []) {
    const bucket = byItem.get(p.item_id);
    if (!bucket) continue;
    const market = p.market;
    const marketName = Array.isArray(market)
      ? (market[0]?.name ?? null)
      : (market?.name ?? null);
    bucket.prices.push({ price: Number(p.price), date: p.date_scraped, marketName });
  }

  const response: ApiItem[] = [];
  for (const [itemId, { name, prices }] of byItem.entries()) {
    if (prices.length === 0) continue;
    const avg = Math.round(prices.reduce((s, x) => s + x.price, 0) / prices.length);
    const cheapest = prices.reduce((min, x) => (x.price < min.price ? x : min), prices[0]);
    const history = prices
      .slice(0, 7)
      .reverse()
      .map((x) => x.price);

    response.push({
      id: itemId,
      name,
      averagePrice: avg,
      cheapestMarket: cheapest.marketName || "Unknown",
      history: history.length > 0 ? history : [avg],
    });
  }

  return NextResponse.json(response);
}
