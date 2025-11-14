import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  fileUrl: String,
  storagePath: String,
  mimetype: String,
  size: Number,
  extractedText: String,
  uploadedToCloud: { type: Boolean, default: false }
}, { _id: false });

const sideSchema = new mongoose.Schema({
  description: String,
  documents: [documentSchema],
  uploadedAt: Date
}, { _id: false });

const argumentSchema = new mongoose.Schema({
  id: String,
  side: {
    type: String,
    enum: ['A', 'B']
  },
  argument: String,
  aiResponse: mongoose.Schema.Types.Mixed,
  timestamp: Date,
  argumentNumber: Number
}, { _id: false });

const verdictSchema = new mongoose.Schema({
  decision: String,
  reasoning: String,
  keyFindings: [String],
  legalPrinciples: [String],
  damages: String,
  notes: String,
  confidence: Number,
  openToReconsideration: Boolean,
  timestamp: Date,
  caseId: String,
  country: String,
  caseType: String
}, { _id: false });

const metadataSchema = new mongoose.Schema({
  totalArguments: { type: Number, default: 0 },
  sideAArguments: { type: Number, default: 0 },
  sideBArguments: { type: Number, default: 0 },
  lastActivity: Date
}, { _id: false });

const caseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  caseType: {
    type: String,
    enum: ['civil', 'criminal', 'constitutional', 'intellectual_property', 'family', 'corporate', 'labor', 'administrative'],
    default: 'civil'
  },
  status: {
    type: String,
    enum: ['created', 'awaiting_documents', 'ready_for_judgment', 'verdict_rendered', 'arguments_phase'],
    default: 'created'
  },
  sideA: {
    type: sideSchema,
    default: {
      description: null,
      documents: [],
      uploadedAt: null
    }
  },
  sideB: {
    type: sideSchema,
    default: {
      description: null,
      documents: [],
      uploadedAt: null
    }
  },
  verdict: verdictSchema,
  arguments: [argumentSchema],
  metadata: {
    type: metadataSchema,
    default: {
      totalArguments: 0,
      sideAArguments: 0,
      sideBArguments: 0,
      lastActivity: new Date()
    }
  }
}, {
  timestamps: true
});

caseSchema.index({ title: 'text', description: 'text' });
caseSchema.index({ status: 1 });
caseSchema.index({ country: 1 });
caseSchema.index({ caseType: 1 });
caseSchema.index({ 'metadata.lastActivity': -1 });

export default mongoose.model('Case', caseSchema);
