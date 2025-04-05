const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // 1. Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Find user with active token
    const user = await User.findOne({
      _id: decoded.id,
      // tokens: token // Uncomment if implementing token invalidation
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 4. Attach user and token to request
    req.user = user;
    req.token = token;
    next();

  } catch (error) {
    console.error('Auth error:', error.message);
    
    // Specific error messages
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(401).json({ error: 'Authentication required' });
  }
};

module.exports = auth;