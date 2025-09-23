export type Item = {
  id: string;
  name: string;
  averagePrice: number;
  cheapestMarket: string;
  history: number[];
};

export type Market = {
  id: string;
  name: string;
  url: string;
  prices: { itemId: string; price: number }[];
};

export async function fetchItems(): Promise<Item[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/prices`, { 
    cache: "no-store" 
  });
  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json();
}

export async function fetchItemById(id: string): Promise<Item | undefined> {
  const all = await fetchItems();
  return all.find((i) => i.id === id);
}

export async function fetchMarkets(): Promise<Market[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/markets`, { 
    cache: "no-store" 
  });
  if (!res.ok) throw new Error("Failed to fetch markets");
  return res.json();
}


export type PriceHistoryPoint = { date: string; price: number; market: string };

export const MOCK_PRICES: Record<string, PriceHistoryPoint[]> = {
  rice_50kg: [
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), price: 45000, market: "Jumia" },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), price: 46200, market: "Jumia" },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), price: 47200, market: "Konga" },
  ],
  beans_5kg: [
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), price: 6000, market: "Shoprite" },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), price: 6100, market: "Konga" },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), price: 6200, market: "Jumia" },
  ],
  yam_tuber: [
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), price: 1500, market: "Local Market" },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), price: 1700, market: "Local Market" },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), price: 1800, market: "Shoprite" },
  ],
  garri_5kg: [
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), price: 3000, market: "Local Market" },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), price: 3100, market: "Konga" },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), price: 3200, market: "Jumia" },
  ],
  vegetable_oil_3l: [
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), price: 4800, market: "Konga" },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), price: 5000, market: "Jumia" },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), price: 5200, market: "Spar" },
  ],
};


