import 'dotenv/config';
import mongoose from 'mongoose';
import Case from '../models/Case.js';
import { supabase } from '../config/supabase.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGO_URI;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'pdfbucket';

async function migrateDocumentsToCloud() {
  try {
    console.log('🔄 Starting migration of case documents to Supabase...');
    console.log(`📦 Storage Bucket: ${STORAGE_BUCKET}\n`);
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const cases = await Case.find({});
    console.log(`📂 Found ${cases.length} cases to process\n`);

    let totalDocuments = 0;
    let uploadedDocuments = 0;
    let skippedDocuments = 0;
    let errorDocuments = 0;
    let missingFiles = 0;

    for (const caseData of cases) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔍 Processing case: ${caseData.caseId}`);
      console.log(`   Title: ${caseData.title}`);
      console.log(`   Status: ${caseData.status}`);
      
      let updated = false;

      for (const side of ['sideA', 'sideB']) {
        const sideLabel = side === 'sideA' ? 'Side A' : 'Side B';
        
        if (caseData[side] && caseData[side].documents && caseData[side].documents.length > 0) {
          console.log(`\n   📑 ${sideLabel}: ${caseData[side].documents.length} document(s)`);
          
          for (let i = 0; i < caseData[side].documents.length; i++) {
            const doc = caseData[side].documents[i];
            totalDocuments++;

            console.log(`\n      📄 ${doc.filename}`);

            // Check if already in cloud
            if (doc.fileUrl && doc.fileUrl.includes('supabase')) {
              console.log(`      ✓ Already in cloud: ${doc.fileUrl}`);
              skippedDocuments++;
              continue;
            }

            if (doc.storagePath && doc.uploadedToCloud) {
              console.log(`      ✓ Already marked as uploaded`);
              skippedDocuments++;
              continue;
            }

            try {
              // Try multiple path variations
              let localPath = path.join(__dirname, '..', doc.path);
              let fileExists = false;

              try {
                await fs.access(localPath);
                fileExists = true;
              } catch (err) {
                // Try normalized path (replace backslashes)
                localPath = path.join(__dirname, '..', doc.path.replace(/\\/g, '/'));
                try {
                  await fs.access(localPath);
                  fileExists = true;
                } catch (err2) {
                  console.log(`      ⚠️  File not found at: ${doc.path}`);
                  missingFiles++;
                }
              }

              if (fileExists) {
                console.log(`      📂 Found local file, uploading...`);
                const fileBuffer = await fs.readFile(localPath);
                const fileName = `${Date.now()}-${doc.filename}`;
                const filePath = `cases/${caseData.caseId}/${side}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                  .from(STORAGE_BUCKET)
                  .upload(filePath, fileBuffer, {
                    contentType: doc.mimetype || 'application/pdf',
                    upsert: false
                  });

                if (uploadError) {
                  console.error(`      ❌ Upload error: ${uploadError.message}`);
                  errorDocuments++;
                  continue;
                }

                const { data: urlData } = supabase.storage
                  .from(STORAGE_BUCKET)
                  .getPublicUrl(filePath);

                caseData[side].documents[i].fileUrl = urlData.publicUrl;
                caseData[side].documents[i].storagePath = filePath;
                caseData[side].documents[i].uploadedToCloud = true;

                console.log(`      ✅ Uploaded successfully`);
                console.log(`      🔗 URL: ${urlData.publicUrl}`);
                uploadedDocuments++;
                updated = true;
              }
            } catch (error) {
              console.error(`      ❌ Error: ${error.message}`);
              errorDocuments++;
            }
          }
        } else {
          console.log(`\n   📑 ${sideLabel}: No documents`);
        }
      }

      if (updated) {
        await caseData.save();
        console.log(`\n   💾 Saved updates to MongoDB`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📊 Migration Summary:');
    console.log(`   📄 Total documents found: ${totalDocuments}`);
    console.log(`   ✅ Uploaded to cloud: ${uploadedDocuments}`);
    console.log(`   ⏭️  Already in cloud (skipped): ${skippedDocuments}`);
    console.log(`   📂 Missing local files: ${missingFiles}`);
    console.log(`   ❌ Upload errors: ${errorDocuments}`);

    await mongoose.connection.close();
    console.log('\n🎉 Migration completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateDocumentsToCloud();
