import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Try pdfjs-dist
async function main() {
    const pdfjsLib = await import('./node_modules/pdfjs-dist/build/pdf.mjs');
    const data = new Uint8Array(readFileSync('c:\\Users\\Lenovo\\Desktop\\12devs\\shiptify\\slides\\2025 12 _ BUY AND SELL ACCOUNT - Google Slides.pdf'));
    
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    console.log('Num pages:', pdf.numPages);
    
    let allText = '';
    for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        allText += `\n--- PAGE ${i} ---\n${pageText}\n`;
    }
    console.log(allText.substring(0, 20000));
}
main().catch(e => console.error('Error:', e.message));
