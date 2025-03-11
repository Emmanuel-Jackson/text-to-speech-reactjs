require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const passport = require('passport');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
// Add before routes
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
// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
  
  // Handle preflight requests
app.options('*', cors());
app.use(express.json());
app.use(passport.initialize());
require('./config/passport');

// Database connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});