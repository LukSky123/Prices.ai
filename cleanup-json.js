const fs = require('fs');

// Path to your original JSON file and output file
const filePath = './octoparse_data.json';  // Make sure the file path is correct
const outputFilePath = './cleaned_octoparse_data.json';

// Read the original JSON file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }

  console.log("Original file content:", data.slice(0, 200));  // Log the first 200 characters

  let parsedData;
  try {
    parsedData = JSON.parse(data);
  } catch (e) {
    console.error("Error parsing JSON:", e);
    return;
  }

  console.log("Parsed data:", parsedData.length, "items found.");

  // Clean up the Price field
  const cleanedData = parsedData.map(item => {
    if (item.Price) {
      console.log(`Cleaning Price for: ${item.Title}`);
      item.Price = item.Price.replace(/\n/g, '').trim();  // Remove newline and extra spaces
    }
    return item;
  });

  // Log the first 2 cleaned items for inspection
  console.log("Cleaned data sample:", cleanedData.slice(0, 2));

  // Write the cleaned data to a new file
  fs.writeFile(outputFilePath, JSON.stringify(cleanedData, null, 2), (err) => {
    if (err) {
      console.error("Error writing cleaned file:", err);
      return;
    }
    console.log(`Cleaned JSON saved to ${outputFilePath}`);
  });
});
