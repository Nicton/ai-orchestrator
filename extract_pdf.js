const fs = require('fs');
const pdfParse = require('pdf-parse');

const pdfFn = typeof pdfParse === 'function' ? pdfParse : pdfParse.default;

const dataBuffer = fs.readFileSync('c:\\Users\\Lenovo\\Desktop\\12devs\\shiptify\\slides\\2025 12 _ BUY AND SELL ACCOUNT - Google Slides.pdf');
pdfFn(dataBuffer).then(data => {
    console.log('Pages:', data.numpages);
    console.log(data.text.substring(0, 15000));
}).catch(e => console.error('error:', e.message));
