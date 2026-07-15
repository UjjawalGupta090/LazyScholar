const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const scoreRoutes = require('./routes/scores');

const app = express();
const PORT = process.env.PORT || 5001;

// Trust reverse proxy (Render load balancers) for rate limiting
app.set('trust proxy', 1);

// CORS configuration - support client origin from Vite (default localhost:5173)
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lazy-scholar')
  .then(() => console.log('Connected to local MongoDB database.'))
  .catch(err => {
    console.error('MongoDB database connection error:', err);
    process.exit(1);
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/scores', scoreRoutes);

// Server status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve frontend static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Lazy Scholar Arcade API is running in development mode.');
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    message: 'An unexpected error occurred on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

app.listen(PORT, () => {
  console.log(`Lazy Scholar Server is running on port ${PORT}`);
});
