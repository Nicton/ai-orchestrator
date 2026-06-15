import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';

const filePath = process.argv[2];
const data = new Uint8Array(fs.readFileSync(filePath));
const doc = await getDocument({ data }).promise;
const numPages = doc.numPages;
console.log('NUM PAGES:', numPages);

for (let i = 1; i <= numPages; i++) {
  const page = await doc.getPage(i);
  const content = await page.getTextContent();
  const text = content.items.map(item => item.str).join(' ');
  console.log(`--- PAGE ${i} ---`);
  console.log(text);
  console.log();
}
