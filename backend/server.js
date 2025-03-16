require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const passport = require('passport');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();

// 🔹 1. Trust Proxy (for HTTPS handling behind Nginx)
app.set('trust proxy', 1);

// 🔹 2. Add before routes (Security Headers)
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

// 🔹 3. CORS Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://speechaura.com',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// 🔹 4. Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));  // Ensures proper request body parsing
app.use(passport.initialize());
require('./config/passport');

// 🔹 5. Database connection
connectDB();

// 🔹 6. Root route (Fix for "Cannot GET /")
app.get('/', (req, res) => {
  res.send('API is working!');
});

// 🔹 7. Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// 🔹 8. API Routes
app.use('/api/auth', authRoutes);

// 🔹 9. Error handling middleware (Improved Logging)
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 🔹 10. Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});
