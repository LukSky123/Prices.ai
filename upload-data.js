const fs = require('fs');
const path = require('path');

// Upload script to send cleaned_octoparse_data.json to your API
async function uploadData() {
  try {
    // Read the JSON file
    const filePath = path.join(process.cwd(), 'cleaned_octoparse_data.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ File not found:', filePath);
      console.log('Make sure cleaned_octoparse_data.json is in your project root');
      return;
    }

    const jsonData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(jsonData);
    
    console.log(`📊 Found ${data.length} items to upload`);
    console.log('📤 Uploading to API...');

    // Send to your API
    const response = await fetch('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonData, // Send the raw JSON string
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Upload completed!');
    console.log(`📈 Results:`);
    console.log(`   Total items: ${result.totalItems}`);
    console.log(`   Processed: ${result.processed}`);
    console.log(`   Errors: ${result.errors}`);
    console.log(`   Skipped: ${result.skipped}`);
    
    if (result.errorDetails && result.errorDetails.length > 0) {
      console.log(`\n⚠️  First few errors:`);
      result.errorDetails.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Make sure your Next.js dev server is running (npm run dev)');
    }
  }
}

// Run the upload
uploadData();