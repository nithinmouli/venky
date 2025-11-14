const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Gemini AI Service
 * Handles all AI interactions for the AI Judge system
 * Uses Google's Gemini 2.5 Flash model for legal analysis and judgment
 */

// Initialize the AI client and model
let genAI = null;
let model = null;

if (!process.env.GEMINI_API_KEY) {
  console.error('⚠️  Warning: GEMINI_API_KEY not found in environment variables');
} else {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      maxOutputTokens: 8192,
    },
  });
}

/**
 * Generate initial verdict based on case documents
 * @param {Object} caseData - Complete case data with both sides' documents
 * @returns {Promise<Object>} - AI Judge verdict
 */
async function generateVerdict(caseData) {
  if (!model) {
    throw new Error('Gemini API not configured. Please set GEMINI_API_KEY environment variable.');
  }

  try {
    const prompt = buildVerdictPrompt(caseData);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const verdictText = response.text();

    // Parse the structured response
    const verdict = parseVerdictResponse(verdictText);
    
    return {
      ...verdict,
      timestamp: new Date().toISOString(),
      caseId: caseData.caseId,
      country: caseData.country,
      caseType: caseData.caseType
    };

  } catch (error) {
    console.error('Error generating verdict:', error);
    throw new Error(`Failed to generate AI verdict: ${error.message}`);
  }
}

/**
 * Respond to follow-up arguments from lawyers
 * @param {Object} caseData - Current case data
 * @param {string} side - Side making the argument (A or B)
 * @param {string} argument - The argument text
 * @returns {Promise<Object>} - AI response to the argument
 */
async function respondToArgument(caseData, side, argument) {
  if (!model) {
    throw new Error('Gemini API not configured. Please set GEMINI_API_KEY environment variable.');
  }

  try {
    const prompt = buildArgumentResponsePrompt(caseData, side, argument);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Parse the structured response
    const aiResponse = parseArgumentResponse(responseText);
    
    return {
      ...aiResponse,
      timestamp: new Date().toISOString(),
      originalArgument: argument,
      side: side
    };

  } catch (error) {
    console.error('Error responding to argument:', error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

/**
 * Build the prompt for initial verdict generation
 * @param {Object} caseData - Case information
 * @returns {string} - Formatted prompt
 */
function buildVerdictPrompt(caseData) {
  const sideADocs = formatDocuments(caseData.sideA?.documents || []);
  const sideBDocs = formatDocuments(caseData.sideB?.documents || []);

  return `You are an experienced AI Judge trained on the legal system of ${caseData.country}. You are presiding over a ${caseData.caseType} case: "${caseData.title}".

CASE DESCRIPTION:
${caseData.description}

CASE TYPE: ${caseData.caseType}
JURISDICTION: ${caseData.country}

PLAINTIFF/SIDE A SUBMISSIONS:
Description: ${caseData.sideA?.description || 'No description provided'}
Documents and Evidence:
${sideADocs}

DEFENDANT/SIDE B SUBMISSIONS:
Description: ${caseData.sideB?.description || 'No description provided'}
Documents and Evidence:
${sideBDocs}

INSTRUCTIONS:
As an AI Judge, you must:
1. Analyze all evidence and arguments from both sides objectively
2. Apply the relevant laws and legal principles of ${caseData.country}
3. Consider precedents and established legal doctrines
4. Provide a fair and reasoned judgment
5. Explain your legal reasoning clearly
6. Be open to reconsideration if compelling new arguments are presented

Please provide your initial verdict in the following JSON format:
{
  "decision": "favor_side_a" | "favor_side_b" | "split_decision" | "insufficient_evidence",
  "reasoning": "Detailed explanation of your legal reasoning and analysis",
  "keyFindings": ["List of key factual findings that influenced your decision"],
  "legalPrinciples": ["Relevant laws, statutes, or legal principles applied"],
  "damages": "If applicable, any damages or remedies awarded",
  "notes": "Any additional judicial notes or considerations",
  "confidence": 0.0-1.0,
  "openToReconsideration": true/false
}

Render your verdict based on the evidence presented, applying ${caseData.country} law and legal standards.`;
}

/**
 * Build the prompt for responding to follow-up arguments
 * @param {Object} caseData - Case information
 * @param {string} side - Side making argument
 * @param {string} argument - The argument text
 * @returns {string} - Formatted prompt
 */
function buildArgumentResponsePrompt(caseData, side, argument) {
  const previousArguments = formatPreviousArguments(caseData.arguments || []);
  const sideName = side === 'A' ? 'Plaintiff' : 'Defendant';

  return `You are the AI Judge in the case: "${caseData.title}"

CURRENT VERDICT SUMMARY:
Decision: ${caseData.verdict?.decision || 'Not yet decided'}
Reasoning: ${caseData.verdict?.reasoning || 'No initial reasoning available'}

PREVIOUS ARGUMENTS IN THIS CASE:
${previousArguments}

NEW ARGUMENT FROM ${sideName.toUpperCase()} (SIDE ${side}):
"${argument}"

INSTRUCTIONS:
1. Consider this new argument in the context of your previous verdict
2. Analyze if this argument presents new evidence, legal precedent, or reasoning
3. Determine if this argument warrants modification of your initial verdict
4. Apply ${caseData.country} legal standards and principles
5. Maintain judicial impartiality and objectivity
6. Be open to changing your mind if the argument is compelling and legally sound

Please respond in the following JSON format:
{
  "response": "Your detailed judicial response to this argument",
  "verdictChange": "none" | "minor_modification" | "significant_change" | "reversal",
  "newReasoning": "If verdict changed, explain the new reasoning",
  "addressedPoints": ["Specific points from the argument you addressed"],
  "remainingConcerns": ["Any concerns or questions still outstanding"],
  "legalCitations": ["Any relevant laws, cases, or precedents referenced"],
  "confidence": 0.0-1.0,
  "requestsClarification": "Any clarification needed from either side"
}

Judge this argument fairly and thoroughly, demonstrating the careful consideration expected in ${caseData.country} courts.`;
}

/**
 * Format documents for inclusion in prompts
 * @param {Array} documents - Array of document objects
 * @returns {string} - Formatted document text
 */
function formatDocuments(documents) {
  if (!documents || documents.length === 0) {
    return "No documents submitted.";
  }

  return documents.map((doc, index) => {
    return `Document ${index + 1}: ${doc.filename}
Content Preview: ${truncateText(doc.extractedText, 2000)}
---`;
  }).join('\n\n');
}

/**
 * Format previous arguments for context
 * @param {Array} argumentsList - Array of previous arguments
 * @returns {string} - Formatted arguments text
 */
function formatPreviousArguments(argumentsList) {
  if (!argumentsList || argumentsList.length === 0) {
    return "No previous arguments in this case.";
  }

  return argumentsList.map((arg, index) => {
    const sideName = arg.side === 'A' ? 'Plaintiff' : 'Defendant';
    return `Argument ${index + 1} - ${sideName}:
"${arg.argument}"

AI Judge Response:
${arg.aiResponse?.response || 'No response recorded'}
---`;
  }).join('\n\n');
}

/**
 * Parse the structured verdict response from Gemini
 * @param {string} response - Raw AI response
 * @returns {Object} - Parsed verdict object
 */
function parseVerdictResponse(response) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
  } catch (error) {
    console.error('Error parsing verdict JSON:', error);
  }

  // Fallback: return a structured response based on the raw text
  return {
    decision: "insufficient_evidence",
    reasoning: response,
    keyFindings: [],
    legalPrinciples: [],
    damages: null,
    notes: "Response could not be parsed into structured format",
    confidence: 0.5,
    openToReconsideration: true
  };
}

/**
 * Parse the structured argument response from Gemini
 * @param {string} response - Raw AI response
 * @returns {Object} - Parsed response object
 */
function parseArgumentResponse(response) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
  } catch (error) {
    console.error('Error parsing argument response JSON:', error);
  }

  // Fallback: return a structured response based on the raw text
  return {
    response: response,
    verdictChange: "none",
    newReasoning: null,
    addressedPoints: [],
    remainingConcerns: [],
    legalCitations: [],
    confidence: 0.5,
    requestsClarification: null
  };
}

/**
 * Truncate text to a maximum length while preserving word boundaries
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength = 1000) {
  if (!text || text.length <= maxLength) {
    return text || '';
  }

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '... [truncated]';
  }
  
  return truncated + '... [truncated]';
}

/**
 * Generate case summary for quick reference
 * @param {Object} caseData - Case information
 * @returns {Promise<string>} - Generated summary
 */
async function generateCaseSummary(caseData) {
  if (!model) {
    throw new Error('Gemini API not configured.');
  }

  const prompt = `Provide a concise legal summary of this case:

Case: ${caseData.title}
Type: ${caseData.caseType}
Jurisdiction: ${caseData.country}

Description: ${caseData.description}

Summarize in 2-3 sentences the core legal issues and disputes involved.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating case summary:', error);
    return 'Case summary generation failed.';
  }
}

// Export all functions
module.exports = {
  generateVerdict,
  respondToArgument,
  generateCaseSummary
};