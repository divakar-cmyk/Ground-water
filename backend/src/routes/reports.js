const express = require('express');
const reportsController = require('../controllers/reports.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', verifyToken, reportsController.generateReport);

module.exports = router;
