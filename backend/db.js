const mongoose = require('mongoose');

// Connects to MongoDB (Atlas or local) using MONGO_URI from .env
module.exports = async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
};
