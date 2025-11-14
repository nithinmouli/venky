import crypto from 'crypto';
import Case from '../models/Case.js';

function generateCaseId() {
  return 'case_' + crypto.randomBytes(8).toString('hex') + '_' + Date.now();
}

async function createCase(caseInfo) {
  const caseId = generateCaseId();
  
  const newCase = new Case({
    caseId,
    title: caseInfo.title,
    description: caseInfo.description,
    country: caseInfo.country,
    caseType: caseInfo.caseType || 'civil',
    status: 'created',
    sideA: {
      description: null,
      documents: [],
      uploadedAt: null
    },
    sideB: {
      description: null,
      documents: [],
      uploadedAt: null
    },
    verdict: null,
    arguments: [],
    metadata: {
      totalArguments: 0,
      sideAArguments: 0,
      sideBArguments: 0,
      lastActivity: new Date()
    }
  });

  await newCase.save();
  return newCase.toObject();
}

async function getCase(caseId) {
  try {
    const caseData = await Case.findOne({ caseId }).lean();
    return caseData;
  } catch (error) {
    throw new Error(`Error loading case ${caseId}: ${error.message}`);
  }
}

async function saveCase(caseData) {
  try {
    caseData.updatedAt = new Date();
    await Case.findOneAndUpdate(
      { caseId: caseData.caseId },
      caseData,
      { new: true, upsert: true }
    );
  } catch (error) {
    throw new Error(`Error saving case ${caseData.caseId}: ${error.message}`);
  }
}

async function addDocumentsToSide(caseId, side, documentData) {
  let caseData = await getCase(caseId);
  
  if (!caseData) {
    caseData = await createCase({
      title: `Case ${caseId}`,
      description: 'Auto-created case from document upload',
      country: 'United States',
      caseType: 'civil'
    });
    caseData.caseId = caseId;
  }

  const sideKey = side === 'A' ? 'sideA' : 'sideB';
  const updateData = {
    [`${sideKey}.description`]: documentData.description,
    [`${sideKey}.documents`]: documentData.documents,
    [`${sideKey}.uploadedAt`]: new Date(),
    'metadata.lastActivity': new Date()
  };

  const hasBothSides = side === 'A' 
    ? (caseData.sideB?.documents?.length > 0 && documentData.documents.length > 0)
    : (caseData.sideA?.documents?.length > 0 && documentData.documents.length > 0);

  updateData.status = hasBothSides ? 'ready_for_judgment' : 'awaiting_documents';

  const updatedCase = await Case.findOneAndUpdate(
    { caseId },
    { $set: updateData },
    { new: true }
  ).lean();

  return updatedCase;
}

async function setVerdict(caseId, verdict) {
  const updatedCase = await Case.findOneAndUpdate(
    { caseId },
    { 
      $set: { 
        verdict,
        status: 'verdict_rendered',
        'metadata.lastActivity': new Date()
      }
    },
    { new: true }
  ).lean();
  
  if (!updatedCase) {
    throw new Error('Case not found');
  }

  return updatedCase;
}

async function addArgument(caseId, argumentData) {
  const caseData = await getCase(caseId);
  
  if (!caseData) {
    throw new Error('Case not found');
  }

  const argumentWithId = {
    ...argumentData,
    id: crypto.randomBytes(4).toString('hex'),
    timestamp: argumentData.timestamp || new Date()
  };

  const currentArguments = caseData.arguments || [];
  const sideACount = currentArguments.filter(arg => arg.side === 'A').length + (argumentData.side === 'A' ? 1 : 0);
  const sideBCount = currentArguments.filter(arg => arg.side === 'B').length + (argumentData.side === 'B' ? 1 : 0);

  const updatedCase = await Case.findOneAndUpdate(
    { caseId },
    { 
      $push: { arguments: argumentWithId },
      $set: {
        status: 'arguments_phase',
        'metadata.totalArguments': currentArguments.length + 1,
        'metadata.sideAArguments': sideACount,
        'metadata.sideBArguments': sideBCount,
        'metadata.lastActivity': new Date()
      }
    },
    { new: true }
  ).lean();

  return updatedCase;
}

async function getAllCases() {
  const cases = await Case.find()
    .select('caseId title status country caseType createdAt updatedAt verdict metadata')
    .sort({ 'metadata.lastActivity': -1 })
    .lean();
  
  return cases.map(caseData => ({
    caseId: caseData.caseId,
    title: caseData.title,
    status: caseData.status,
    country: caseData.country,
    caseType: caseData.caseType,
    createdAt: caseData.createdAt,
    updatedAt: caseData.updatedAt,
    hasVerdict: !!caseData.verdict,
    totalArguments: caseData.metadata?.totalArguments || 0,
    lastActivity: caseData.metadata?.lastActivity || caseData.updatedAt
  }));
}

async function deleteCase(caseId) {
  try {
    const result = await Case.findOneAndDelete({ caseId });
    return !!result;
  } catch (error) {
    throw new Error(`Error deleting case ${caseId}: ${error.message}`);
  }
}

async function getCaseStatistics() {
  const cases = await getAllCases();
  
  const stats = {
    totalCases: cases.length,
    statusBreakdown: {},
    countryBreakdown: {},
    typeBreakdown: {},
    averageArgumentsPerCase: 0,
    casesWithVerdict: 0,
    recentActivity: cases.slice(0, 5)
  };

  let totalArguments = 0;

  cases.forEach(caseData => {
    stats.statusBreakdown[caseData.status] = (stats.statusBreakdown[caseData.status] || 0) + 1;
    stats.countryBreakdown[caseData.country] = (stats.countryBreakdown[caseData.country] || 0) + 1;
    stats.typeBreakdown[caseData.caseType] = (stats.typeBreakdown[caseData.caseType] || 0) + 1;
    totalArguments += caseData.totalArguments || 0;
    
    if (caseData.hasVerdict) {
      stats.casesWithVerdict++;
    }
  });

  if (cases.length > 0) {
    stats.averageArgumentsPerCase = Math.round((totalArguments / cases.length) * 100) / 100;
  }

  return stats;
}

async function searchCases(criteria = {}) {
  const query = {};

  if (criteria.status) {
    query.status = criteria.status;
  }

  if (criteria.country) {
    query.country = { $regex: criteria.country, $options: 'i' };
  }

  if (criteria.caseType) {
    query.caseType = criteria.caseType;
  }

  if (criteria.title) {
    query.title = { $regex: criteria.title, $options: 'i' };
  }

  if (criteria.hasVerdict !== undefined) {
    query.verdict = criteria.hasVerdict === 'true' ? { $ne: null } : null;
  }

  const cases = await Case.find(query)
    .select('caseId title status country caseType createdAt updatedAt verdict metadata')
    .sort({ 'metadata.lastActivity': -1 })
    .lean();

  return cases.map(caseData => ({
    caseId: caseData.caseId,
    title: caseData.title,
    status: caseData.status,
    country: caseData.country,
    caseType: caseData.caseType,
    createdAt: caseData.createdAt,
    updatedAt: caseData.updatedAt,
    hasVerdict: !!caseData.verdict,
    totalArguments: caseData.metadata?.totalArguments || 0,
    lastActivity: caseData.metadata?.lastActivity || caseData.updatedAt
  }));
}

const caseService = {
  createCase,
  getCase,
  saveCase,
  addDocumentsToSide,
  setVerdict,
  addArgument,
  getAllCases,
  deleteCase,
  getCaseStatistics,
  searchCases
};

export default caseService;