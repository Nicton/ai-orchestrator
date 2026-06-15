const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const filePath = process.argv[2];
const dataBuffer = fs.readFileSync(filePath);
const parser = new PDFParse();
parser.parse(dataBuffer).then(function(data) {
    console.log('NUM PAGES:', data.numpages);
    console.log(data.text);
}).catch(err => console.error('Error:', err.message));
