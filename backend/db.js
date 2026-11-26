const mongoose = require('mongoose');

// Connects to MongoDB (Atlas or local) using MONGO_URI from .env.
// The connection is cached so serverless functions (Vercel) reuse it between requests.
let connecting = null;

module.exports = async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
      .then(() => console.log('MongoDB connected'))
      .catch((err) => {
        connecting = null; // allow a retry on the next request
        throw err;
      });
  }
  await connecting;
};
