const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Case Management Service
 * Handles all case data storage and retrieval
 * Uses JSON file storage for simplicity (could be replaced with database)
 */

// Module-level variables
const casesDir = path.join(__dirname, '..', 'data', 'cases');

// Initialize data directory
ensureDataDirectory();

/**
 * Ensure data directory exists
 */
async function ensureDataDirectory() {
  try {
    await fs.mkdir(casesDir, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

/**
 * Generate unique case ID
 * @returns {string} - Unique case identifier
 */
function generateCaseId() {
  return 'case_' + crypto.randomBytes(8).toString('hex') + '_' + Date.now();
}

/**
 * Create a new case
 * @param {Object} caseInfo - Case information
 * @returns {Promise<Object>} - Created case object
 */
async function createCase(caseInfo) {
  const caseId = generateCaseId();
  
  const newCase = {
    caseId,
    title: caseInfo.title,
    description: caseInfo.description,
    country: caseInfo.country,
    caseType: caseInfo.caseType || 'civil',
    status: 'created',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
      lastActivity: new Date().toISOString()
    }
  };

  await saveCase(newCase);
  
  return newCase;
}

/**
 * Get case by ID
 * @param {string} caseId - Case identifier
 * @returns {Promise<Object|null>} - Case data or null if not found
 */
async function getCase(caseId) {
  try {
    const casePath = path.join(casesDir, `${caseId}.json`);
    const caseData = await fs.readFile(casePath, 'utf8');
    return JSON.parse(caseData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // Case not found
    }
    throw new Error(`Error loading case ${caseId}: ${error.message}`);
  }
}

/**
 * Save case to storage
 * @param {Object} caseData - Case data to save
 * @returns {Promise<void>}
 */
async function saveCase(caseData) {
  try {
    caseData.updatedAt = new Date().toISOString();
    const casePath = path.join(casesDir, `${caseData.caseId}.json`);
    await fs.writeFile(casePath, JSON.stringify(caseData, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`Error saving case ${caseData.caseId}: ${error.message}`);
  }
}

/**
 * Add documents to a side (A or B)
 * @param {string} caseId - Case identifier
 * @param {string} side - Side ('A' or 'B')
 * @param {Object} documentData - Document information
 * @returns {Promise<Object>} - Updated case data
 */
async function addDocumentsToSide(caseId, side, documentData) {
  let caseData = await getCase(caseId);
  
  // Create new case if it doesn't exist
  if (!caseData) {
    caseData = await createCase({
      title: `Case ${caseId}`,
      description: 'Auto-created case from document upload',
      country: 'United States',
      caseType: 'civil'
    });
    // Update the case ID to match what was requested
    caseData.caseId = caseId;
  }

  const sideKey = side === 'A' ? 'sideA' : 'sideB';
  
  caseData[sideKey] = {
    description: documentData.description,
    documents: documentData.documents,
    uploadedAt: new Date().toISOString()
  };

  // Update case status
  if (caseData.sideA.documents.length > 0 && caseData.sideB.documents.length > 0) {
    caseData.status = 'ready_for_judgment';
  } else {
    caseData.status = 'awaiting_documents';
  }

  caseData.metadata.lastActivity = new Date().toISOString();

  await saveCase(caseData);
  return caseData;
}

/**
 * Set verdict for a case
 * @param {string} caseId - Case identifier
 * @param {Object} verdict - Verdict object
 * @returns {Promise<Object>} - Updated case data
 */
async function setVerdict(caseId, verdict) {
  const caseData = await getCase(caseId);
  
  if (!caseData) {
    throw new Error('Case not found');
  }

  caseData.verdict = verdict;
  caseData.status = 'verdict_rendered';
  caseData.metadata.lastActivity = new Date().toISOString();

  await saveCase(caseData);
  return caseData;
}

/**
 * Add argument to case
 * @param {string} caseId - Case identifier
 * @param {Object} argumentData - Argument information
 * @returns {Promise<Object>} - Updated case data
 */
async function addArgument(caseId, argumentData) {
  const caseData = await getCase(caseId);
  
  if (!caseData) {
    throw new Error('Case not found');
  }

  // Initialize arguments array if it doesn't exist
  if (!caseData.arguments) {
    caseData.arguments = [];
  }

  // Add the argument
  caseData.arguments.push({
    ...argumentData,
    id: crypto.randomBytes(4).toString('hex'),
    timestamp: argumentData.timestamp || new Date().toISOString()
  });

  // Update metadata
  caseData.metadata.totalArguments = caseData.arguments.length;
  caseData.metadata.sideAArguments = caseData.arguments.filter(arg => arg.side === 'A').length;
  caseData.metadata.sideBArguments = caseData.arguments.filter(arg => arg.side === 'B').length;
  caseData.metadata.lastActivity = new Date().toISOString();
  
  // Update status
  caseData.status = 'arguments_phase';

  await saveCase(caseData);
  return caseData;
}

/**
 * Get all cases (for listing)
 * @returns {Promise<Array>} - Array of case summaries
 */
async function getAllCases() {
  try {
    const files = await fs.readdir(casesDir);
    const caseFiles = files.filter(file => file.endsWith('.json'));
    
    const cases = [];
    for (const file of caseFiles) {
      try {
        const caseData = await getCase(file.replace('.json', ''));
        if (caseData) {
          // Return summary information only
          cases.push({
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
          });
        }
      } catch (error) {
        console.error(`Error loading case summary for ${file}:`, error);
        // Continue with other cases
      }
    }
    
    // Sort by last activity (most recent first)
    cases.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    
    return cases;
  } catch (error) {
    console.error('Error getting all cases:', error);
    return [];
  }
}

/**
 * Delete a case
 * @param {string} caseId - Case identifier
 * @returns {Promise<boolean>} - Success status
 */
async function deleteCase(caseId) {
  try {
    const casePath = path.join(casesDir, `${caseId}.json`);
    await fs.unlink(casePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false; // Case not found
    }
    throw new Error(`Error deleting case ${caseId}: ${error.message}`);
  }
}

/**
 * Get case statistics
 * @returns {Promise<Object>} - Statistics object
 */
async function getCaseStatistics() {
  try {
    const cases = await getAllCases();
    
    const stats = {
      totalCases: cases.length,
      statusBreakdown: {},
      countryBreakdown: {},
      typeBreakdown: {},
      averageArgumentsPerCase: 0,
      casesWithVerdict: 0,
      recentActivity: cases.slice(0, 5) // 5 most recent cases
    };

    let totalArguments = 0;

    cases.forEach(caseData => {
      // Status breakdown
      stats.statusBreakdown[caseData.status] = (stats.statusBreakdown[caseData.status] || 0) + 1;
      
      // Country breakdown
      stats.countryBreakdown[caseData.country] = (stats.countryBreakdown[caseData.country] || 0) + 1;
      
      // Type breakdown
      stats.typeBreakdown[caseData.caseType] = (stats.typeBreakdown[caseData.caseType] || 0) + 1;
      
      // Arguments
      totalArguments += caseData.totalArguments || 0;
      
      // Verdicts
      if (caseData.hasVerdict) {
        stats.casesWithVerdict++;
      }
    });

    if (cases.length > 0) {
      stats.averageArgumentsPerCase = Math.round((totalArguments / cases.length) * 100) / 100;
    }

    return stats;
  } catch (error) {
    console.error('Error getting case statistics:', error);
    return {
      totalCases: 0,
      statusBreakdown: {},
      countryBreakdown: {},
      typeBreakdown: {},
      averageArgumentsPerCase: 0,
      casesWithVerdict: 0,
      recentActivity: []
    };
  }
}

/**
 * Search cases by criteria
 * @param {Object} criteria - Search criteria
 * @returns {Promise<Array>} - Matching cases
 */
async function searchCases(criteria = {}) {
  try {
    const allCases = await getAllCases();
    
    let filtered = allCases;

    if (criteria.status) {
      filtered = filtered.filter(c => c.status === criteria.status);
    }

    if (criteria.country) {
      filtered = filtered.filter(c => c.country.toLowerCase().includes(criteria.country.toLowerCase()));
    }

    if (criteria.caseType) {
      filtered = filtered.filter(c => c.caseType === criteria.caseType);
    }

    if (criteria.title) {
      filtered = filtered.filter(c => c.title.toLowerCase().includes(criteria.title.toLowerCase()));
    }

    if (criteria.hasVerdict !== undefined) {
      filtered = filtered.filter(c => c.hasVerdict === criteria.hasVerdict);
    }

    return filtered;
  } catch (error) {
    console.error('Error searching cases:', error);
    return [];
  }
}

// Export all functions
module.exports = {
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