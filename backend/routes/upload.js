import express from 'express';
import { upload, MAX_FILES_PER_UPLOAD } from '../config/multer.js';
import { supabase } from '../config/supabase.js';
import documentParserService from '../services/documentParser.js';
import caseService from '../services/caseService.js';

const router = express.Router();

const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'pdfbucket';

async function uploadToSupabase(fileBuffer, originalName, mimetype, caseId, side) {
  const fileName = `${Date.now()}-${originalName}`;
  const filePath = `cases/${caseId}/${side}/${fileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: mimetype,
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  if (!urlData || !urlData.publicUrl) {
    throw new Error('Error retrieving file URL from Supabase');
  }

  return {
    fileUrl: urlData.publicUrl,
    storagePath: filePath
  };
}

router.post('/side-a', upload.array('documents', MAX_FILES_PER_UPLOAD), async (req, res) => {
  try {
    const { caseId, description } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const parsedDocuments = [];
    
    for (const file of files) {
      const extractedText = await documentParserService.parseDocumentFromBuffer(file.buffer, file.mimetype);
      const cloudUpload = await uploadToSupabase(
        file.buffer,
        file.originalname,
        file.mimetype,
        caseId,
        'side-a'
      );
      
      parsedDocuments.push({
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        extractedText: extractedText,
        fileUrl: cloudUpload.fileUrl,
        path: cloudUpload.storagePath
      });
    }

    const caseData = await caseService.addDocumentsToSide(caseId, 'A', {
      description,
      documents: parsedDocuments
    });

    res.json({
      message: 'Documents uploaded and processed for Side A',
      caseId: caseData.caseId,
      documentsProcessed: parsedDocuments.length,
      documents: parsedDocuments.map(doc => ({
        filename: doc.filename,
        size: doc.size,
        textLength: doc.extractedText.length
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process uploaded documents' });
  }
});

router.post('/side-b', upload.array('documents', MAX_FILES_PER_UPLOAD), async (req, res) => {
  try {
    const { caseId, description } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const parsedDocuments = [];
    
    for (const file of files) {
      const extractedText = await documentParserService.parseDocumentFromBuffer(file.buffer, file.mimetype);
      const cloudUpload = await uploadToSupabase(
        file.buffer,
        file.originalname,
        file.mimetype,
        caseId,
        'side-b'
      );
      
      parsedDocuments.push({
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        extractedText: extractedText,
        fileUrl: cloudUpload.fileUrl,
        path: cloudUpload.storagePath
      });
    }

    const caseData = await caseService.addDocumentsToSide(caseId, 'B', {
      description,
      documents: parsedDocuments
    });

    res.json({
      message: 'Documents uploaded and processed for Side B',
      caseId: caseData.caseId,
      documentsProcessed: parsedDocuments.length,
      documents: parsedDocuments.map(doc => ({
        filename: doc.filename,
        size: doc.size,
        textLength: doc.extractedText.length
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process uploaded documents' });
  }
});

export default router;
