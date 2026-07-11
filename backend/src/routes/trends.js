const express = require('express');
const trendsController = require('../controllers/trends.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/:id/readings', verifyToken, trendsController.getHistoricalReadings);
router.get('/:id/trend', verifyToken, trendsController.getStationTrendAndForecast);

module.exports = router;
