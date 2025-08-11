const XLSX = require('xlsx');
const path = require('path');

function inspectTemplate(filename) {
  console.log(`\n=== Inspecting ${filename} ===`);
  
  const filePath = path.join(__dirname, '..', 'public', filename);
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // Get data
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  console.log('Headers:', jsonData[0]);
  console.log('Sample data:', jsonData.slice(1, 3));
  
  // Check for data validation
  if (worksheet['!dataValidation']) {
    console.log('Data validations found:');
    worksheet['!dataValidation'].forEach((validation, index) => {
      console.log(`  ${index + 1}. Range: ${validation.sqref}, Values: ${validation.formula1}`);
    });
  } else {
    console.log('No data validations found');
  }
}

// Inspect all purchase templates
inspectTemplate('Items-Pipe_Sheet.xlsx');
inspectTemplate('Items-Fitting.xlsx');
inspectTemplate('Items-Polish Items.xlsx');