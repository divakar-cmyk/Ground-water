const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Provide a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').optional().isIn(['admin', 'researcher', 'viewer']).withMessage('Invalid system role')
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Provide a valid email address'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  authController.login
);

module.exports = router;
