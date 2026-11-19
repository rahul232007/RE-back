const mongoose = require('mongoose');

const connectDB = async (retry = 0) => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rahul_enterprises';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`🍃 MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
      console.warn('⚠️ App is trying to connect to a local MongoDB instance (127.0.0.1), which does not exist in cloud deployment.');
      console.warn('👉 Please set MONGODB_URI to your MongoDB Atlas connection string:');
      console.warn('   Example: fly secrets set MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/rahul_enterprises"');
    }

    // Auto-retry connection in background without terminating the process
    if (retry < 20) {
      const delay = Math.min(5000 * (retry + 1), 30000);
      console.log(`🔄 Retrying MongoDB connection in ${delay / 1000}s (attempt ${retry + 1})...`);
      setTimeout(() => connectDB(retry + 1), delay);
    }
  }
};

module.exports = connectDB;
