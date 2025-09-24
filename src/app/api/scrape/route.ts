import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parsePriceLine } from "@/lib/aiParser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper function to extract numeric price from currency string
function extractPrice(priceString: string): number | null {
  if (!priceString) return null;
  
  // Remove currency symbol (₦), spaces, and extract numbers with commas
  const cleanPrice = priceString.replace(/[₦\s]/g, '').replace(/,/g, '');
  const numericPrice = parseFloat(cleanPrice);
  
  return isNaN(numericPrice) ? null : numericPrice;
}

// Helper function to clean and normalize item name
function normalizeItemName(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to extract unit from title (if any)
function extractUnit(title: string): string {
  const unitMatch = title.match(/\b(\d+\s?(?:kg|g|l|ml|pieces?|pcs?|pack))\b/i);
  return unitMatch ? unitMatch[1].toLowerCase().replace(/\s+/g, '') : '';
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Supabase env not configured" }, { status: 500 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  try {
    // Get the data from request body
    const data = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid data format. Expected array of items." }, { status: 400 });
    }

    console.log(`Processing ${data.length} items...`);

    let processedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Process each item from Octoparse data
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      try {
        // Validate required fields
        if (!item.Title || !item.Price) {
          skippedCount++;
          console.log(`Skipping item ${i + 1}: Missing title or price`);
          continue;
        }

        // Extract and validate price
        const price = extractPrice(item.Price);
        if (price === null || price <= 0) {
          skippedCount++;
          console.log(`Skipping item ${i + 1}: Invalid price "${item.Price}"`);
          continue;
        }

        // Normalize item name and extract unit
        const itemName = normalizeItemName(item.Title);
        const unit = extractUnit(item.Title);

        console.log(`Processing: ${itemName} - ₦${price} (${unit || 'no unit'})`);

        // 1. Upsert Item
        const { data: existingItems, error: itemSelectError } = await supabase
          .from("items")
          .select("id")
          .eq("name", itemName)
          .eq("unit", unit);

        if (itemSelectError) {
          throw new Error(`Item select error: ${itemSelectError.message}`);
        }

        let itemId: string;

        if (existingItems && existingItems.length > 0) {
          itemId = existingItems[0].id;
          console.log(`Found existing item: ${itemId}`);
        } else {
          // Create new item
          const { data: newItem, error: itemInsertError } = await supabase
            .from("items")
            .insert({
              name: itemName,
              unit: unit,
            })
            .select("id")
            .single();

          if (itemInsertError) {
            throw new Error(`Item insert error: ${itemInsertError.message}`);
          }

          itemId = newItem.id;
          console.log(`Created new item: ${itemId}`);
        }

        // 2. Upsert Market (assuming Supermart as default since URL suggests it)
        const marketName = "Supermart"; // You can extract this from URL if needed
        
        const { data: existingMarkets, error: marketSelectError } = await supabase
          .from("markets")
          .select("id")
          .eq("name", marketName);

        if (marketSelectError) {
          throw new Error(`Market select error: ${marketSelectError.message}`);
        }

        let marketId: string;

        if (existingMarkets && existingMarkets.length > 0) {
          marketId = existingMarkets[0].id;
        } else {
          // Create new market
          const { data: newMarket, error: marketInsertError } = await supabase
            .from("markets")
            .insert({
              name: marketName,
              url: "https://www.supermart.ng", // Default URL
            })
            .select("id")
            .single();

          if (marketInsertError) {
            throw new Error(`Market insert error: ${marketInsertError.message}`);
          }

          marketId = newMarket.id;
          console.log(`Created new market: ${marketId}`);
        }

        // 3. Insert Price
        const { error: priceInsertError } = await supabase
          .from("prices")
          .insert({
            item_id: itemId,
            market_id: marketId,
            price: price,
            date_scraped: new Date().toISOString(),
          });

        if (priceInsertError) {
          throw new Error(`Price insert error: ${priceInsertError.message}`);
        }

        processedCount++;
        console.log(`✓ Successfully processed item ${i + 1}/${data.length}`);

      } catch (error) {
        errorCount++;
        const errorMsg = `Item ${i + 1} (${item.Title}): ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`✗ ${errorMsg}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalItems: data.length,
      processed: processedCount,
      errors: errorCount,
      skipped: skippedCount,
      errorDetails: errors.slice(0, 10), // Return first 10 errors for debugging
    });

  } catch (error) {
    console.error("Fatal error:", error);
    return NextResponse.json({
      error: "Fatal error processing data",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET route to return sample data format for testing
export async function GET() {
  return NextResponse.json({
    message: "POST your Octoparse data here",
    expectedFormat: [
      {
        Title: "Golden Penny Spaghetti 500 g",
        Title_URL: "https://www.supermart.ng/products/golden-penny-spaghetti-500-g",
        Price: "₦1,295.00"
      }
    ]
  });
}