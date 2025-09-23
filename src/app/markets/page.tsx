import Link from "next/link";
import { fetchMarkets, fetchItems } from "@/lib/data";

export default async function MarketsPage() {
  const [markets, items] = await Promise.all([fetchMarkets(), fetchItems()]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Markets</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {markets.map((m) => (
          <div key={m.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{m.name}</h3>
                <Link href={m.url} className="text-xs text-blue-400 hover:underline" target="_blank" rel="noreferrer">Visit site ↗</Link>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {m.prices.map((p) => {
                const item = items.find((i) => i.id === p.itemId);
                if (!item) return null;
                return (
                  <div key={p.itemId} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <div className="text-sm">{item.name}</div>
                    <div className="text-sm font-semibold">₦{p.price.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


