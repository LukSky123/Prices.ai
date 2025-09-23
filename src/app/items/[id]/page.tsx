"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PriceChart } from "@/components/PriceChart";

type History = { date: string; price: number; market?: string }[];

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [history, setHistory] = useState<History>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/items/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load history for ${id}`);
        const json = await res.json();
        if (!cancelled) setHistory(json.history || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const chartData = useMemo(() => history.map((h) => ({ date: new Date(h.date).toLocaleDateString(), price: h.price })), [history]);

  return (
    <div className="space-y-6 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Item: {id}</h1>
        <Link href="/" className="text-sm text-blue-400 hover:underline">← Back</Link>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : history.length === 0 ? (
        <div className="text-slate-400">No data available</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <PriceChart data={chartData} />
            </div>
            <div className="card p-4">
              <div className="text-sm text-slate-300 mb-2">Recent Entries</div>
              <div className="space-y-2 max-h-64 overflow-auto pr-1">
                {history.slice(-10).reverse().map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <div className="text-xs text-slate-400">{new Date(h.date).toLocaleString()}</div>
                    <div className="text-sm font-semibold">₦{h.price.toLocaleString()}</div>
                    <div className="text-xs text-slate-400">{h.market || "Unknown"}</div>
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


