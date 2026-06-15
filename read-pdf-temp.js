const fs = require('fs');
const pdfParse = require('pdf-parse');

const pdfPath = 'c:\\Users\\Lenovo\\Desktop\\12devs\\shiptify\\slides\\2026 01 - Sales Account Touchpoints - Google Slides.pdf';
const dataBuffer = fs.readFileSync(pdfPath);

pdfParse(dataBuffer).then(function(data) {
    console.log('TOTAL PAGES:', data.numpages);
    console.log('TEXT:');
    console.log(data.text);
}).catch(err => {
    console.error('Error:', err.message);
});
