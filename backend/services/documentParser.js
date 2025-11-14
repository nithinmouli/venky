const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Document Parser Service
 * Extracts text from various file formats: PDF, DOCX, DOC, TXT
 */

/**
 * Main function to parse documents based on MIME type
 * @param {string} filePath - Path to the file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} - Extracted text
 */
async function parseDocument(filePath, mimeType) {
  try {
    switch (mimeType) {
      case 'application/pdf':
        return await parsePDF(filePath);
      
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await parseWord(filePath);
      
      case 'text/plain':
        return await parseText(filePath);
      
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error(`Error parsing document ${filePath}:`, error);
    throw new Error(`Failed to parse document: ${error.message}`);
  }
}

/**
 * Parse PDF files
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function parsePDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    console.log(`Reading PDF file: ${filePath}, size: ${dataBuffer.length} bytes`);
    
    // Use pdf-parse directly as a function
    const data = await pdfParse(dataBuffer);
    console.log(`PDF parsed successfully: ${data.numpages} pages, ${data.text.length} characters`);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    // Clean up the text
    const cleanedText = cleanExtractedText(data.text);
    
    return cleanedText;
  } catch (error) {
    console.error(`PDF parsing error for ${filePath}:`, error);
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

/**
 * Parse Word documents (DOC, DOCX)
 * @param {string} filePath - Path to Word file
 * @returns {Promise<string>} - Extracted text
 */
async function parseWord(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('No text content found in Word document');
    }

    // Log any warnings from mammoth
    if (result.messages && result.messages.length > 0) {
      console.warn('Word document parsing warnings:', result.messages);
    }

    // Clean up the text
    const cleanedText = cleanExtractedText(result.value);
    
    return cleanedText;
  } catch (error) {
    throw new Error(`Word document parsing failed: ${error.message}`);
  }
}

/**
 * Parse plain text files
 * @param {string} filePath - Path to text file
 * @returns {Promise<string>} - File content
 */
async function parseText(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    if (!content || content.trim().length === 0) {
      throw new Error('Text file is empty');
    }
    
    // Basic cleaning for text files
    const cleanedText = cleanExtractedText(content);
    
    return cleanedText;
  } catch (error) {
    throw new Error(`Text file parsing failed: ${error.message}`);
  }
}

/**
 * Clean and normalize extracted text
 * @param {string} text - Raw extracted text
 * @returns {string} - Cleaned text
 */
function cleanExtractedText(text) {
  if (!text) return '';
  
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove excessive line breaks
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Trim the text
    .trim();
}

/**
 * Get file information and validate
 * @param {string} filePath - Path to file
 * @returns {Promise<Object>} - File information
 */
async function getFileInfo(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    return {
      size: stats.size,
      extension: ext,
      isFile: stats.isFile(),
      modified: stats.mtime
    };
  } catch (error) {
    throw new Error(`Cannot access file: ${error.message}`);
  }
}

/**
 * Validate file before processing
 * @param {string} filePath - Path to file
 * @param {string} mimeType - MIME type
 * @returns {Promise<boolean>} - Validation result
 */
async function validateFile(filePath, mimeType) {
  try {
    const fileInfo = await getFileInfo(filePath);
    
    // Check if it's actually a file
    if (!fileInfo.isFile) {
      throw new Error('Path does not point to a file');
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileInfo.size > maxSize) {
      throw new Error(`File too large: ${(fileInfo.size / 1024 / 1024).toFixed(2)}MB (max: 10MB)`);
    }
    
    // Check if file is empty
    if (fileInfo.size === 0) {
      throw new Error('File is empty');
    }
    
    // Validate MIME type against extension
    const allowedMimes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };
    
    const expectedMime = allowedMimes[fileInfo.extension];
    if (!expectedMime) {
      throw new Error(`Unsupported file extension: ${fileInfo.extension}`);
    }
    
    // Note: We're being flexible with MIME type checking as some browsers
    // might send different MIME types for the same file extension
    
    return true;
  } catch (error) {
    console.error(`File validation failed for ${filePath}:`, error);
    return false;
  }
}

/**
 * Extract metadata from documents (where possible)
 * @param {string} filePath - Path to file
 * @param {string} mimeType - MIME type
 * @returns {Promise<Object>} - Document metadata
 */
async function extractMetadata(filePath, mimeType) {
  const metadata = {
    filename: path.basename(filePath),
    extension: path.extname(filePath),
    size: 0,
    type: mimeType,
    pages: null,
    wordCount: null
  };

  try {
    const fileInfo = await getFileInfo(filePath);
    metadata.size = fileInfo.size;

    // For PDFs, we can get page count
    if (mimeType === 'application/pdf') {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      metadata.pages = pdfData.numpages;
      metadata.wordCount = pdfData.text.split(/\s+/).length;
    }
    
    // For other files, just count words after parsing
    else {
      const text = await parseDocument(filePath, mimeType);
      metadata.wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    }

  } catch (error) {
    console.error(`Error extracting metadata from ${filePath}:`, error);
    // Continue with basic metadata
  }

  return metadata;
}

// Export all functions
module.exports = {
  parseDocument,
  parsePDF,
  parseWord,
  parseText,
  cleanExtractedText,
  getFileInfo,
  validateFile,
  extractMetadata
};