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
        <div className="email-wrapper">
          <a href="mailto:Emjackson107@gmail.com" className="modern-email-link">
            <svg className="email-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Contact Me - Emjackson107@gmail.com
          </a>
        </div>
        
        <a 
          href="https://www.paypal.com/paypalme/SpeechAura" 
          className="donate-link"
          target="_blank" 
          rel="noopener noreferrer"
        >
          💖 Donate to Help Improve The Website 
        </a>
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
      <div className="coming-soon-section">
        <div className="coming-soon-badge">Coming Soon</div>
        <div className="coming-soon-text" style={{ fontSize: '.74rem' }}>
          <ul className="coming-soon-list" style={{ padding: '0.1rem', margin: '0.4rem 0' }}>
            <li>Realistic Voices</li>
            <li>AI Assistant</li>
            <li>MP3 Download</li>
          </ul>
        </div>
      </div>
          <div className="donate-section">
            <a 
              href="https://www.paypal.com/paypalme/SpeechAura" 
              className="donate-cta"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <span className="donate-icon">💖</span>
              <div className="donate-text">
                <p><strong>Support Our Mission</strong></p>
                <p>Help improve accessibility for students with learning differences</p>
              </div>
            </a>
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
                <span className="divider-text">or continue with</span>
                <div className="divider-line"></div>
              </div>
              
              <div className="social-login-buttons">
                <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
                  <button 
                    onClick={handleGoogleLogin}
                    className="social-button google-custom"
                  >
                    <span className="google-logo">
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </span>
                    <span className="social-button-text">Continue with Google</span>
                  </button>
                </GoogleOAuthProvider>

                <button 
                  onClick={handleMicrosoftLogin}
                  className="social-button microsoft"
                >
                  <span className="microsoft-logo">
                  </span>
                  <span className="social-button-text">Continue with Microsoft</span>
                </button>
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