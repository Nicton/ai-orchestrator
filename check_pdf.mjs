import { createRequire } from 'module';
import { readFileSync } from 'fs';
const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
console.log('module type:', typeof pdfParseModule);
console.log('keys:', Object.keys(pdfParseModule).slice(0,10));
