import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MOCK_PRICES } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HistoryPoint = { date: string; price: number; market: string };
type ApiResponse = { source: "supabase" | "mock"; history: HistoryPoint[] };

export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const { id } = ctx.params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && key) {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      // Query from prices joined with markets to get market name
      const { data, error } = await supabase
        .from("prices")
        .select("date_scraped, price, market:markets(name)")
        .eq("item_id", id)
        .order("date_scraped", { ascending: true });

      if (!error && data && data.length > 0) {
        const history: HistoryPoint[] = (data as any[]).map((row: any) => ({
          date: new Date(row.date_scraped).toISOString(),
          price: Number(row.price),
          market: (Array.isArray(row.market) ? row.market[0]?.name : row.market?.name) ?? "Unknown",
        }));
        const res: ApiResponse = { source: "supabase", history };
        return NextResponse.json(res);
      }
    } catch (_e) {
      // fall through to mock
    }
  }

  const mock = MOCK_PRICES[id] ?? [];
  const res: ApiResponse = { source: "mock", history: mock };
  return NextResponse.json(res);
}


