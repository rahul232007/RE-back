const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rahul_enterprises';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`🍃 MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
};

module.exports = connectDB;
