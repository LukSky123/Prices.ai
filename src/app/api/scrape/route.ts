import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { parsePriceLine } from "@/lib/aiParser";

// Set up Supabase client
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Supabase env not configured");
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Read the JSON file
function readJSONFile() {
  const filePath = path.join(process.cwd(), "cleaned_octoparse_data.json");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContent);
}

// Main POST handler to push JSON data to Supabase
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Supabase env not configured" }, { status: 500 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Get the data (from the Octoparse JSON file)
  const data = await request.json(); // JSON from Octoparse

  if (!data || !Array.isArray(data)) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  // Parse each item in the JSON data
  const parsed = data.map((item) => {
    const line = `${item.Title} ${item.Price}`;
    return parsePriceLine(line);
  }).filter((p) => !!p);

  let upsertedItems = 0;
  let upsertedMarkets = 0;
  let insertedPrices = 0;

  for (const p of parsed) {
    // 1. Upsert Items
    const { data: foundItems } = await supabase
      .from("items")
      .select("id")
      .eq("name", p.item)
      .eq("unit", p.unit || "");

    let itemId = foundItems?.[0]?.id as string | undefined;
    if (!itemId) {
      // Insert new item
      const { data: newItem } = await supabase
        .from("items")
        .insert({
          name: p.item, // Use p.item (parsed item name)
          unit: p.unit || "",
          item_url: item.Title_URL // Correct usage of p (instead of item)
        })
        .select("id")
        .single();
      itemId = newItem?.id as string | undefined;
      if (itemId) upsertedItems += 1;
    }
    if (!itemId) continue; // If item insertion fails, skip this entry

    // 2. Upsert Markets
    const marketName = p.market || "Supermart"; // Default market name is Supermart
    const { data: foundMarkets } = await supabase
      .from("markets")
      .select("id")
      .eq("name", marketName);

    let marketId = foundMarkets?.[0]?.id as string | undefined;
    if (!marketId) {
      const { data: newMarket } = await supabase
        .from("markets")
        .insert({ name: marketName, url: "" })
        .select("id")
        .single();
      marketId = newMarket?.id as string | undefined;
      if (marketId) upsertedMarkets += 1;
    }
    if (!marketId) continue; // If market insertion fails, skip this entry

    // 3. Insert Prices with current timestamp as date_scraped
    const { error: priceError } = await supabase
      .from("prices")
      .insert({
        item_id: itemId, // Use itemId from above
        market_id: marketId,
        price: p.price,
        date_scraped: new Date().toISOString(), // Insert current timestamp as `date_scraped`
      });

    if (!priceError) insertedPrices += 1;
  }

  return NextResponse.json({
    totalItems: data.length,
    parsed: parsed.length,
    upsertedItems,
    upsertedMarkets,
    insertedPrices,
  });
}
