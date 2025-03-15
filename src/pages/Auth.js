import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { LockClosedIcon } from '@heroicons/react/24/outline';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const { verifyAuth } = useAuth();
  const navigate = useNavigate();

  // Handle Google redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    if (token) {
      localStorage.setItem('token', token);
      verifyAuth().then(() => navigate('/'));
    }
    if (error) setError(error.replace(/_/g, ' '));
  }, [navigate, verifyAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
   
    try {
      const endpoint = isLogin ? '/login' : '/register';
      const payload = isLogin ? {
        email: email.trim(),
        password
      } : {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password
      };
  
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth${endpoint}`,
        payload
      );
  
      localStorage.setItem('token', res.data.token);
      await verifyAuth();
      navigate('/');
    } catch (err) {
      const errorKey = err.response?.data?.error;
      const errorMessages = {
        EMAIL_EXISTS: 'It looks like you already have an account. User Already Exists.',
        INVALID_CREDENTIALS: 'Wrong password or email. Please try again.',
        REGISTRATION_FAILED: 'Registration failed. Please try again.',
        LOGIN_FAILED: 'Login failed. Please try again.'
      };
     
      setError(errorMessages[errorKey] || 'Authentication failed');
    }
  };
  const handleGoogleLogin = () => {
    // Use this EXACT URL format
    // In your frontend Google login button
  window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google?prompt=consent&access_type=offline`;
  };

  const Footer = () => (
    <footer className="app-footer-auth">
      <div className="footer-left">
        <h3 className="footer-title">Speech Aura</h3>
        <p>Developed by Elijah Jackson</p>
        <p className="copyright">© 2025 Speech Aura. All rights reserved</p>
      </div>
  
      <div className="footer-center">
      </div>
  
      <div className="footer-right">
      <p className="email-footer">Contact Email - <a href="mailto:Emjackson107@gmail.com">Emjackson107@gmail.com</a></p>

        {/*}
        <div className="social-icons">
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
            <img src="tiktok-icon.svg" alt="TikTok" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <img src="instagram-icon.svg" alt="Instagram" />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
            <img src="youtube-icon.svg" alt="YouTube" />
          </a>
        </div>
        /** */}
        <a 
          href="https://www.paypal.com/paypalme/SpeechAura" 
          className="donate-link"
          target="_blank" 
          rel="noopener noreferrer"
        >
          💖 Donate! To Help Improve The Website 
        </a>
      </div>
    </footer>
  );


  return (
    <div className="auth-container">
              <div className="mobile-notice">
            <div className="desktop-emoji">💻</div>
            <span className="mobile-title-text">
              Oops! This application is designed for desktop use only.<br />
            </span>
            <span className="mobile-subtitle-text">
              ✨ For the best user experience, please access it from a computer.
            </span>
          </div>
    <div className="auth-grid">
      {/* Left Section */}
      <div className="welcome-section">
        <h1 className="gradient-title animate-gradient" style={{ fontSize: '2.62rem' }}>
          Welcome to Speech Aura
        </h1>

        <div className="bio-text">
          <p className="lead">Did you know? Approximately 80% of students in special education experience dyslexia. Meet Speech Aura, an interactive web tool—</p>
          <p className="description-bio">A <strong>free, unlimited text-to-speech solution</strong> developed by <strong>Elijah Jackson</strong>, a passionate high school developer. 
          Inspired by the need for better dyslexia support, <strong>Speech Aura</strong> helps break down barriers with:
          </p>
          <ul className="feature-list">
            <li>✅ 100% free unlimited words</li>
            <li>📄 Document uploads (PDF/images)</li>
            <li>🎙️ Real-time speech tracking</li>
            <li>🔒 Zero subscriptions</li>
            <li>🖋️ Offer OpenDyslexic font</li>
          </ul>
        </div>
      </div>

      {/* Right Section */}
      <div className="auth-section">
  <div className="auth-card">
    <div className="icon-container">
      <LockClosedIcon className="auth-icon" />
    </div>
    
    <h2 className="auth-heading">
      {isLogin ? 'Welcome Back!' : 'Get Started'}
    </h2>
      {error && (
      <div className="auth-error">
        ⚠️ {error}
      </div>
    )}
    <form onSubmit={handleSubmit} className="auth-form">
    {!isLogin && (
              <div className="name-fields">
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="auth-input"
                  required
                />
                <div className="name-spacer" /> {/* Added spacer */}
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>
            )}
           
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
            />
           
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
              minLength="6"
            />


            <button type="submit" className="auth-button primary">
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
    </form>

    <div className="auth-footer">
      <div className="divider">
        <span>or continue with</span>
      </div>

      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div className="google-login-button">

        <GoogleLogin
          onSuccess={() => {
            window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
          }}
          onError={() => setError('Google login failed')}
          shape="pill"
          width="350"
        />
        </div>
      </GoogleOAuthProvider>

      <p className="auth-switch">
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <button 
          type="button" 
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          className="auth-link"
        >
          {isLogin ? ' Sign Up' : ' Sign In'}
        </button>
      </p>
    </div>
  </div>
</div>
</div>
<Footer />
</div>
  );
};

export default Auth;
