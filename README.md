# AI Judge System

A comprehensive digital court system powered by Google's Gemini 2.5 Flash AI, featuring real-time case management, document analysis, and intelligent legal reasoning.

## 🏛️ Overview

The AI Judge System is a modern web application that simulates court proceedings using artificial intelligence. It allows users to create legal cases, submit evidence from both sides, and receive AI-generated verdicts based on legal analysis. The system supports continuous argumentation and real-time updates, making it an excellent tool for legal education, case analysis, and dispute resolution simulation.

## ✨ Features

### Core Functionality
- **AI-Powered Legal Analysis**: Uses Google Gemini 2.5 Flash for intelligent case evaluation
- **Multi-Format Document Processing**: Supports PDF, DOC, DOCX, and TXT files
- **Real-Time Case Updates**: WebSocket integration for live updates
- **Adversarial System**: Two-sided case presentation (Plaintiff vs Defendant)
- **Interactive Arguments**: Lawyers can present follow-up arguments and receive AI responses
- **Verdict Generation**: Comprehensive AI verdicts with legal reasoning and confidence scores
- **Case Management**: Full CRUD operations for case data
- **Responsive Design**: Modern black/white minimalist UI with animations

### Advanced Features
- **GooeyNav Animation**: Particle-based navigation with morphing effects
- **Dashboard Analytics**: Case statistics and performance metrics
- **Status Tracking**: Real-time case status updates
- **Document Validation**: File type and size validation
- **Error Handling**: Comprehensive error management throughout the system
- **Hidden Scrollbars**: Clean UI with functional but invisible scrollbars

## 🏗️ Architecture

### Backend (Node.js/Express)
```
backend/
├── index.js                 # Main server file
├── services/
│   ├── geminiService.js     # AI integration service
│   ├── caseService.js       # Case data management
│   └── documentParser.js    # Document processing
├── uploads/                 # File upload storage
├── data/                   # JSON data persistence
└── .env                    # Environment configuration
```

### Frontend (React/Vite)
```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.jsx    # Main dashboard
│   │   ├── GooeyNav.jsx     # Animated navigation
│   │   ├── Header.jsx       # App header
│   │   └── ...
│   ├── stores/             # Zustand state management
│   │   └── useAIJudgeStore.js
│   ├── index.css           # Global styles
│   └── App.jsx             # Main app component
├── public/                 # Static assets
└── package.json           # Frontend dependencies
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- NPM or Yarn
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd abc
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create environment file
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start Development Servers**
   
   Terminal 1 (Backend):
   ```bash
   cd backend
   npm run dev
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Google Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# File Upload Limits
MAX_FILE_SIZE=10485760  # 10MB in bytes

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env` file

## 📋 Usage Workflow

### Creating a Case

1. **Access Dashboard**: Navigate to the main dashboard
2. **Create New Case**: Click "Create Case" button
3. **Fill Case Details**:
   - Case title
   - Description
   - Case type (Civil, Criminal, Corporate, etc.)
   - Jurisdiction/Country
   - Plaintiff (Side A) description
   - Defendant (Side B) description

4. **Submit Documents**:
   - Upload supporting documents for each side
   - Supported formats: PDF, DOC, DOCX, TXT
   - Maximum file size: 10MB per file
   - Documents are automatically processed and text extracted

### AI Judgment Process

1. **Document Analysis**: AI analyzes all submitted documents
2. **Legal Research**: Applies relevant laws and legal principles
3. **Verdict Generation**: Creates structured verdict with:
   - Decision (favor_side_a, favor_side_b, split_decision, insufficient_evidence)
   - Detailed legal reasoning
   - Key factual findings
   - Applicable legal principles
   - Damages/remedies (if applicable)
   - Confidence score (0.0-1.0)

### Follow-up Arguments

1. **Submit Arguments**: Either side can present additional arguments
2. **AI Response**: Judge analyzes new arguments and may:
   - Maintain original verdict
   - Make minor modifications
   - Significantly change verdict
   - Completely reverse decision
3. **Real-time Updates**: All participants see updates immediately

### Case Status Flow

1. **Created** → Initial case creation
2. **Awaiting Documents** → Waiting for evidence submission
3. **Ready for Judgment** → All documents submitted, ready for AI analysis
4. **Arguments Phase** → Active argumentation period
5. **Verdict Rendered** → Final decision issued

## 🔧 API Endpoints

### Cases
- `POST /api/cases` - Create new case
- `GET /api/cases` - List all cases
- `GET /api/cases/:id` - Get specific case
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case

### Documents
- `POST /api/cases/:id/documents` - Upload documents
- `GET /api/cases/:id/documents` - List case documents

### AI Interactions
- `POST /api/cases/:id/generate-verdict` - Generate AI verdict
- `POST /api/cases/:id/arguments` - Submit argument and get AI response

### System
- `GET /api/health` - Health check
- `GET /api/stats` - System statistics

## 🎨 UI/UX Features

### Design System
- **Color Scheme**: Minimalist black/white design
- **Typography**: Inter font family with bold headings
- **Spacing**: Consistent grid-based layout
- **Animations**: Smooth transitions and particle effects

### Interactive Elements
- **GooeyNav**: Particle-based navigation with morphing backgrounds
- **Glass Cards**: Translucent cards with backdrop blur effects
- **Hover Effects**: Subtle animations on interactive elements
- **Loading States**: Spinner animations during processing
- **Status Indicators**: Color-coded status badges

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Semantic HTML and ARIA labels
- **Color Contrast**: High contrast for readability
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🧪 Development

### Code Organization

**Backend Services**:
- `geminiService.js`: AI integration and prompt engineering
- `caseService.js`: Data persistence and case management
- `documentParser.js`: File processing and text extraction

**Frontend Components**:
- `Dashboard.jsx`: Main analytics and case overview
- `GooeyNav.jsx`: Animated navigation component
- `CaseDetail.jsx`: Individual case view and interaction
- `CreateCase.jsx`: Case creation form

**State Management**:
- Zustand store for global state
- Real-time WebSocket updates
- Optimistic UI updates

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests  
cd frontend
npm test

# End-to-end tests
npm run test:e2e
```

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd backend
npm start
```

## 📊 System Requirements

### Minimum Requirements
- Node.js 18.0+
- 2GB RAM
- 1GB storage space
- Google Gemini API access

### Recommended
- Node.js 20.0+
- 4GB RAM
- 5GB storage space
- High-speed internet connection

## 🔒 Security Considerations

- **API Key Security**: Keep Gemini API key secure and rotate regularly
- **File Upload Validation**: Strict file type and size validation
- **Input Sanitization**: All user inputs are sanitized
- **Rate Limiting**: Consider implementing rate limiting for API calls
- **CORS Configuration**: Properly configured CORS policies
- **Environment Variables**: Never commit sensitive data to version control

## 🐛 Troubleshooting

### Common Issues

**1. API Key Errors**
```
Error: Gemini API not configured
```
- Solution: Ensure `GEMINI_API_KEY` is set in `.env` file

**2. File Upload Failures**
```
Error: File too large
```
- Solution: Check `MAX_FILE_SIZE` configuration and file size limits

**3. Document Processing Errors**
```
Error: Failed to extract text from document
```
- Solution: Ensure file is not corrupted and is in supported format

**4. WebSocket Connection Issues**
```
Error: WebSocket connection failed
```
- Solution: Check backend server is running and CORS is properly configured

### Debug Mode
Set `NODE_ENV=development` for detailed error logging.

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   GEMINI_API_KEY=your_production_key
   PORT=3001
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Start Production Server**
   ```bash
   cd backend
   npm start
   ```

### Docker Deployment (Optional)

```dockerfile
# Dockerfile example
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3001

CMD ["npm", "start"]
```

## 📝 License

This project is licensed under the ISC License. See the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, please open an issue on the repository or contact the development team.

## 🔄 Version History

### v1.0.0 (Current)
- Initial release with core AI Judge functionality
- Modern React frontend with animations
- Google Gemini 2.5 Flash integration
- Real-time WebSocket updates
- Multi-format document processing
- Comprehensive case management

---
