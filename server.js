require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

// In Fly.io / Docker containers, default port is 8080 and host must be 0.0.0.0
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

// Start listening immediately so cloud health checks pass and container does not crash
app.listen(PORT, HOST, () => {
  console.log(`✅ Rahul Enterprises API listening on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Connect to MongoDB asynchronously with auto-retry
connectDB();
