import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaUser, FaCog, FaTrash, FaCheck, FaTimes, FaSun, FaMoon, FaChevronDown } from 'react-icons/fa';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  icon,
  darkMode
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay">
      <div className={`confirm-modal ${darkMode ? 'dark' : 'light'}`}>
        {icon && <div className="modal-icon">{icon}</div>}
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
        <button className="cancel-btn" onClick={onClose} style={{ background: '#ff6b6b', color: '#ffffff' }}>
            Cancel
        </button>
          <button className="confirm-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsPopup = ({ 
  isOpen, 
  onClose, 
  darkMode, 
  setDarkMode,
  setSelectedLanguage,
  selectedLanguage,
}) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [originalName, setOriginalName] = useState({ first: '', last: '' });
  const [email, setEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      if (user.firstName) {
        setFirstName(user.firstName);
        setLastName(user.lastName || '');
        setOriginalName({ first: user.firstName, last: user.lastName || '' });
      }
    }
  }, [user]);

  useEffect(() => {
    if (user?.firstName) {
      const nameChanged = firstName !== originalName.first || lastName !== originalName.last;
      setHasChanges(nameChanged);
    }
  }, [firstName, lastName, originalName, user]);

  const handleSaveProfile = async () => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/auth/profile`,
        { firstName, lastName },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setOriginalName({ first: firstName, last: lastName });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/auth/account`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      logout();
      onClose();
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    localStorage.setItem('selectedLanguage', newLanguage);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="settings-popup-overlay">
        <div 
          className={`settings-popup ${darkMode ? 'dark' : 'light'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="settings-header">
            <h3>Profile Settings</h3>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          <div className="settings-content">
            <div className="settings-sidebar">
              <button
                className={`sidebar-tab ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => setActiveTab('account')}
              >
                <FaUser className="tab-icon" />
                <span>Account</span>
              </button>
              <button
                className={`sidebar-tab ${activeTab === 'preferences' ? 'active' : ''}`}
                onClick={() => setActiveTab('preferences')}
              >
                <FaCog className="tab-icon" />
                <span>Preferences</span>
              </button>
            </div>

            <div className="settings-main">
              {activeTab === 'account' ? (
                <div className="account-settings">
                  <h4 className="accountinfo-title">Account Information</h4>
                  
                  {user?.firstName ? (
                    <>
                      <div className="form-group">
                        <label>First Name</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          maxLength={20}
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          maxLength={20}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="form-group">
                      <label>Display Name</label>
                      <input
                        type="text"
                        value={`${firstName} ${lastName}`.trim()}
                        onChange={(e) => {
                          const names = e.target.value.split(' ');
                          setFirstName(names[0] || '');
                          setLastName(names.slice(1).join(' ') || '');
                        }}
                        maxLength={20}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="disabled-input"
                    />
                  </div>

                  <div className="form-actions">
                    <button 
                      className="save-btn" 
                      onClick={handleSaveProfile}
                      disabled={!hasChanges}
                    >
                      <FaCheck /> Save Changes
                    </button>
                  </div>

                  <div className="delete-section">
                    <div className="delete-item">
                      <span>Delete My Account</span>
                      <button 
                        className="delete-btn" 
                        onClick={() => setShowDeleteAccountModal(true)}
                        disabled={isDeleting}
                      >
                        <FaTrash /> {isDeleting ? 'Deleting...' : 'Delete Account'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="preferences-settings">
                  <h4 className="preferences-title">Preferences</h4>
                  
                  <div className="preference-item">
                    <div className="preference-header">
                      <h5>Theme</h5>
                      <div className="theme-options">
                        <button
                          className={`theme-option ${!darkMode ? 'active' : ''}`}
                          onClick={() => setDarkMode(false)}
                          title="Light Mode"
                        >
                          <FaSun />
                        </button>
                        <button
                          className={`theme-option ${darkMode ? 'active' : ''}`}
                          onClick={() => setDarkMode(true)}
                          title="Dark Mode"
                        >
                          <FaMoon />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/**
                  <div className="preference-item"> 
                    <div className="preference-header">
                      <h5>Default Language</h5>
                      <div className="language-selector-settings">
                        <select
                          value={selectedLanguage}
                          onChange={handleLanguageChange}
                        >
                          {languageOptions.map((lang) => (
                            <option key={lang.code} value={`${lang.code}-${lang.code.toUpperCase()}`}>
                              {lang.flag} {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to permanently delete your account? All your data will be removed."
        confirmText={isDeleting ? "Deleting..." : "Delete Account"}
        cancelText="Cancel"
        darkMode={darkMode}
      />

      <ConfirmModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onClose();
        }}
        title="Changes Saved"
        message="Your profile changes have been successfully saved."
        darkMode={darkMode}
      />
    </>
  );
};

export default SettingsPopup;