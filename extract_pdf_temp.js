const fs = require('fs');
const pdfParse = require('./node_modules/pdf-parse');

const pdfPath = 'C:\\Users\\Lenovo\\Desktop\\12devs\\shiptify\\slides\\2026 05 - BO AM 1.3 - Google Slides.pdf';
const dataBuffer = fs.readFileSync(pdfPath);

pdfParse(dataBuffer).then(function(data) {
    console.log('Pages:', data.numpages);
    console.log('TEXT_START');
    console.log(data.text);
    console.log('TEXT_END');
}).catch(err => {
    console.error('Error:', err.message);
});
