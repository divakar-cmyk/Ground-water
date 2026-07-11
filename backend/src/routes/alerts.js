const express = require('express');
const alertsController = require('../controllers/alerts.controller');
const { verifyToken, isResearcherOrAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', verifyToken, alertsController.getAlerts);
router.put('/:id/resolve', verifyToken, isResearcherOrAdmin, alertsController.resolveAlert);

module.exports = router;
