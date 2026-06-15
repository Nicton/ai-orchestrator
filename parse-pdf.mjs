import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('./node_modules/pdf-parse/dist/pdf-parse/cjs/index.cjs');

const dataBuffer = readFileSync('C:/Users/Lenovo/Desktop/12devs/shiptify/slides/2025 12 Account Structure _ Invoicing category - Google Slides.pdf');
const data = await pdfParse(dataBuffer);
console.log('Pages:', data.numpages);
console.log('--- TEXT ---');
console.log(data.text);
