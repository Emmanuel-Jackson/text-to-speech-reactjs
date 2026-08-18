import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { FaLightbulb, FaBookOpen, FaFileUpload, FaFont, FaSave, FaMicrophone, FaKeyboard, FaBook, FaInfinity, FaDollarSign } from 'react-icons/fa';
import { Link } from 'react-router-dom';
const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const { verifyAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      setDarkMode(JSON.parse(savedMode));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

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
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google?prompt=consent&access_type=offline`;
  };

  const handleMicrosoftLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/microsoft`;
  };

  const Footer = () => (
    <footer className="app-footer-auth">
      <div className="footer-left">
        <div className="footer-logo-wrapper">
          <span className="footer-logo-text">Speech</span>
          <span className="footer-logo-aura-container">
            <span className="footer-logo-aura-bg"></span>
            <span className="footer-logo-aura-text">Aura</span>
          </span>
        </div>
        <p className="footer-developer">Developed by Elijah Jackson</p>
        <p className="copyright">© {new Date().getFullYear()} Speech Aura. All rights reserved</p>
        <div className="footer-links">
          <Link to="/terms" className="footer-link">Terms of Use</Link>
          <span className="footer-link-separator">•</span>
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>
        </div>
      </div>
  
      <div className="footer-center"></div>
  
      <div className="footer-right">
      </div>
    </footer>
  );

  return (
    <div className="auth-container">
      <div className="mobile-notice">
        <div className="desktop-emoji">💻</div>
        <div className="mobile-text">
          <p className="mobile-title">Desktop Experience Recommended</p>
          <p className="mobile-subtitle">For optimal performance, please use a computer browser</p>
        </div>
      </div>

      <div className="auth-grid">
        {/* Left Section - Modern Welcome */}
        <div className="welcome-section">
          <div className="app-brand">
            <h1 className="app-name">
              <span className="brand-speech">Speech</span>
              <span className="brand-aura">Aura</span>
            </h1>
            <p className="app-tagline">A free unlimited student tool.</p>
          </div>

          <div className="fact-bio-compact">
            <div className="fact-card">
              <div className="fact-icon">🔍</div>
              <div className="fact-content">
                <h3>Did you know?</h3>
                <p>80% of special education students experience dyslexia.</p>
              </div>
            </div>
            <p className="bio-text">
            A <strong>free, unlimited text-to-speech software solution</strong> developed by <strong>Elijah Jackson</strong>, a passionate high school developer. Inspired by the need for better dyslexia support for students, <strong>Speech Aura</strong> helps break down barriers with:
            </p>
          </div>

          <div className="modern-features-grid">
        {/* Column 1 */}
        <div className="feature-column">
          <div className="modern-feature-card">
            <div className="feature-emoji">♾️</div>
            <div className="feature-text">
              <h4>Unlimited Words</h4>
              <p>100% Free With No Word Limits</p>
            </div>
          </div>

          <div className="modern-feature-card">
            <div className="feature-emoji">📄</div>
            <div className="feature-text">
              <h4>Save & Upload Documents</h4>
              <p>PDFs, Images, and URLs With Text Extraction</p>
            </div>
          </div>

          <div className="modern-feature-card">
            <div className="feature-emoji">🖋️</div>
            <div className="feature-text">
              <h4>Dyslexic Font</h4>
              <p>OpenDyslexic For Better Readability</p>
            </div>
          </div>
        </div>
        
        {/* Column 2 */}
        <div className="feature-column">
          <div className="modern-feature-card">
            <div className="feature-emoji">🎙️</div>
            <div className="feature-text">
              <h4>Speech Tools</h4>
              <p>Voice-to-text and Effective Reading Tracking</p>
            </div>
          </div>

          <div className="modern-feature-card">
            <div className="feature-emoji">📚</div>
            <div className="feature-text">
              <h4>Dictionary</h4>
              <p>Built-in Word Definitions</p>
            </div>
          </div>

          <div className="modern-feature-card">
            <div className="feature-emoji">💲</div>
            <div className="feature-text">
              <h4>Zero Cost</h4>
              <p>No Subscriptions Ever</p>
            </div>
          </div>
        </div>
      </div>
        </div>

        {/* Right Section - Auth */}
        <div className="auth-section">
          <div className="auth-card">
            <div className="icon-container">
              <LockClosedIcon className="auth-icon" />
            </div>
            
            <h2 className="auth-heading">
              {isLogin ? 'Welcome Back' : 'Create Account'}
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
              <div className="divider-container">
                <div className="divider-line"></div>
                <div className="divider-line"></div>
              </div>
              
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