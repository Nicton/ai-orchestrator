import { readFileSync } from 'fs';

async function main() {
    const pdfjsLib = await import('./node_modules/pdfjs-dist/legacy/build/pdf.mjs');
    const data = new Uint8Array(readFileSync('c:\\Users\\Lenovo\\Desktop\\12devs\\shiptify\\slides\\2025 12 _ BUY AND SELL ACCOUNT - Google Slides.pdf'));
    
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    let allText = '';
    for (let i = 26; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        allText += `\n--- PAGE ${i} ---\n${pageText}\n`;
    }
    console.log(allText.substring(0, 25000));
}
main().catch(e => console.error('Error:', e.message));
