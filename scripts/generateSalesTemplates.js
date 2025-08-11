const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Note: Removed dropdown validation to match purchase templates structure

// Generate Sales Pipe/Sheet Template
function generatePipeSheetTemplate() {
  const headers = [
    'Type',
    'Grade', 
    'Size',
    'Guage',
    'Pieces',
    'Weight',
    'Rate',
    'Margin',
    'GST'
  ];

  const sampleData = [
    {
      'Type': 'Pipe',
      'Grade': '304',
      'Size': '1/2"',
      'Guage': '18G',
      'Pieces': 10,
      'Weight': 50,
      'Rate': 120,
      'Margin': 18,  // Absolute margin value (₹18 per unit)
      'GST': 18
    },
    {
      'Type': 'Sheet',
      'Grade': '202',
      'Size': '4\'x8\'',
      'Guage': '16G',
      'Pieces': 5,
      'Weight': 100,
      'Rate': 150,
      'Margin': 30,  // Absolute margin value (₹30 per unit)
      'GST': 18
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sales Items');
  
  // Write the file
  const filePath = path.join(publicDir, 'Sales-Pipe_Sheet.xlsx');
  XLSX.writeFile(wb, filePath);
  console.log('Created:', filePath);
}

// Generate Sales Fitting Template - Match purchase template structure
function generateFittingTemplate() {
  const sampleData = [
    {
      'Sub Category': 'Elbow',
      'Type': '90 Degree',
      'Size': '1/2"',
      'Category': 'Threaded',
      'Pieces': 20,
      'Weight': 10,
      'Rate': 80,
      'Margin': 20,  // Absolute margin value (₹20 per unit)
      'GST': 18
    },
    {
      'Sub Category': 'Tee',
      'Type': 'Equal',
      'Size': '3/4"',
      'Category': 'Socket Weld',
      'Pieces': 15,
      'Weight': 8,
      'Rate': 100,
      'Margin': 20,  // Absolute margin value (₹20 per unit)
      'GST': 18
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Fitting Items');

  const filePath = path.join(publicDir, 'Sales-Fitting.xlsx');
  XLSX.writeFile(wb, filePath);
  console.log('Created:', filePath);
}

// Generate Sales Polish Items Template
function generatePolishTemplate() {
  const sampleData = [
    {
      'Sub Category': 'Polish Sheet',
      'Specification': 'Mirror Finish',
      'Pieces': 10,
      'Rate': 200,
      'Margin': 60,  // Absolute margin value (₹60 per unit)
      'GST': 18
    },
    {
      'Sub Category': 'Polish Pipe',
      'Specification': 'Satin Finish',
      'Pieces': 25,
      'Rate': 180,
      'Margin': 45,  // Absolute margin value (₹45 per unit)
      'GST': 18
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Polish Items');

  const filePath = path.join(publicDir, 'Sales-Polish Items.xlsx');
  XLSX.writeFile(wb, filePath);
  console.log('Created:', filePath);
}

// Generate all templates
console.log('Generating Sales Excel Templates...');
generatePipeSheetTemplate();
generateFittingTemplate();
generatePolishTemplate();
console.log('All templates generated successfully!');