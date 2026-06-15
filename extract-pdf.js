const { PDFParse } = require("pdf-parse");
const fs = require("fs");

const buf = fs.readFileSync("c:/Users/Lenovo/Desktop/12devs/shiptify/slides/2025 10 - 1Centimeter BO - Google Slides.pdf");
const parser = new PDFParse();

parser.parse(buf).then(data => {
  const keys = Object.keys(data);
  fs.writeFileSync("c:/tmp/pdf_keys.txt", keys.join(","));
  if (data.pages) {
    data.pages.forEach((page, i) => {
      const lines = [];
      if (page.lines) page.lines.forEach(l => lines.push(l.text || JSON.stringify(l).substring(0,100)));
      else if (page.text) lines.push(page.text);
      else lines.push(JSON.stringify(page).substring(0,500));
      fs.appendFileSync("c:/tmp/pdf_pages.txt", "\n=== PAGE " + (i+1) + " ===\n" + lines.join("\n"));
    });
  } else {
    fs.writeFileSync("c:/tmp/pdf_pages.txt", "No pages property. Keys: " + keys.join(","));
  }
  if (data.text) fs.writeFileSync("c:/tmp/pdf_text.txt", data.text);
  process.stdout.write("OK\n");
}).catch(err => {
  fs.writeFileSync("c:/tmp/pdf_error.txt", err.message);
  process.stdout.write("ERROR: " + err.message + "\n");
});
