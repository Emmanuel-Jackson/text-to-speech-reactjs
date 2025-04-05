const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy; 
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'https://api.speechaura.com/api/auth/google/callback',
  passReqToCallback: true
},
async (req, accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        displayName: profile.displayName
      });
    }
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));
passport.use(new MicrosoftStrategy({
  clientID: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/api/auth/microsoft/callback`,
  scope: ['user.read'],
  tenant: 'common', // Add this for multi-tenant support
  authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize', // Explicit URL
  tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token' // Explicit URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Microsoft Profile Data:', profile); // Debug logging
    
    const email = profile.emails?.[0]?.value?.toLowerCase() 
      || `${profile.id}@microsoft.temp`;
    
    const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User';
    const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';

    let user = await User.findOneAndUpdate(
      { $or: [{ microsoftId: profile.id }, { email }] },
      { 
        $set: {
          microsoftId: profile.id,
          email,
          firstName,
          lastName,
          lastLogin: new Date()
        }
      },
      { new: true, upsert: true }
    );

    console.log('Microsoft Auth Successful for:', user.email); // Debug
    done(null, user);
  } catch (error) {
    console.error('Microsoft Auth Error:', error);
    done(error);
  }
}));