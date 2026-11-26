const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const auth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Make sure the database is connected before any other /api route runs
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    res.status(503).json({ message: 'Database connection failed' });
  }
});

// Public routes
app.use('/api/auth', require('./routes/auth'));

// Protected routes (JWT required)
app.use('/api/company', auth, require('./routes/company'));
app.use('/api/clients', auth, require('./routes/clients'));
app.use('/api/invoices', auth, require('./routes/invoices'));
app.use('/api/dashboard', auth, require('./routes/dashboard'));

// If the React app is built, serve it from the same server (single deployment)
const dist = path.join(__dirname, '../frontend/dist');
app.use(express.static(dist));
app.get('/{*any}', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(dist, 'index.html'), (err) => err && next());
});

// Central error handler
app.use((err, req, res, next) => {
  if (err.name === 'CastError') return res.status(404).json({ message: 'Record not found' });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

// Local / Render / Railway: start a normal server.
// Vercel: the exported app is used as a serverless function instead.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
    .catch((err) => {
      console.error('Could not connect to MongoDB. Check MONGO_URI in .env\n', err.message);
      process.exit(1);
    });
}

module.exports = app;
