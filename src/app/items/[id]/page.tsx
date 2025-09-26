"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PriceChart } from "@/components/PriceChart";

type History = { date: string; price: number; market?: string }[];
type ItemData = {
  source: string;
  history: History;
  itemName?: string; // We'll add this
};

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [itemData, setItemData] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    async function fetchItemData() {
      if (!id) return;
      setLoading(true);
      setError(null);
      
      try {
        // Fetch item history
        const historyRes = await fetch(`/api/items/${id}`, { cache: "no-store" });
        if (!historyRes.ok) throw new Error(`Failed to load history for ${id}`);
        const historyData = await historyRes.json();

        // Fetch all items to get the name
        const itemsRes = await fetch(`/api/prices`, { cache: "no-store" });
        if (!itemsRes.ok) throw new Error('Failed to fetch items');
        const itemsData = await itemsRes.json();
        
        // Find the current item to get its name
        const currentItem = itemsData.find((item: any) => item.id === id);
        const itemName = currentItem ? currentItem.name : id; // Fallback to ID if not found

        if (!cancelled) {
          setItemData({
            source: historyData.source,
            history: historyData.history || [],
            itemName: itemName
          });
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    
    fetchItemData();
    
    return () => {
      cancelled = true;
    };
  }, [id]);

  const chartData = useMemo(() => {
    if (!itemData?.history) return [];
    return itemData.history.map((h) => ({ 
      date: new Date(h.date).toLocaleDateString(), 
      price: h.price 
    }));
  }, [itemData?.history]);

  // Calculate some stats
  const stats = useMemo(() => {
    if (!itemData?.history || itemData.history.length === 0) return null;
    
    const prices = itemData.history.map(h => h.price);
    const currentPrice = prices[prices.length - 1];
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return {
      current: currentPrice,
      average: Math.round(avgPrice),
      min: minPrice,
      max: maxPrice,
      totalEntries: itemData.history.length
    };
  }, [itemData?.history]);

  return (
    <div className="space-y-6 px-4">
      <div className="flex items-center justify-between">
        <div>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-slate-700 rounded w-64 mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-32"></div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-white">
                {itemData?.itemName || 'Unknown Item'}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {stats && `${stats.totalEntries} price entries • Source: ${itemData?.source}`}
              </p>
            </>
          )}
        </div>
        <Link href="/" className="text-sm text-blue-400 hover:underline">← Back</Link>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : error ? (
        <div className="text-red-400">
          <p>{error}</p>
          <Link href="/" className="text-blue-400 hover:underline text-sm mt-2 inline-block">
            ← Go back to dashboard
          </Link>
        </div>
      ) : !itemData?.history || itemData.history.length === 0 ? (
        <div className="text-slate-400">
          <p>No price data available for this item</p>
          <Link href="/" className="text-blue-400 hover:underline text-sm mt-2 inline-block">
            ← Go back to dashboard
          </Link>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">₦{stats.current.toLocaleString()}</div>
                <div className="text-xs text-slate-400">Current Price</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">₦{stats.average.toLocaleString()}</div>
                <div className="text-xs text-slate-400">Average Price</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-400">₦{stats.min.toLocaleString()}</div>
                <div className="text-xs text-slate-400">Lowest Price</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-400">₦{stats.max.toLocaleString()}</div>
                <div className="text-xs text-slate-400">Highest Price</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <PriceChart data={chartData} />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-sm text-slate-300 mb-4 font-semibold">Recent Entries</div>
              <div className="space-y-2 max-h-64 overflow-auto pr-1">
                {itemData.history.slice(-10).reverse().map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <div className="flex flex-col">
                      <div className="text-sm font-semibold text-white">₦{h.price.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">{h.market || "Unknown"}</div>
                    </div>
                    <div className="text-xs text-slate-400 text-right">
                      {new Date(h.date).toLocaleDateString()}
                      <br />
                      {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}