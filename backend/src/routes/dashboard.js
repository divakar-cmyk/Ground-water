const express = require('express');
const summaryController = require('../controllers/summary.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/summary', verifyToken, summaryController.getDashboardSummary);

module.exports = router;
