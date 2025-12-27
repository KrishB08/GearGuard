const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Server is running, but database features will not work.');
    // process.exit(1); // Keep server running for UI demo purposes
  }
};

module.exports = connectDB;
