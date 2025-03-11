const router = require('express').Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// Add at the very top of the file
console.log('Google Strategy Client ID:', process.env.GOOGLE_CLIENT_ID);
console.log('Google Callback URL:', `${process.env.BACKEND_URL}/api/auth/google/callback`);

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
  proxy: true,
  scope: ['profile', 'email'],
  userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo' // Critical fix
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value.toLowerCase().trim();
    
    // Name extraction with multiple fallbacks
    const firstName = profile._json.given_name || 
                     profile.displayName?.split(' ')[0] || 
                     email.split('@')[0].replace(/[^a-zA-Z]/g, ' ') || 
                     'User';
    const lastName = profile._json.family_name || 
                    profile.displayName?.split(' ').slice(1).join(' ') || 
                    '';

    let user = await User.findOne({ 
      $or: [
        { googleId: profile.id },
        { email }
      ]
    });

    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email,
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });
    } else {
      if (!user.firstName || !user.lastName) {
        user.firstName = firstName.trim();
        user.lastName = lastName.trim();
        await user.save();
      }
    }

    return done(null, user);
  } catch (error) {
    console.error('Google auth error:', error);
    return done(error);
  }
}));

// Google Routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.redirect(`${process.env.CLIENT_URL}/auth?token=${token}`);
  }
);

// Registration Route
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // Validate existing user
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        error: 'EMAIL_EXISTS'
      });
    }

    // Create user
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      password
    });

    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'REGISTRATION_FAILED' 
    });
  }
});
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
      .select('-password -__v -createdAt');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
  // In your verifyAuth function

});
// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'LOGIN_FAILED' });
  }
});

module.exports = router;