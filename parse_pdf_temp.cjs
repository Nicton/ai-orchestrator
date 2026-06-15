const pdfParse = require('./node_modules/pdf-parse/dist/pdf-parse/cjs/index.cjs');
const fs = require('fs');
const buf = fs.readFileSync('C:/Users/Lenovo/Desktop/12devs/shiptify/slides/2026 02 - CSW Update (FreeTM+TM) - Google Slides.pdf');
const parse = pdfParse.default || pdfParse;
parse(buf).then(data => {
  console.log('Pages:', data.numpages);
  console.log('=== TEXT ===');
  console.log(data.text.slice(0, 15000));
}).catch(e => {
  console.error('Error:', e.message, e.stack);
});
