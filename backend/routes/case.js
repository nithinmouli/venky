import express from 'express';
import caseService from '../services/caseService.js';
import geminiService from '../services/geminiService.js';

const router = express.Router();

const MAX_ARGUMENTS_PER_SIDE = 5;

router.post('/create', async (req, res) => {
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

router.get('/:caseId', async (req, res) => {
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

router.post('/:caseId/judge', async (req, res) => {
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

    const verdict = await geminiService.generateVerdict(caseData);
    const updatedCase = await caseService.setVerdict(caseId, verdict);
    
    req.app.get('io').emit('verdictRendered', { caseId, verdict });

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

router.post('/:caseId/argue', async (req, res) => {
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

    const currentArguments = caseData.arguments || [];
    const sideArguments = currentArguments.filter(arg => arg.side === side);
    
    if (sideArguments.length >= MAX_ARGUMENTS_PER_SIDE) {
      return res.status(400).json({ 
        error: `Maximum number of arguments (${MAX_ARGUMENTS_PER_SIDE}) reached for this side` 
      });
    }

    const aiResponse = await geminiService.respondToArgument(caseData, side, argument);
    
    const updatedCase = await caseService.addArgument(caseId, {
      side,
      argument,
      aiResponse,
      timestamp: new Date().toISOString(),
      argumentNumber: sideArguments.length + 1
    });

    req.app.get('io').emit('newArgument', { 
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
      remainingArguments: MAX_ARGUMENTS_PER_SIDE - (sideArguments.length + 1)
    });

  } catch (error) {
    console.error('Argument submission error:', error);
    res.status(500).json({ error: 'Failed to process argument' });
  }
});

router.delete('/:caseId', async (req, res) => {
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

export default router;
