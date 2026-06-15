import { readFileSync } from 'fs';
import * as pdfjsLib from './node_modules/pdfjs-dist/legacy/build/pdf.mjs';

const filePath = 'c:\\Users\\Lenovo\\Desktop\\12devs\\shiptify\\slides\\2025 11 - Acc structure navigation - Google Slides.pdf';
const data = new Uint8Array(readFileSync(filePath));

const loadingTask = pdfjsLib.getDocument({ data });
const pdf = await loadingTask.promise;
console.log('Total pages:', pdf.numPages);

// Get metadata
try {
  const meta = await pdf.getMetadata();
  console.log('Title:', meta.info?.Title);
  console.log('Subject:', meta.info?.Subject);
  console.log('Author:', meta.info?.Author);
} catch(e) {}

// Extract all text with positions
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const content = await page.getTextContent({ includeMarkedContent: true });
  console.log(`\n=== PAGE ${i} - All items ===`);
  for (const item of content.items) {
    if (item.str && item.str.trim()) {
      console.log(JSON.stringify(item.str));
    }
  }
  // Also check annotations
  const annots = await page.getAnnotations();
  if (annots.length > 0) {
    console.log(`Annotations on page ${i}:`, annots.length);
    annots.forEach(a => {
      if (a.contents || a.title) console.log('  Annot:', a.contents || a.title);
    });
  }
}
