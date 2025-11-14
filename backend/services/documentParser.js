// Import internal entry to avoid package debug code reading test files
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

async function parseDocumentFromBuffer(buffer, mimeType) {
  switch (mimeType) {
    case 'application/pdf':
      return await parsePDFFromBuffer(buffer);
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return await parseWordFromBuffer(buffer);
    case 'text/plain':
      return cleanExtractedText(buffer.toString('utf8'));
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

async function parsePDFFromBuffer(dataBuffer) {
  const data = await pdfParse(dataBuffer);
  
  if (!data.text || data.text.trim().length === 0) {
    throw new Error('No text content found in PDF');
  }
  
  return cleanExtractedText(data.text);
}

async function parseWordFromBuffer(buffer) {
  const result = await mammoth.extractRawText({ buffer: buffer });
  
  if (!result.value || result.value.trim().length === 0) {
    throw new Error('No text content found in Word document');
  }

  return cleanExtractedText(result.value);
}

function cleanExtractedText(text) {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

const documentParserService = {
  parseDocumentFromBuffer,
  parsePDFFromBuffer,
  parseWordFromBuffer,
  cleanExtractedText
};

export default documentParserService;