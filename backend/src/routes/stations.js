const express = require('express');
const { body } = require('express-validator');
const stationsController = require('../controllers/stations.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Verify the token if one is supplied, otherwise skip to the next handler.
function optionalAuth(req, res, next) {
  if (req.headers.authorization) return verifyToken(req, res, next);
  next();
}

router.get('/',    optionalAuth, stationsController.getStations);
router.get('/active-count', stationsController.getActiveStationsCount);
router.get('/:id', optionalAuth, stationsController.getStationById);

router.post(
  '/',
  verifyToken,
  isAdmin,
  [
    body('station_name').trim().notEmpty().withMessage('Station name is required'),
    body('critical_threshold_m').isFloat({ min: 0 }).withMessage('Critical threshold must be a positive number'),
    body('safe_decline_limit').isFloat({ min: 0 }).withMessage('Safe decline limit must be a positive number'),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 })
  ],
  stationsController.createStation
);

router.put(
  '/:id',
  verifyToken,
  isAdmin,
  [
    body('station_name').optional().trim().notEmpty(),
    body('critical_threshold_m').optional().isFloat({ min: 0 }),
    body('safe_decline_limit').optional().isFloat({ min: 0 }),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 })
  ],
  stationsController.updateStation
);

router.delete(
  '/:id',
  verifyToken,
  isAdmin,
  stationsController.deleteStation
);

module.exports = router;
