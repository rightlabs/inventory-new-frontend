const XlsxPopulate = require('xlsx-populate');
const path = require('path');

async function inspectTemplate(filename) {
  console.log(`\n=== Inspecting ${filename} ===`);

  const filePath = path.join(__dirname, '..', 'public', filename);
  const workbook = await XlsxPopulate.fromFileAsync(filePath);
  const sheet = workbook.sheet(0);

  // Get headers from row 1
  const headers = [];
  let col = 1;
  while (true) {
    const value = sheet.cell(1, col).value();
    if (!value) break;
    headers.push(value);
    col++;
  }
  console.log('Headers:', headers);

  // Get sample data from rows 2-3
  console.log('Sample data:');
  for (let row = 2; row <= 3; row++) {
    const rowData = [];
    for (let c = 1; c <= headers.length; c++) {
      rowData.push(sheet.cell(row, c).value());
    }
    console.log(`  Row ${row}:`, rowData);
  }

  // Check for data validations
  console.log('Data validations:');
  const columnLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let foundValidations = false;

  for (let c = 0; c < headers.length; c++) {
    const cellRef = `${columnLetters[c]}2`;
    const cell = sheet.cell(cellRef);
    const validation = cell.dataValidation();

    if (validation && validation.type === 'list') {
      foundValidations = true;
      const options = validation.formula1.replace(/^"|"$/g, '').split(',');
      console.log(`  Column ${columnLetters[c]} (${headers[c]}): ${options.length} options - ${options.slice(0, 5).join(', ')}${options.length > 5 ? '...' : ''}`);
    }
  }

  if (!foundValidations) {
    console.log('  No data validations found');
  }
}

async function inspectAll() {
  await inspectTemplate('Items-Pipe_Sheet.xlsx');
  await inspectTemplate('Items-Fitting.xlsx');
  await inspectTemplate('Items-Polish Items.xlsx');
  console.log('\n--- Sales Templates ---');
  await inspectTemplate('Sales-Pipe_Sheet.xlsx');
  await inspectTemplate('Sales-Fitting.xlsx');
  await inspectTemplate('Sales-Polish Items.xlsx');
}

inspectAll().catch(console.error);
