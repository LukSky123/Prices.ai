const fs = require('fs');
const path = require('path');

// Configuration for different data sources and formats
const DATA_SOURCES = {
  supermart: {
    fields: {
      title: ['Title', 'title', 'name', 'product_name', 'item_name'],
      price: ['Price', 'price', 'cost', 'amount'],
      url: ['Title_URL', 'url', 'product_url', 'link', 'href']
    },
    priceFormat: /[₦â‚¦N]?[\s]*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+(?:\.[0-9]{2})?)/i,
    marketName: 'Supermart'
  },
  jumia: {
    fields: {
      title: ['Title', 'product_name', 'title', 'name'],
      price: ['prc', 'price', 'current_price', 'selling_price'],
      url: ['Title_URL', 'product_url', 'url', 'link']
    },
    priceFormat: /[₦â‚¦N]?[\s]*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)/i,
    marketName: 'Jumia'
  },
  konga: {
    fields: {
      title: ['name', 'product_name', 'title'],
      price: ['price', 'amount', 'cost'],
      url: ['url', 'product_link', 'href']
    },
    priceFormat: /[₦â‚¦N]?[\s]*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)/i,
    marketName: 'Konga'
  },
  generic: {
    fields: {
      title: ['Title', 'title', 'name', 'product', 'item', 'product_name', 'item_name'],
      price: ['prc', 'Price', 'price', 'cost', 'amount', 'value'],
      url: ['Title_URL', 'url', 'link', 'href', 'product_url', 'item_url']
    },
    priceFormat: /[₦â‚¦N$]?[\s]*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+(?:\.[0-9]{2})?)/i,
    marketName: 'Unknown'
  }
};

// Auto-detect data source based on file name or content
function detectDataSource(fileName, sampleData) {
  const lowerFileName = fileName.toLowerCase();
  
  // Check filename for source hints
  if (lowerFileName.includes('supermart')) return 'supermart';
  if (lowerFileName.includes('jumia')) return 'jumia';
  if (lowerFileName.includes('konga')) return 'konga';
  
  // Check data structure
  if (sampleData && sampleData.length > 0) {
    const firstItem = sampleData[0];
    const keys = Object.keys(firstItem).map(k => k.toLowerCase());
    
    // Supermart pattern
    if (keys.includes('title') && keys.includes('price') && keys.includes('title_url')) {
      return 'supermart';
    }
    
    // Jumia pattern
    if (keys.includes('title') && keys.includes('prc') && keys.includes('title_url')) {
      return 'jumia';
    }
    
    // Look for other patterns...
    if (keys.includes('product_name') && keys.includes('selling_price')) {
      return 'jumia';
    }
  }
  
  return 'generic';
}

// Flexible field mapper
function findField(item, possibleFields) {
  for (const field of possibleFields) {
    if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
      return item[field];
    }
  }
  return null;
}

// Enhanced price extractor with encoding fix
function extractPrice(priceString, priceFormat) {
  if (!priceString) return null;
  
  // Fix common encoding issues
  let cleanPriceString = priceString.toString()
    .replace(/â‚¦/g, '₦')  // Fix Unicode corruption
    .replace(/â€¹/g, '₦')   // Another common corruption
    .replace(/â‚¬/g, '₦')   // Euro symbol sometimes gets corrupted to naira
    .trim();
  
  const match = cleanPriceString.match(priceFormat);
  if (!match) {
    console.log(`⚠️  Could not extract price from: "${priceString}"`);
    return null;
  }
  
  const cleanPrice = match[1].replace(/,/g, '').replace(/\s/g, '');
  const numericPrice = parseFloat(cleanPrice);
  
  return isNaN(numericPrice) || numericPrice <= 0 ? null : numericPrice;
}

// Market name extractor (from URL or other hints)
function extractMarketName(item, defaultMarket, url) {
  // Try to extract from URL
  if (url) {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('jumia')) return 'Jumia';
    if (urlLower.includes('konga')) return 'Konga';
    if (urlLower.includes('supermart')) return 'Supermart';
    if (urlLower.includes('shoprite')) return 'Shoprite';
    if (urlLower.includes('spar')) return 'Spar';
  }
  
  // Check if market is specified in the item data
  if (item.market || item.store || item.shop) {
    return item.market || item.store || item.shop;
  }
  
  return defaultMarket;
}

// Main upload function with auto-detection
async function uploadFlexibleData(filePath, options = {}) {
  try {
    console.log(`📂 Reading file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const jsonData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(jsonData);
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data format. Expected non-empty array.');
    }

    console.log(`📊 Found ${data.length} items to process`);

    // Auto-detect data source
    const fileName = path.basename(filePath);
    const detectedSource = options.source || detectDataSource(fileName, data);
    const sourceConfig = DATA_SOURCES[detectedSource] || DATA_SOURCES.generic;
    
    console.log(`🔍 Detected source: ${detectedSource}`);
    console.log(`🏪 Default market: ${sourceConfig.marketName}`);

    // Show sample of what we found
    if (data.length > 0) {
      console.log(`📝 Sample item keys: ${Object.keys(data[0]).join(', ')}`);
    }

    // Process the data
    const processedData = [];
    let skippedCount = 0;

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      try {
        // Extract fields using flexible mapping
        const title = findField(item, sourceConfig.fields.title);
        const priceRaw = findField(item, sourceConfig.fields.price);
        const url = findField(item, sourceConfig.fields.url);
        
        if (!title) {
          console.log(`⚠️  Skipping item ${i + 1}: No title found`);
          skippedCount++;
          continue;
        }

        const price = extractPrice(priceRaw, sourceConfig.priceFormat);
        if (!price) {
          console.log(`⚠️  Skipping item ${i + 1}: Invalid price "${priceRaw}"`);
          skippedCount++;
          continue;
        }

        const market = extractMarketName(item, sourceConfig.marketName, url);

        processedData.push({
          Title: title,
          Price: `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
          Title_URL: url || '',
          Market: market,
          _originalIndex: i + 1
        });

        // Log first few successful items
        if (processedData.length <= 3) {
          console.log(`✅ Processed item ${i + 1}: ${title} - ₦${price.toLocaleString()} (${market})`);
        }

      } catch (error) {
        console.log(`⚠️  Error processing item ${i + 1}: ${error.message}`);
        skippedCount++;
      }
    }

    console.log(`✅ Successfully processed ${processedData.length} items`);
    console.log(`⚠️  Skipped ${skippedCount} items`);

    if (processedData.length === 0) {
      throw new Error('No valid items to upload after processing');
    }

    // Upload to API
    console.log('📤 Uploading to API...');
    const apiUrl = options.apiUrl || 'http://localhost:3000/api/scrape';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processedData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('\n🎉 Upload completed successfully!');
    console.log(`📈 Results:`);
    console.log(`   Source: ${detectedSource}`);
    console.log(`   Total items in file: ${data.length}`);
    console.log(`   Processed: ${processedData.length}`);
    console.log(`   Skipped during processing: ${skippedCount}`);
    console.log(`   Successfully uploaded: ${result.processed || 0}`);
    console.log(`   Upload errors: ${result.errors || 0}`);
    console.log(`   Database skipped: ${result.skipped || 0}`);
    
    if (result.errorDetails && result.errorDetails.length > 0) {
      console.log(`\n⚠️  First few upload errors:`);
      result.errorDetails.slice(0, 5).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    // Save processed data for inspection
    const processedFileName = `processed_${fileName}`;
    fs.writeFileSync(processedFileName, JSON.stringify(processedData, null, 2));
    console.log(`\n💾 Processed data saved to: ${processedFileName}`);

    return result;

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Make sure your Next.js dev server is running (npm run dev)');
    }
    
    throw error;
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node flexible-upload.js <file-path> [options]');
    console.log('');
    console.log('Examples:');
    console.log('  node flexible-upload.js data.json');
    console.log('  node flexible-upload.js supermart_data.json --source supermart');
    console.log('  node flexible-upload.js jumia_products.json --source jumia');
    console.log('');
    console.log('Supported sources: supermart, jumia, konga, generic');
    return;
  }

  const filePath = args[0];
  const options = {};
  
  // Parse command line options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--source' && i + 1 < args.length) {
      options.source = args[i + 1];
      i++;
    } else if (args[i] === '--api-url' && i + 1 < args.length) {
      options.apiUrl = args[i + 1];
      i++;
    }
  }

  await uploadFlexibleData(filePath, options);
}

// Export for use as module
module.exports = { uploadFlexibleData, DATA_SOURCES };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}