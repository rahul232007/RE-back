const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { errorResponse } = require('../utils/responseHelper');

const protect = async (req, res, next) => {
  try {
    // Read token from HttpOnly cookie
    const token = req.cookies?.authToken;

    if (!token) {
      return res
        .status(401)
        .json(errorResponse('Not authenticated. Please log in.'));
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check admin still exists
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json(errorResponse('Admin account no longer exists'));
    }

    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json(errorResponse('Invalid token'));
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json(errorResponse('Session expired. Please log in again.'));
    }
    console.error('Auth middleware error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

module.exports = { protect };
