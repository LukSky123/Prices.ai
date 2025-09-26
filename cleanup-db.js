const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' }); // Adjust if using .env instead

// Debug env
console.log('🔍 Loaded env:', {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ Supabase environment variables not found');
  console.log('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function analyzeDatabase() {
  console.log('🔍 Analyzing database...');

  try {
    // Get counts
    const [{ count: itemsCount }, { count: marketsCount }, { count: pricesCount }] = await Promise.all([
      supabase.from('items').select('*', { count: 'exact', head: true }),
      supabase.from('markets').select('*', { count: 'exact', head: true }),
      supabase.from('prices').select('*', { count: 'exact', head: true })
    ]);

    console.log(`📊 Database Stats:`);
    console.log(`   Items: ${itemsCount}`);
    console.log(`   Markets: ${marketsCount}`);
    console.log(`   Prices: ${pricesCount}`);

    // Check for duplicate items using SQL function
    const { data: duplicateItems, error: dupError } = await supabase.rpc('find_duplicate_items');
    if (dupError) throw dupError;

    if (duplicateItems && duplicateItems.length > 0) {
      console.log(`\n⚠️  Found ${duplicateItems.length} sets of duplicate items:`);
      duplicateItems.forEach(item => {
        console.log(`   - "${item.name}" (${item.unit}): ${item.count} duplicates`);
      });
    } else {
      console.log('\n✅ No duplicate items found');
    }

    // Check for items without prices
    const { data: itemsWithoutPrices, error: noPriceError } = await supabase
      .from('items')
      .select(`id, name, prices(id)`)
      .is('prices.id', null);

    if (noPriceError) throw noPriceError;

    if (itemsWithoutPrices && itemsWithoutPrices.length > 0) {
      console.log(`\n⚠️  Found ${itemsWithoutPrices.length} items without prices`);
    } else {
      console.log('\n✅ All items have prices');
    }

    // Recent upload activity
    const { data: recentPrices } = await supabase
      .from('prices')
      .select('date_scraped')
      .order('date_scraped', { ascending: false })
      .limit(10);

    if (recentPrices && recentPrices.length > 0) {
      console.log(`\n📅 Recent upload activity:`);
      const dates = [...new Set(recentPrices.map(p => new Date(p.date_scraped).toLocaleDateString()))];
      dates.forEach(date => {
        console.log(`   - ${date}`);
      });
    }

  } catch (error) {
    console.error('❌ Error analyzing database:', error.message);
  }
}

async function removeDuplicateItems() {
  console.log('🧹 Removing duplicate items...');

  try {
    const { data: duplicates } = await supabase.rpc('find_duplicate_items');

    if (!duplicates || duplicates.length === 0) {
      console.log('✅ No duplicates to remove');
      return;
    }

    let removedCount = 0;

    for (const group of duplicates) {
      const { data: items } = await supabase
        .from('items')
        .select('id')
        .eq('name', group.name)
        .eq('unit', group.unit)
        .order('created_at');

      if (items && items.length > 1) {
        const toKeep = items[0].id;
        const toRemove = items.slice(1).map(i => i.id);

        console.log(`   Keeping item ${toKeep} for "${group.name}", removing ${toRemove.length} duplicates`);

        for (const itemId of toRemove) {
          await supabase
            .from('prices')
            .update({ item_id: toKeep })
            .eq('item_id', itemId);
        }

        await supabase
          .from('items')
          .delete()
          .in('id', toRemove);

        removedCount += toRemove.length;
      }
    }

    console.log(`✅ Removed ${removedCount} duplicate items`);

  } catch (error) {
    console.error('❌ Error removing duplicates:', error.message);
  }
}

async function removeItemsWithoutPrices() {
    console.log('🧽 Removing items without prices...');
  
    try {
      // Select items where the related "prices" table is null
      const { data: itemsToRemove, error: selectError } = await supabase
        .from('items')
        .select('id, prices(id)')
        .is('prices.id', null);
  
      if (selectError) throw selectError;
  
      if (!itemsToRemove || itemsToRemove.length === 0) {
        console.log('✅ No items without prices to remove');
        return;
      }
  
      const ids = itemsToRemove.map(item => item.id);
      console.log(`⚠️  Removing ${ids.length} items without prices...`);
  
      // Batch delete if needed
    const delay = ms => new Promise(res => setTimeout(res, ms));
    const batchSize = 50;

    for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const { error: deleteError } = await supabase
            .from('items')
            .delete()
            .in('id', batch);
         if (deleteError) throw deleteError;

        await delay(200); // wait 200ms between batches
    }

      console.log(`✅ Removed ${ids.length} items without prices`);
  
    } catch (error) {
      console.error('❌ Error removing items without prices:', error.message || error);
    }
  }   

async function cleanupOrphanedRecords() {
  console.log('🧹 Cleaning up orphaned records...');

  try {
    // NOTE: This logic may need to be rewritten as Postgres subqueries in `.not()` don't always work
    console.log('✅ Skipping detailed orphan cleanup (use SQL instead)');
  } catch (error) {
    console.error('❌ Error cleaning orphaned records:', error.message);
  }
}

async function clearProcessedLog() {
  const fs = require('fs');
  const logPath = './processed-files.json';

  if (fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, JSON.stringify({ processed: [], failed: [] }, null, 2));
    console.log('✅ Cleared processed files log');
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log('Database Cleanup Tool\n');
    console.log('Usage:');
    console.log('  node cleanup-db.js [options]\n');
    console.log('Options:');
    console.log('  --analyze              Analyze database for issues');
    console.log('  --remove-duplicates    Remove duplicate items');
    console.log('  --remove-no-prices     Remove items without prices');
    console.log('  --cleanup-orphans      Remove orphaned records');
    console.log('  --clear-log            Clear processed files log');
    console.log('  --full-cleanup         Run all cleanup operations');
    console.log('  --help                 Show this help');
    return;
  }

  if (args.includes('--analyze') || args.length === 0) {
    await analyzeDatabase();
  }

  if (args.includes('--remove-duplicates') || args.includes('--full-cleanup')) {
    await removeDuplicateItems();
  }

  if (args.includes('--remove-no-prices') || args.includes('--full-cleanup')) {
    await removeItemsWithoutPrices();
  }

  if (args.includes('--cleanup-orphans') || args.includes('--full-cleanup')) {
    await cleanupOrphanedRecords();
  }

  if (args.includes('--clear-log') || args.includes('--full-cleanup')) {
    await clearProcessedLog();
  }

  if (args.includes('--full-cleanup')) {
    console.log('\n🎉 Full cleanup completed!');
    await analyzeDatabase();
  }
}

main().catch(console.error);
