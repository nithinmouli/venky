const express = require('express');
const router = express.Router();
const { upload, MAX_FILES_PER_UPLOAD } = require('../config/multer');
const { supabase } = require('../config/supabase');
const documentParserService = require('../services/documentParser');
const caseService = require('../services/caseService');

const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'pdfbucket';

async function uploadToSupabase(fileBuffer, originalName, mimetype, caseId, side) {
  try {
    const fileName = `${Date.now()}-${originalName}`;
    const filePath = `cases/${caseId}/${side}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError.message);
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
  } catch (error) {
    console.error('Failed to upload to Supabase:', error.message);
    throw error;
  }
}

router.post('/side-a', upload.array('documents', MAX_FILES_PER_UPLOAD), async (req, res) => {
  try {
    const { caseId, description } = req.body;
    const files = req.files;

    console.log(`[Side A] Upload request - Case ID: ${caseId}, Files: ${files?.length || 0}`);

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(`[Side A] Processing ${files.length} files...`);
    const parsedDocuments = [];
    
    for (const file of files) {
      try {
        console.log(`[Side A] Parsing file: ${file.originalname}, MIME: ${file.mimetype}, Size: ${file.size}`);
        const extractedText = await documentParserService.parseDocumentFromBuffer(file.buffer, file.mimetype);
        console.log(`[Side A] Successfully parsed ${file.originalname}, extracted ${extractedText.length} characters`);
        
        const cloudUpload = await uploadToSupabase(
          file.buffer,
          file.originalname,
          file.mimetype,
          caseId,
          'side-a'
        );
        
        const docData = {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          extractedText: extractedText,
          fileUrl: cloudUpload.fileUrl,
          path: cloudUpload.storagePath
        };

        console.log(`[Side A] ✅ Uploaded to cloud: ${cloudUpload.fileUrl}`);
        parsedDocuments.push(docData);
      } catch (parseError) {
        console.error(`[Side A] Error processing file ${file.originalname}:`, parseError);
        throw parseError;
      }
    }

    console.log(`[Side A] Successfully processed ${parsedDocuments.length} out of ${files.length} files`);

    const caseData = await caseService.addDocumentsToSide(caseId, 'A', {
      description,
      documents: parsedDocuments
    });

    console.log(`[Side A] Case updated - Status: ${caseData.status}, Side A docs: ${caseData.sideA.documents.length}`);

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
    console.error('[Side A] Upload error:', error);
    res.status(500).json({ error: 'Failed to process uploaded documents' });
  }
});

router.post('/side-b', upload.array('documents', MAX_FILES_PER_UPLOAD), async (req, res) => {
  try {
    const { caseId, description } = req.body;
    const files = req.files;

    console.log(`[Side B] Upload request - Case ID: ${caseId}, Files: ${files?.length || 0}`);

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(`[Side B] Processing ${files.length} files...`);
    const parsedDocuments = [];
    
    for (const file of files) {
      try {
        console.log(`[Side B] Parsing file: ${file.originalname}, MIME: ${file.mimetype}, Size: ${file.size}`);
        const extractedText = await documentParserService.parseDocumentFromBuffer(file.buffer, file.mimetype);
        console.log(`[Side B] Successfully parsed ${file.originalname}, extracted ${extractedText.length} characters`);
        
        const cloudUpload = await uploadToSupabase(
          file.buffer,
          file.originalname,
          file.mimetype,
          caseId,
          'side-b'
        );
        
        const docData = {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          extractedText: extractedText,
          fileUrl: cloudUpload.fileUrl,
          path: cloudUpload.storagePath
        };

        console.log(`[Side B] ✅ Uploaded to cloud: ${cloudUpload.fileUrl}`);
        parsedDocuments.push(docData);
      } catch (parseError) {
        console.error(`[Side B] Error processing file ${file.originalname}:`, parseError);
        throw parseError;
      }
    }

    console.log(`[Side B] Successfully processed ${parsedDocuments.length} out of ${files.length} files`);

    const caseData = await caseService.addDocumentsToSide(caseId, 'B', {
      description,
      documents: parsedDocuments
    });

    console.log(`[Side B] Case updated - Status: ${caseData.status}, Side B docs: ${caseData.sideB.documents.length}`);

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
    console.error('[Side B] Upload error:', error);
    res.status(500).json({ error: 'Failed to process uploaded documents' });
  }
});

module.exports = router;
