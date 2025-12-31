const XlsxPopulate = require('xlsx-populate');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Fitting subcategories list
const fittingSubCategories = [
  'ball', 'ball_with_nut', 'base', 'thali_base', 'cap', 'bush',
  'l_drop', 'stopper', 'd_lock', 'hinges', 'balustred_cap', 'baluster',
  'master_pillar', 'starwindow', 'butterfly', 'gamla', 'step', 'baind',
  'star_ring', 'ring', 'bhala', 'braket', 'ground_braket', 'om',
  'swastik', 'shubh_labh', 'mel_femel_nut', 'flower', 'bail',
  'gate_wheel', 'gate_opener'
];

// Generate Purchase Pipe/Sheet Template
async function generatePipeSheetTemplate() {
  const workbook = await XlsxPopulate.fromBlankAsync();
  const sheet = workbook.sheet(0).name('Pipe Sheet Items');

  // Headers
  const headers = ['Type', 'Grade', 'Size', 'Guage', 'Pieces', 'Weight', 'Rate', 'Margin (%)'];
  headers.forEach((header, i) => {
    sheet.cell(1, i + 1).value(header).style({ bold: true });
  });

  // Sample data row 1
  sheet.cell(2, 1).value('Pipe');
  sheet.cell(2, 2).value('304');
  sheet.cell(2, 3).value('1/2"');
  sheet.cell(2, 4).value('18G');
  sheet.cell(2, 5).value(10);
  sheet.cell(2, 6).value(50);
  sheet.cell(2, 7).value(120);
  sheet.cell(2, 8).value(10);

  // Sample data row 2
  sheet.cell(3, 1).value('Sheet');
  sheet.cell(3, 2).value('202');
  sheet.cell(3, 3).value("4'x8'");
  sheet.cell(3, 4).value('16G');
  sheet.cell(3, 5).value(5);
  sheet.cell(3, 6).value(100);
  sheet.cell(3, 7).value(150);
  sheet.cell(3, 8).value(12);

  // Add dropdown validations for rows 2-1000
  // Column A = Type (Pipe, Sheet)
  sheet.range('A2:A1000').dataValidation({
    type: 'list',
    allowBlank: true,
    formula1: '"Pipe,Sheet"'
  });

  // Column B = Grade (304, 202)
  sheet.range('B2:B1000').dataValidation({
    type: 'list',
    allowBlank: true,
    formula1: '"304,202"'
  });

  // Column D = Guage (None, 16G, 14G, 18G, 20G)
  sheet.range('D2:D1000').dataValidation({
    type: 'list',
    allowBlank: true,
    formula1: '"None,16G,14G,18G,20G"'
  });

  const filePath = path.join(publicDir, 'Items-Pipe_Sheet.xlsx');
  await workbook.toFileAsync(filePath);
  console.log('Created:', filePath);
}

// Generate Purchase Fitting Template
async function generateFittingTemplate() {
  const workbook = await XlsxPopulate.fromBlankAsync();
  const sheet = workbook.sheet(0).name('Fitting Items');

  // Headers
  const headers = ['Sub Category', 'Type', 'Size', 'Grade', 'Pieces', 'Weight', 'Rate', 'Margin (%)'];
  headers.forEach((header, i) => {
    sheet.cell(1, i + 1).value(header).style({ bold: true });
  });

  // Sample data row 1
  sheet.cell(2, 1).value('ball');
  sheet.cell(2, 2).value('Round');
  sheet.cell(2, 3).value('1/2"');
  sheet.cell(2, 4).value('304');
  sheet.cell(2, 5).value(20);
  sheet.cell(2, 6).value(10);
  sheet.cell(2, 7).value(80);
  sheet.cell(2, 8).value(15);

  // Sample data row 2
  sheet.cell(3, 1).value('bush');
  sheet.cell(3, 2).value('Square');
  sheet.cell(3, 3).value('3/4"');
  sheet.cell(3, 4).value('202');
  sheet.cell(3, 5).value(15);
  sheet.cell(3, 6).value(8);
  sheet.cell(3, 7).value(100);
  sheet.cell(3, 8).value(15);

  // Add dropdown validations
  // Column A = Sub Category
  sheet.range('A2:A1000').dataValidation({
    type: 'list',
    allowBlank: true,
    formula1: `"${fittingSubCategories.join(',')}"`
  });

  // Column B = Type (Round, Square)
  sheet.range('B2:B1000').dataValidation({
    type: 'list',
    allowBlank: true,
    formula1: '"Round,Square"'
  });

  // Column D = Grade (304, 202)
  sheet.range('D2:D1000').dataValidation({
    type: 'list',
    allowBlank: true,
    formula1: '"304,202"'
  });

  const filePath = path.join(publicDir, 'Items-Fitting.xlsx');
  await workbook.toFileAsync(filePath);
  console.log('Created:', filePath);
}

// Polish subcategories list
const polishSubCategories = [
  'Flap Disc', 'Non Woven Pad', 'Felt buff Pad', 'Cutting Blade',
  'Welding Rod', 'Polish', 'Grinding Wheel', 'Core Bit'
];

// Generate Purchase Polish Items Template
async function generatePolishTemplate() {
  const workbook = await XlsxPopulate.fromBlankAsync();
  const sheet = workbook.sheet(0).name('Polish Items');

  // Headers (no Variant column - matching original template)
  const headers = ['Sub Category', 'Specification', 'Pieces', 'Rate', 'Margin (%)'];
  headers.forEach((header, i) => {
    sheet.cell(1, i + 1).value(header).style({ bold: true });
  });

  // Sample data row 1
  sheet.cell(2, 1).value('Flap Disc');
  sheet.cell(2, 2).value('4 inch');
  sheet.cell(2, 3).value(10);
  sheet.cell(2, 4).value(200);
  sheet.cell(2, 5).value(20);

  // Sample data row 2
  sheet.cell(3, 1).value('Cutting Blade');
  sheet.cell(3, 2).value('14 inch');
  sheet.cell(3, 3).value(25);
  sheet.cell(3, 4).value(180);
  sheet.cell(3, 5).value(18);

  // Add dropdown validations
  // Column A = Sub Category
  sheet.range('A2:A1000').dataValidation({
    type: 'list',
    allowBlank: true,
    formula1: `"${polishSubCategories.join(',')}"`
  });

  const filePath = path.join(publicDir, 'Items-Polish Items.xlsx');
  await workbook.toFileAsync(filePath);
  console.log('Created:', filePath);
}

// Generate all templates
async function generateAll() {
  console.log('Generating Purchase Excel Templates (with dropdowns, without GST)...');
  await generatePipeSheetTemplate();
  await generateFittingTemplate();
  await generatePolishTemplate();
  console.log('All purchase templates generated successfully!');
}

generateAll().catch(console.error);
