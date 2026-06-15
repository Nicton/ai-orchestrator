import { PDFParse } from './node_modules/pdf-parse/dist/pdf-parse/esm/index.js';
import { readFileSync } from 'fs';
const buf = readFileSync('C:/Users/Lenovo/Desktop/12devs/shiptify/slides/2026 02 - CSW Update (FreeTM+TM) - Google Slides.pdf');
const uint8 = new Uint8Array(buf);
const parser = new PDFParse({ data: uint8, verbosity: 0 });
// Get all text with page joiners for easier reading
const result = await parser.getText({ pageJoiner: '=== PAGE page_number / total_number ===' });
console.log(result.text);
