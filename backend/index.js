require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const http = require('http');
const socketIo = require('socket.io');

const connectDB = require('./config/database');
const uploadRoutes = require('./routes/upload');
const caseRoutes = require('./routes/case');
const casesRoutes = require('./routes/cases');

const PORT = process.env.PORT || 3001;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

connectDB();

app.set('io', io);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Judge Server is running' });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/case', caseRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/stats', casesRoutes);

io.on('connection', (socket) => {
  socket.on('joinCase', (caseId) => {
    socket.join(caseId);
  });
  
  socket.on('leaveCase', (caseId) => {
    socket.leave(caseId);
  });
  
  socket.on('disconnect', () => {});
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 10 files per upload.' });
    }
  }
  res.status(500).json({ error: error.message || 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

server.listen(PORT, () => {
  console.log(`AI Judge Server running on port ${PORT}`);
});

module.exports = app;
