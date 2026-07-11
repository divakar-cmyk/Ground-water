const express = require('express');
const { body } = require('express-validator');
const readingsController = require('../controllers/readings.controller');

const router = express.Router();

router.post(
  '/',
  [
    body('station_id').isInt({ min: 1 }).withMessage('Valid station_id is required'),
    body('water_level_m').isFloat({ min: 0, max: 300 }).withMessage('water_level_m must be between 0 and 300'),
    body('recorded_at').notEmpty().withMessage('recorded_at timestamp is required')
  ],
  readingsController.createReading
);

module.exports = router;
