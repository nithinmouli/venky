import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Case from '../models/Case.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGO_URI;
const DATA_DIR = path.join(__dirname, '..', 'data', 'cases');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`📂 Found ${jsonFiles.length} case files to seed`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(DATA_DIR, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const caseData = JSON.parse(fileContent);

        const existingCase = await Case.findOne({ caseId: caseData.caseId });
        
        if (existingCase) {
          console.log(`⏭️  Skipping ${caseData.caseId} - already exists`);
          skipCount++;
          continue;
        }

        const newCase = new Case(caseData);
        await newCase.save();
        
        console.log(`✅ Seeded case: ${caseData.caseId} - ${caseData.title}`);
        successCount++;

      } catch (error) {
        console.error(`❌ Error seeding ${file}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Seed Summary:');
    console.log(`   ✅ Successfully seeded: ${successCount}`);
    console.log(`   ⏭️  Skipped (existing): ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total files: ${jsonFiles.length}`);

    await mongoose.connection.close();
    console.log('\n🎉 Database seeding completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedDatabase();
