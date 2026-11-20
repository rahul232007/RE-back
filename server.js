require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { seedDefaultAdmin } = require('./src/utils/seedAdmin');

// In Fly.io / Docker containers, default port is 8080 and host must be 0.0.0.0
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

// Start listening immediately so cloud health checks pass and container does not crash
app.listen(PORT, HOST, () => {
  console.log(`✅ Rahul Enterprises API listening on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Initialize PostgreSQL after the HTTP listener is available for Fly health checks.
const initializeDatabase = async () => {
  try {
    await connectDB();
    await seedDefaultAdmin();
  } catch (err) {
    console.error(`❌ PostgreSQL initialization failed: ${err.message}`);
    const retry = setTimeout(initializeDatabase, 10_000);
    retry.unref();
  }
};

initializeDatabase();
