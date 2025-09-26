const fs = require('fs');
const path = require('path');
const { uploadFlexibleData } = require('./flexible-upload');

// Configuration for batch processing
const BATCH_CONFIG = {
  dataDirectory: './scraped-data', // Directory containing JSON files
  filePattern: /\.json$/i, // Only process JSON files
  concurrent: 2, // Process 2 files at a time to avoid overwhelming the API
  retryFailed: true,
  skipExisting: false // Set to true to skip files that have been processed before
};

// Track processed files
const PROCESSED_LOG = './processed-files.json';

function loadProcessedLog() {
  try {
    if (fs.existsSync(PROCESSED_LOG)) {
      return JSON.parse(fs.readFileSync(PROCESSED_LOG, 'utf-8'));
    }
  } catch (e) {
    console.warn('Could not load processed log, starting fresh');
  }
  return { processed: [], failed: [] };
}

function saveProcessedLog(log) {
  fs.writeFileSync(PROCESSED_LOG, JSON.stringify(log, null, 2));
}

// Sleep function for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function batchUpload(options = {}) {
  const config = { ...BATCH_CONFIG, ...options };
  const processedLog = loadProcessedLog();
  
  console.log(`🚀 Starting batch upload from: ${config.dataDirectory}`);
  
  if (!fs.existsSync(config.dataDirectory)) {
    throw new Error(`Data directory not found: ${config.dataDirectory}`);
  }

  // Get all JSON files in the directory
  const allFiles = fs.readdirSync(config.dataDirectory)
    .filter(file => config.filePattern.test(file))
    .map(file => path.join(config.dataDirectory, file));

  // Filter out already processed files if skipExisting is true
  let filesToProcess = allFiles;
  if (config.skipExisting) {
    filesToProcess = allFiles.filter(file => 
      !processedLog.processed.some(p => p.file === file)
    );
  }

  console.log(`📁 Found ${allFiles.length} JSON files`);
  console.log(`📋 Will process ${filesToProcess.length} files`);

  if (filesToProcess.length === 0) {
    console.log('✅ No files to process');
    return;
  }

  // Process files in batches
  const results = [];
  const failed = [];

  for (let i = 0; i < filesToProcess.length; i += config.concurrent) {
    const batch = filesToProcess.slice(i, i + config.concurrent);
    
    console.log(`\n📦 Processing batch ${Math.floor(i / config.concurrent) + 1}/${Math.ceil(filesToProcess.length / config.concurrent)}`);
    
    const batchPromises = batch.map(async (filePath, index) => {
      const fileName = path.basename(filePath);
      console.log(`  ${i + index + 1}/${filesToProcess.length} Processing: ${fileName}`);
      
      try {
        const result = await uploadFlexibleData(filePath);
        
        const processResult = {
          file: filePath,
          fileName: fileName,
          timestamp: new Date().toISOString(),
          success: true,
          processed: result.processed,
          errors: result.errors,
          skipped: result.skipped
        };
        
        results.push(processResult);
        processedLog.processed.push(processResult);
        
        console.log(`  ✅ ${fileName}: ${result.processed} items uploaded`);
        return processResult;
        
      } catch (error) {
        const failResult = {
          file: filePath,
          fileName: fileName,
          timestamp: new Date().toISOString(),
          success: false,
          error: error.message
        };
        
        failed.push(failResult);
        processedLog.failed.push(failResult);
        
        console.log(`  ❌ ${fileName}: ${error.message}`);
        return failResult;
      }
    });

    // Wait for current batch to complete
    await Promise.all(batchPromises);
    
    // Save progress after each batch
    saveProcessedLog(processedLog);
    
    // Rate limiting - wait between batches
    if (i + config.concurrent < filesToProcess.length) {
      console.log('  ⏳ Waiting 2 seconds before next batch...');
      await sleep(2000);
    }
  }

  // Final summary
  console.log('\n🏁 Batch upload completed!');
  console.log(`📊 Summary:`);
  console.log(`   Total files processed: ${results.length + failed.length}`);
  console.log(`   Successful: ${results.length}`);
  console.log(`   Failed: ${failed.length}`);
  
  if (results.length > 0) {
    const totalItems = results.reduce((sum, r) => sum + (r.processed || 0), 0);
    console.log(`   Total items uploaded: ${totalItems.toLocaleString()}`);
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed files:`);
    failed.forEach(f => {
      console.log(`   - ${f.fileName}: ${f.error}`);
    });
    
    if (config.retryFailed) {
      console.log(`\n🔄 To retry failed files, run:`);
      console.log(`   node batch-upload.js --retry`);
    }
  }

  console.log(`\n📝 Full log saved to: ${PROCESSED_LOG}`);
  return { results, failed };
}

// Retry failed uploads
async function retryFailed(options = {}) {
  const config = { ...BATCH_CONFIG, ...options };
  const processedLog = loadProcessedLog();
  
  if (processedLog.failed.length === 0) {
    console.log('✅ No failed files to retry');
    return;
  }

  console.log(`🔄 Retrying ${processedLog.failed.length} failed files...`);
  
  const filesToRetry = processedLog.failed.map(f => f.file);
  
  // Clear failed list and retry
  processedLog.failed = [];
  saveProcessedLog(processedLog);
  
  await batchUpload({ ...config, skipExisting: false });
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--directory' && i + 1 < args.length) {
      options.dataDirectory = args[i + 1];
      i++;
    } else if (args[i] === '--concurrent' && i + 1 < args.length) {
      options.concurrent = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--retry') {
      return await retryFailed(options);
    } else if (args[i] === '--skip-existing') {
      options.skipExisting = true;
    }
  }

  if (args.includes('--help')) {
    console.log('Batch Upload Tool');
    console.log('');
    console.log('Usage:');
    console.log('  node batch-upload.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --directory <path>    Directory containing JSON files (default: ./scraped-data)');
    console.log('  --concurrent <num>    Number of files to process simultaneously (default: 2)');
    console.log('  --skip-existing       Skip files that have been processed before');
    console.log('  --retry               Retry previously failed files');
    console.log('  --help                Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  node batch-upload.js');
    console.log('  node batch-upload.js --directory ./new-data --concurrent 3');
    console.log('  node batch-upload.js --retry');
    return;
  }

  await batchUpload(options);
}

// Export for use as module
module.exports = { batchUpload, retryFailed };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}