require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const passport = require('passport');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');

const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    'https://speechstudio.vercel.app',
    'http://localhost:3000' // Add local development
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware order matters!
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self';" +
    "script-src 'self' https://accounts.google.com 'unsafe-inline';" +
    "frame-src https://accounts.google.com;" +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;" +
    "font-src 'self' https://fonts.gstatic.com data:;" +
    "img-src 'self' data: https://lh3.googleusercontent.com;"
  );
  next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Explicit preflight handling
app.use(express.json());
app.use(passport.initialize());
require('./config/passport');

// Database connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

// Enhanced health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    services: {
      database: 'connected',
      ai: 'enabled'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});