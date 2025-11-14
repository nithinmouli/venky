require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');

// Import our services
const documentParserService = require('./services/documentParser');
const geminiService = require('./services/geminiService');
const caseService = require('./services/caseService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Vite dev server
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
    // Accept pdf, doc, docx, txt files
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Judge Server is running' });
});

// Upload documents for Side A (Plaintiff)
app.post('/api/upload/side-a', upload.array('documents', 10), async (req, res) => {
  try {
    const { caseId, description } = req.body;
    const files = req.files;

    console.log(`[Side A] Upload request - Case ID: ${caseId}, Files: ${files?.length || 0}`);

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Parse all uploaded files
    console.log(`[Side A] Processing ${files.length} files...`);
    const parsedDocuments = [];
    for (const file of files) {
      try {
        console.log(`[Side A] Parsing file: ${file.originalname}, MIME: ${file.mimetype}, Size: ${file.size}`);
        const extractedText = await documentParserService.parseDocument(file.path, file.mimetype);
        console.log(`[Side A] Successfully parsed ${file.originalname}, extracted ${extractedText.length} characters`);
        parsedDocuments.push({
          filename: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          extractedText: extractedText
        });
      } catch (parseError) {
        console.error(`[Side A] Error parsing file ${file.originalname}:`, parseError);
        // Continue with other files
      }
    }

    console.log(`[Side A] Successfully processed ${parsedDocuments.length} out of ${files.length} files`);

    // Store case information
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

// Upload documents for Side B (Defendant)
app.post('/api/upload/side-b', upload.array('documents', 10), async (req, res) => {
  try {
    const { caseId, description } = req.body;
    const files = req.files;

    console.log(`[Side B] Upload request - Case ID: ${caseId}, Files: ${files?.length || 0}`);

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Parse all uploaded files
    console.log(`[Side B] Processing ${files.length} files...`);
    const parsedDocuments = [];
    for (const file of files) {
      try {
        console.log(`[Side B] Parsing file: ${file.originalname}, MIME: ${file.mimetype}, Size: ${file.size}`);
        const extractedText = await documentParserService.parseDocument(file.path, file.mimetype);
        console.log(`[Side B] Successfully parsed ${file.originalname}, extracted ${extractedText.length} characters`);
        parsedDocuments.push({
          filename: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          extractedText: extractedText
        });
      } catch (parseError) {
        console.error(`[Side B] Error parsing file ${file.originalname}:`, parseError);
        // Continue with other files
      }
    }

    console.log(`[Side B] Successfully processed ${parsedDocuments.length} out of ${files.length} files`);

    // Store case information
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

// Create a new case
app.post('/api/case/create', async (req, res) => {
  try {
    const { title, description, country, caseType } = req.body;
    
    if (!title || !description || !country) {
      return res.status(400).json({ error: 'Title, description, and country are required' });
    }

    const newCase = await caseService.createCase({
      title,
      description,
      country,
      caseType: caseType || 'civil'
    });

    res.json({
      message: 'Case created successfully',
      case: newCase
    });

  } catch (error) {
    console.error('Case creation error:', error);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

// Get case details
app.get('/api/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseData = await caseService.getCase(caseId);
    
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json(caseData);
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({ error: 'Failed to retrieve case' });
  }
});

// Generate AI Judge verdict
app.post('/api/case/:caseId/judge', async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseData = await caseService.getCase(caseId);
    
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (!caseData.sideA?.documents || !caseData.sideB?.documents) {
      return res.status(400).json({ 
        error: 'Both sides must submit documents before judgment can be rendered' 
      });
    }

    // Generate initial verdict using Gemini
    const verdict = await geminiService.generateVerdict(caseData);
    
    // Save verdict to case
    const updatedCase = await caseService.setVerdict(caseId, verdict);
    
    // Emit real-time update
    io.emit('verdictRendered', { caseId, verdict });

    res.json({
      message: 'AI Judge has rendered a verdict',
      caseId,
      verdict
    });

  } catch (error) {
    console.error('Judgment error:', error);
    res.status(500).json({ error: 'Failed to generate verdict' });
  }
});

// Submit argument from either side
app.post('/api/case/:caseId/argue', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { side, argument } = req.body;
    
    if (!side || !argument) {
      return res.status(400).json({ error: 'Side and argument are required' });
    }

    if (side !== 'A' && side !== 'B') {
      return res.status(400).json({ error: 'Side must be either A or B' });
    }

    const caseData = await caseService.getCase(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (!caseData.verdict) {
      return res.status(400).json({ error: 'Initial verdict must be rendered before arguments can be submitted' });
    }

    // Check argument limit (5 max per side)
    const currentArguments = caseData.arguments || [];
    const sideArguments = currentArguments.filter(arg => arg.side === side);
    
    if (sideArguments.length >= 5) {
      return res.status(400).json({ 
        error: 'Maximum number of arguments (5) reached for this side' 
      });
    }

    // Get AI response to the argument
    const aiResponse = await geminiService.respondToArgument(caseData, side, argument);
    
    // Add argument and response to case
    const updatedCase = await caseService.addArgument(caseId, {
      side,
      argument,
      aiResponse,
      timestamp: new Date().toISOString(),
      argumentNumber: sideArguments.length + 1
    });

    // Emit real-time update
    io.emit('newArgument', { 
      caseId, 
      side, 
      argument, 
      aiResponse,
      argumentNumber: sideArguments.length + 1
    });

    res.json({
      message: 'Argument submitted and AI has responded',
      caseId,
      side,
      argumentNumber: sideArguments.length + 1,
      argument,
      aiResponse,
      remainingArguments: 5 - (sideArguments.length + 1)
    });

  } catch (error) {
    console.error('Argument submission error:', error);
    res.status(500).json({ error: 'Failed to process argument' });
  }
});

// Get all cases (for listing)
app.get('/api/cases', async (req, res) => {
  try {
    const cases = await caseService.getAllCases();
    res.json(cases);
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({ error: 'Failed to retrieve cases' });
  }
});

// Search cases
app.get('/api/cases/search', async (req, res) => {
  try {
    const criteria = req.query;
    const cases = await caseService.searchCases(criteria);
    res.json(cases);
  } catch (error) {
    console.error('Search cases error:', error);
    res.status(500).json({ error: 'Failed to search cases' });
  }
});

// Get case statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await caseService.getCaseStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

// Delete a case
app.delete('/api/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const deleted = await caseService.deleteCase(caseId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({ message: 'Case deleted successfully', caseId });
  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('joinCase', (caseId) => {
    socket.join(caseId);
    console.log(`Client ${socket.id} joined case ${caseId}`);
  });
  
  socket.on('leaveCase', (caseId) => {
    socket.leave(caseId);
    console.log(`Client ${socket.id} left case ${caseId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 10 files per upload.' });
    }
  }
  
  console.error(error);
  res.status(500).json({ error: error.message || 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

server.listen(PORT, () => {
  console.log(`🚀 AI Judge Server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🤖 Gemini API configured: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
});

module.exports = app;
