import { createRequire } from 'module';
import { readFileSync } from 'fs';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const pdfParser = new PDFParse();
const dataBuffer = readFileSync('c:\\Users\\Lenovo\\Desktop\\12devs\\shiptify\\slides\\2025 12 _ BUY AND SELL ACCOUNT - Google Slides.pdf');
pdfParser.parse(dataBuffer).then(data => {
    console.log('Pages:', data.numpages);
    console.log(data.text.substring(0, 15000));
}).catch(e => {
    console.error('error:', e.message);
    console.log('PDFParse methods:', Object.getOwnPropertyNames(PDFParse.prototype));
});
