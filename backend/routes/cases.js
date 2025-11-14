import express from 'express';
import caseService from '../services/caseService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const cases = await caseService.getAllCases();
    res.json(cases);
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({ error: 'Failed to retrieve cases' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const criteria = req.query;
    const cases = await caseService.searchCases(criteria);
    res.json(cases);
  } catch (error) {
    console.error('Search cases error:', error);
    res.status(500).json({ error: 'Failed to search cases' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await caseService.getCaseStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

export default router;
