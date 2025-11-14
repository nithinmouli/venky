# AI Judge System - API Documentation

## Overview
The AI Judge System is a backend API that simulates legal proceedings with AI-powered verdicts and argument responses. It allows lawyers from both sides to upload documents, receive AI judgments, and engage in follow-up arguments.

## Base URL
```
http://localhost:3001/api
```

## Authentication
Currently, no authentication is required (as per requirements).

## File Upload Requirements
- **Supported formats**: PDF, DOC, DOCX, TXT
- **Maximum file size**: 10MB per file
- **Maximum files per upload**: 10 files
- **Content**: Legal documents, evidence, case briefs, etc.

---

## API Endpoints

### 1. Health Check

**GET** `/health`

Check if the server is running.

**Response:**
```json
{
  "status": "OK",
  "message": "AI Judge Server is running"
}
```

---

### 2. Case Management

#### Create New Case
**POST** `/case/create`

Create a new legal case.

**Request Body:**
```json
{
  "title": "Contract Dispute - ABC Corp vs XYZ Inc",
  "description": "Dispute over breach of service contract terms",
  "country": "United States",
  "caseType": "civil"
}
```

**Response:**
```json
{
  "message": "Case created successfully",
  "case": {
    "caseId": "case_a1b2c3d4_1699876543210",
    "title": "Contract Dispute - ABC Corp vs XYZ Inc",
    "description": "Dispute over breach of service contract terms",
    "country": "United States",
    "caseType": "civil",
    "status": "created",
    "createdAt": "2025-11-12T12:30:00.000Z",
    "sideA": {
      "description": null,
      "documents": [],
      "uploadedAt": null
    },
    "sideB": {
      "description": null,
      "documents": [],
      "uploadedAt": null
    },
    "verdict": null,
    "arguments": []
  }
}
```

#### Get Case Details
**GET** `/case/{caseId}`

Retrieve complete case information.

**Response:**
```json
{
  "caseId": "case_a1b2c3d4_1699876543210",
  "title": "Contract Dispute - ABC Corp vs XYZ Inc",
  "status": "verdict_rendered",
  "verdict": {
    "decision": "favor_side_a",
    "reasoning": "Based on the evidence...",
    "confidence": 0.85
  },
  "arguments": [...],
  "metadata": {
    "totalArguments": 3,
    "sideAArguments": 2,
    "sideBArguments": 1
  }
}
```

#### List All Cases
**GET** `/cases`

Get all cases (summary view).

**Response:**
```json
[
  {
    "caseId": "case_a1b2c3d4_1699876543210",
    "title": "Contract Dispute - ABC Corp vs XYZ Inc",
    "status": "verdict_rendered",
    "country": "United States",
    "caseType": "civil",
    "createdAt": "2025-11-12T12:30:00.000Z",
    "hasVerdict": true,
    "totalArguments": 3
  }
]
```

#### Search Cases
**GET** `/cases/search?status=verdict_rendered&country=United%20States`

Search cases by criteria.

**Query Parameters:**
- `status`: Case status (created, awaiting_documents, ready_for_judgment, verdict_rendered, arguments_phase)
- `country`: Country name (partial match)
- `caseType`: Type of case (civil, criminal, etc.)
- `title`: Case title (partial match)
- `hasVerdict`: Boolean (true/false)

#### Delete Case
**DELETE** `/case/{caseId}`

Delete a case permanently.

**Response:**
```json
{
  "message": "Case deleted successfully",
  "caseId": "case_a1b2c3d4_1699876543210"
}
```

#### Get Statistics
**GET** `/stats`

Get system-wide case statistics.

**Response:**
```json
{
  "totalCases": 15,
  "statusBreakdown": {
    "verdict_rendered": 8,
    "arguments_phase": 3,
    "created": 4
  },
  "countryBreakdown": {
    "United States": 10,
    "United Kingdom": 3,
    "Canada": 2
  },
  "averageArgumentsPerCase": 2.3,
  "casesWithVerdict": 8
}
```

---

### 3. Document Upload

#### Upload Documents - Side A (Plaintiff)
**POST** `/upload/side-a`

Upload legal documents for the plaintiff side.

**Content-Type**: `multipart/form-data`

**Form Fields:**
- `caseId`: Case identifier
- `description`: Text description of the submission
- `documents`: File(s) - PDF, DOC, DOCX, or TXT

**Example using curl:**
```bash
curl -X POST http://localhost:3001/api/upload/side-a \
  -F "caseId=case_a1b2c3d4_1699876543210" \
  -F "description=Initial complaint and supporting evidence" \
  -F "documents=@contract.pdf" \
  -F "documents=@evidence.docx"
```

**Response:**
```json
{
  "message": "Documents uploaded and processed for Side A",
  "caseId": "case_a1b2c3d4_1699876543210",
  "documentsProcessed": 2,
  "documents": [
    {
      "filename": "contract.pdf",
      "size": 524288,
      "textLength": 1500
    },
    {
      "filename": "evidence.docx",
      "size": 102400,
      "textLength": 800
    }
  ]
}
```

#### Upload Documents - Side B (Defendant)
**POST** `/upload/side-b`

Upload legal documents for the defendant side. Same format as Side A.

---

### 4. AI Judge Operations

#### Generate Initial Verdict
**POST** `/case/{caseId}/judge`

Request AI Judge to render an initial verdict after both sides have submitted documents.

**Prerequisites:**
- Both Side A and Side B must have uploaded documents

**Response:**
```json
{
  "message": "AI Judge has rendered a verdict",
  "caseId": "case_a1b2c3d4_1699876543210",
  "verdict": {
    "decision": "favor_side_a",
    "reasoning": "After careful analysis of the submitted evidence, the court finds that the plaintiff has demonstrated a clear breach of contract...",
    "keyFindings": [
      "Contract terms clearly specified delivery deadlines",
      "Defendant failed to meet agreed timeline without valid justification",
      "Plaintiff suffered quantifiable damages"
    ],
    "legalPrinciples": [
      "Breach of Contract - Material Performance Standards",
      "Damages - Consequential Loss Doctrine"
    ],
    "damages": "$50,000 in compensatory damages",
    "confidence": 0.85,
    "openToReconsideration": true,
    "timestamp": "2025-11-12T14:45:00.000Z"
  }
}
```

#### Submit Follow-up Argument
**POST** `/case/{caseId}/argue`

Submit a follow-up argument from either side after initial verdict.

**Request Body:**
```json
{
  "side": "A",
  "argument": "Your Honor, we would like to bring to the court's attention recent precedent in Johnson v. Smith (2024) which supports our position on consequential damages..."
}
```

**Parameters:**
- `side`: Either "A" (Plaintiff) or "B" (Defendant)
- `argument`: The legal argument text (string)

**Constraints:**
- Maximum 5 arguments per side per case
- Initial verdict must be rendered before arguments can be submitted

**Response:**
```json
{
  "message": "Argument submitted and AI has responded",
  "caseId": "case_a1b2c3d4_1699876543210",
  "side": "A",
  "argumentNumber": 1,
  "argument": "Your Honor, we would like to bring...",
  "aiResponse": {
    "response": "The court acknowledges the precedent cited in Johnson v. Smith. However, the facts in that case differ materially from the present matter...",
    "verdictChange": "minor_modification",
    "newReasoning": "While the core finding remains unchanged, the damages calculation should be adjusted...",
    "addressedPoints": [
      "Johnson v. Smith precedent analysis",
      "Consequential damages calculation"
    ],
    "confidence": 0.82,
    "legalCitations": ["Johnson v. Smith (2024)", "Restatement of Contracts §351"]
  },
  "remainingArguments": 4
}
```

---

### 5. Real-time Features (WebSocket)

The system supports real-time updates via Socket.IO.

**Connection:**
```javascript
const socket = io('http://localhost:3001');

// Join a specific case room
socket.emit('joinCase', 'case_a1b2c3d4_1699876543210');

// Listen for verdict updates
socket.on('verdictRendered', (data) => {
  console.log('New verdict:', data);
});

// Listen for new arguments
socket.on('newArgument', (data) => {
  console.log('New argument from side', data.side, ':', data.argument);
});
```

**Events:**
- `joinCase`: Join a case room for updates
- `leaveCase`: Leave a case room
- `verdictRendered`: Emitted when AI renders a verdict
- `newArgument`: Emitted when a new argument is submitted

---

## Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request (missing parameters, invalid file type, argument limit exceeded)
- `404`: Not Found (case not found, endpoint not found)
- `500`: Internal Server Error (AI service error, file processing error)

### File Upload Errors
- File too large (>10MB): `400`
- Invalid file type: `400`
- Too many files (>10): `400`
- No files uploaded: `400`

### Business Logic Errors
- Both sides haven't submitted documents: `400`
- Maximum arguments exceeded (5 per side): `400`
- No initial verdict before arguments: `400`

---

## Example Workflows

### Complete Case Flow

1. **Create Case**
   ```bash
   curl -X POST http://localhost:3001/api/case/create \
     -H "Content-Type: application/json" \
     -d '{"title":"Sample Case","description":"Test case","country":"United States","caseType":"civil"}'
   ```

2. **Upload Side A Documents**
   ```bash
   curl -X POST http://localhost:3001/api/upload/side-a \
     -F "caseId=case_12345" \
     -F "description=Plaintiff evidence" \
     -F "documents=@plaintiff_docs.pdf"
   ```

3. **Upload Side B Documents**
   ```bash
   curl -X POST http://localhost:3001/api/upload/side-b \
     -F "caseId=case_12345" \
     -F "description=Defendant response" \
     -F "documents=@defendant_docs.pdf"
   ```

4. **Request Initial Verdict**
   ```bash
   curl -X POST http://localhost:3001/api/case/case_12345/judge
   ```

5. **Submit Arguments (up to 5 per side)**
   ```bash
   curl -X POST http://localhost:3001/api/case/case_12345/argue \
     -H "Content-Type: application/json" \
     -d '{"side":"A","argument":"Your Honor, we respectfully disagree..."}'
   ```

### Frontend Integration Notes

For the upcoming frontend with Zustand state management:

1. **State Structure Recommendations:**
   ```javascript
   {
     currentCase: null,
     cases: [],
     isLoading: false,
     error: null,
     socketConnection: null,
     uploadProgress: {},
     arguments: []
   }
   ```

2. **Key Actions to Implement:**
   - `createCase()`
   - `uploadDocuments(side, files, description)`
   - `requestVerdict()`
   - `submitArgument(side, argument)`
   - `connectWebSocket()`

---

## Security Considerations

⚠️ **Production Deployment Notes:**
- Add authentication and authorization
- Implement rate limiting
- Add input validation and sanitization
- Use HTTPS in production
- Implement proper logging and monitoring
- Add file virus scanning
- Use environment-specific configuration

---

## Configuration

### Environment Variables
Required in `.env` file:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3001
NODE_ENV=development
MAX_FILE_SIZE=10485760
```

### Development Commands
```bash
# Start server
npm start

# Development mode (with auto-restart)
npm run dev  # if nodemon is configured

# Direct execution
node index.js
```

This API provides a complete backend for the AI Judge system, supporting document upload, AI-powered legal analysis, and interactive argument phases.