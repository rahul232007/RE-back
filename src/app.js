const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { isDatabaseConnected } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const projectRoutes = require('./routes/projectRoutes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// ─── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://re-front.vercel.app',
  'https://rahul-enterprises-ten.vercel.app',
  ...(process.env.FRONTEND_URLS || '').split(',').map((origin) => origin.trim()),
  process.env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── GLOBAL RATE LIMITING ──────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ─── BODY PARSING ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── LOGGING ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── HEALTH CHECKS (Supports root, /health, and /api/health for Fly.io/Docker) ──
app.get(['/', '/health', '/api/health'], async (req, res) => {
  const dbStatus = (await isDatabaseConnected()) ? 'connected' : 'connecting_or_disconnected';
  res.status(200).json({
    success: true,
    message: 'Rahul Enterprises API is running',
    port: process.env.PORT || 8080,
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── ROUTES ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/projects', projectRoutes);

// ─── 404 & ERROR HANDLERS ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
