const prisma = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered', code: 'EMAIL_EXISTS' });
    }

    let targetRole = 'viewer';
    if (role && ['admin', 'researcher', 'viewer'].includes(role)) {
      const authHeader = req.headers['authorization'];
      if (authHeader) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeychangeitinproduction');
          if (decoded.role === 'admin') targetRole = role;
        } catch { /* keep viewer */ }
      }
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password_hash, role: targetRole },
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user_id: user.user_id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'supersecretjwtkeychangeitinproduction',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { register, login };
