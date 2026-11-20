const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
});

const setCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: isProduction,
    // The Vercel frontend and Fly.io API are on different sites.
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json(errorResponse('Email and password are required'));
    }
    const admin = await Admin.findByEmail(email);
    if (!admin || !(await Admin.comparePassword(password, admin.password))) {
      return res.status(401).json(errorResponse('Invalid email or password'));
    }
    await Admin.updateLastLogin(admin.id);
    const token = signToken(admin.id);
    setCookie(res, token);
    delete admin.password;
    admin.lastLogin = new Date();
    return res.status(200).json(successResponse('Login successful', { admin }));
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json(errorResponse('Server error during login'));
  }
};

const logout = (req, res) => {
  res.clearCookie('authToken', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return res.status(200).json(successResponse('Logged out successfully'));
};

const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json(errorResponse('Admin not found'));
    return res.status(200).json(successResponse('Admin retrieved', { admin }));
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

module.exports = { login, logout, getMe };
