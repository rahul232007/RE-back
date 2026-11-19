const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// ─── SEED ADMIN (called on startup if no admin exists) ────────────────────────
const seedAdmin = async () => {
  try {
    const count = await Admin.countDocuments();
    if (count === 0) {
      await Admin.create({
        email: process.env.ADMIN_EMAIL || 'admin@rahulenterprises.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        name: 'Administrator',
      });
      console.log('👤 Default admin account created');
    }
  } catch (err) {
    console.error('❌ Error seeding admin:', err.message);
  }
};
seedAdmin();

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const setCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

// ─── CONTROLLERS ──────────────────────────────────────────────────────────────

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json(errorResponse('Email and password are required'));
    }

    // Find admin and explicitly select password
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json(errorResponse('Invalid email or password'));
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    const token = signToken(admin._id);
    setCookie(res, token);

    return res.status(200).json(
      successResponse('Login successful', {
        admin: admin.toJSON(),
      })
    );
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json(errorResponse('Server error during login'));
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  res.clearCookie('authToken', { path: '/' });
  return res.status(200).json(successResponse('Logged out successfully'));
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json(errorResponse('Admin not found'));
    }
    return res.status(200).json(successResponse('Admin retrieved', { admin }));
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

module.exports = { login, logout, getMe };
