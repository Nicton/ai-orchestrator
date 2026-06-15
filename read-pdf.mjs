import { readFileSync } from 'fs';

// Use pdfjs-dist legacy ESM build for Node.js
import * as pdfjsLib from './node_modules/pdfjs-dist/legacy/build/pdf.mjs';

const filePath = 'c:\\Users\\Lenovo\\Desktop\\12devs\\shiptify\\slides\\2025 11 - Acc structure navigation - Google Slides.pdf';
const data = new Uint8Array(readFileSync(filePath));

const loadingTask = pdfjsLib.getDocument({ data });
const pdf = await loadingTask.promise;
console.log('Total pages:', pdf.numPages);

const maxPages = Math.min(pdf.numPages, 15);
for (let i = 1; i <= maxPages; i++) {
  const page = await pdf.getPage(i);
  const content = await page.getTextContent();
  const text = content.items.map(item => item.str).join(' ');
  console.log(`\n=== PAGE ${i} ===`);
  console.log(text);
}
