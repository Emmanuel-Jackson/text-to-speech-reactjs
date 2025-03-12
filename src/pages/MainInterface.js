import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";
import { FaPlay, FaPause, FaStop, FaCopy, FaSun, FaMoon, FaCog, FaTimes, FaFileUpload, FaSignOutAlt, FaStepBackward, FaStepForward } from "react-icons/fa";
import { getDocument } from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import { createWorker } from 'tesseract.js';
import { useAuth } from '../context/AuthContext';

export default function MainInterface() {
  // State variables
  const [text, setText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : true;
  });
  const [volume, setVolume] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [isProcessing, setIsProcessing] = useState(false);
  const [fontSettings, setFontSettings] = useState({
    family: 'OpenDyslexic',
    size: 16,
    spacing: 1.5
  });

  // Refs and hooks
  const wordsRef = useRef([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const synthesis = window.speechSynthesis;
  const utteranceRef = useRef(null);
  const outputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Text-to-speech functions
  const handleSpeak = () => {
    if (!text) return;

    if (isSpeaking && !isPaused) {
      synthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isSpeaking && isPaused) {
      synthesis.resume();
      setIsPaused(false);
      return;
    }

    // Split text into words
    wordsRef.current = text.split(/\s+/).filter(word => word);

    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(wordsRef.current.join(' '));
    utteranceRef.current = utterance;

    // Set speech parameters
    utterance.volume = volume;
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.voice = selectedVoice;

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentWordIndex(0);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
    };

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const charIndex = event.charIndex;
        const currentWord = text.substr(0, charIndex).split(/\s+/).length - 1;
        setCurrentWordIndex(currentWord);
      }
    };

    // Start speaking
    synthesis.speak(utterance);
  };

  const handleCancel = () => {
    synthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
  };

  // Real-time parameter updates
  useEffect(() => {
    if (isSpeaking && utteranceRef.current) {
      const currentText = wordsRef.current.slice(currentWordIndex).join(' ');
      const newUtterance = new SpeechSynthesisUtterance(currentText);
      
      newUtterance.volume = volume;
      newUtterance.pitch = pitch;
      newUtterance.rate = rate;
      newUtterance.voice = selectedVoice;
      newUtterance.onboundary = utteranceRef.current.onboundary;
      newUtterance.onend = utteranceRef.current.onend;

      synthesis.cancel();
      synthesis.speak(newUtterance);
      utteranceRef.current = newUtterance;
    }
  }, [volume, pitch, rate]);

  // Skip functionality
  const handleSkip = (steps) => {
    const newIndex = Math.max(0, 
      Math.min(currentWordIndex + steps, wordsRef.current.length - 1)
    );
    
    if (isSpeaking) {
      const utterance = new SpeechSynthesisUtterance(
        wordsRef.current.slice(newIndex).join(' ')
      );
      
      utterance.volume = volume;
      utterance.pitch = pitch;
      utterance.rate = rate;
      utterance.voice = selectedVoice;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setCurrentWordIndex(newIndex);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentWordIndex(-1);
      };

      synthesis.cancel();
      synthesis.speak(utterance);
      utteranceRef.current = utterance;
    } else {
      setCurrentWordIndex(newIndex);
    }
  };

  // File upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    setIsProcessing(true);
    try {
      if (file.type === 'application/pdf') {
        const pdf = await getDocument({
          data: await file.arrayBuffer(),
          workerSrc: pdfjsWorker
        }).promise;
        
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ');
        }
        setText(text);
      } else if (file.type.startsWith('image/')) {
        const worker = await createWorker();
        try {
          const { data: { text } } = await worker.recognize(file);
          setText(text);
        } finally {
          await worker.terminate();
        }
      }
    } catch (error) {
      console.error("File processing error:", error);
      alert(`Error processing file: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-scroll functionality
  useEffect(() => {
    if (outputRef.current && currentWordIndex !== -1) {
      const words = outputRef.current.getElementsByClassName('word');
      if (words.length > 0 && currentWordIndex < words.length) {
        words[currentWordIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [currentWordIndex]);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synthesis.getVoices();
      setVoices(availableVoices);
      setSelectedVoice(availableVoices[0]);
    };
    synthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => synthesis.onvoiceschanged = null;
  }, []);

  // Dark mode
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    document.body.classList.toggle("dark-mode", darkMode);
    document.body.classList.toggle("light-mode", !darkMode);
  }, [darkMode]);

  // Footer component
  const Footer = () => (
    <footer className="app-footer">
      <div className="footer-left">
        <h3 className="footer-title">Speech Studio</h3>
        <p>Developed by Elijah Jackson</p>
        <p className="copyright">© 2025 Speech Studio. All rights reserved</p>
      </div>
      <div className="footer-right">
        <p className="email-footer">Contact Email - <a href="mailto:Emjackson107@gmail.com">Emjackson107@gmail.com</a></p>
        <a 
          href="https://paypal.me/SpeechStudio?country.x=US&locale.x=en_US" 
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
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1 className="gradient-title-main-interface">Speech Studio</h1>
          <div className="subtitle">Unlimited Words. Free. No Complexity.</div>
        </div>
        <div className="header-right">
          <div className="time-date-container">
            <div className="current-time">{time}</div>
            <div className="current-date">{new Date().toLocaleDateString()}</div>
          </div>
          <div className="profile-container">
            <div className="profile-icon">
              {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              {(user?.lastName?.[0] || '').toUpperCase()}
            </div>
            <div className="profile-info">
              <div className="welcome-text">
                {user?.firstName 
                  ? `Welcome, ${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
                  : `Welcome, ${user?.email?.split('@')[0] || 'User'}`
                }
              </div>
              {user ? (
                <button onClick={logout} className="logout-btn">
                  <FaSignOutAlt className="logout-icon" />
                </button>
              ) : (
                <span className="auth-prompt">Sign in to unlock saving features</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="main-content">
        <div className="text-areas">
          <div className="input-section">
            <div className="textarea-header">
              <button className="mode-toggle" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <FaSun /> : <FaMoon />}
              </button>
              <button className="icon-button" onClick={() => fileInputRef.current.click()}>
                <FaFileUpload />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button className="icon-button" onClick={() => navigator.clipboard.writeText(text)}>
                <FaCopy />
              </button>
              <button className="icon-button" onClick={() => setText('')}>
                <FaTimes />
              </button>
              <div className="settings-dropdown">
                <button className="icon-button" onClick={() => setShowSettings(!showSettings)}>
                  <FaCog />
                </button>
                {showSettings && (
                  <div className="dropdown-content">
                    <label>
                      Speed:
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={rate}
                        onChange={(e) => setRate(parseFloat(e.target.value))}
                      />
                      {rate}x
                    </label>
                    <label>
                      Pitch:
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={pitch}
                        onChange={(e) => setPitch(parseFloat(e.target.value))}
                      />
                      {pitch}
                    </label>
                    <label>
                      Volume:
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                      />
                      {volume}
                    </label>
                  </div>
                )}
              </div>
              <div className="voice-dropdown">
                <select
                  className={`voice-select ${darkMode ? 'dark' : 'light'}`}
                  value={selectedVoice?.name || ""}
                  onChange={(e) => setSelectedVoice(voices.find(v => v.name === e.target.value))}
                >
                  {voices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <textarea
              className="text-area"
              style={{
                fontFamily: fontSettings.family,
                fontSize: `${fontSettings.size}px`,
                letterSpacing: `${fontSettings.spacing}px`
              }}
              placeholder="Enter Text..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <select
              value={fontSettings.family}
              onChange={(e) => setFontSettings(prev => ({...prev, family: e.target.value}))}
            >
              <option value="OpenDyslexic">OpenDyslexic</option>
              <option value="Arial">Arial</option>
              <option value="Comic Sans MS">Comic Sans</option>
            </select>
            <div className="word-count">
              {text.split(/\s+/).filter(word => word).length} words, {text.length} characters
            </div>
          </div>

          <div className="output-section">
            <div className="output" ref={outputRef}>
              {text.split(/\s+/).map((word, index) => (
                <span
                  key={index}
                  className={`word ${index === currentWordIndex ? "highlight" : ""}`}
                >
                  {word}{" "}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="controls">
          <button
            className="control-icon"
            onClick={() => handleSkip(-1)}
            disabled={!text || (isSpeaking && !isPaused)}
          >
            <FaStepBackward />
          </button>
          <button
            className="control-button"
            onClick={handleSpeak}
            disabled={!text}
          >
            {isSpeaking && !isPaused ? <FaPause /> : <FaPlay />}
            {isSpeaking && !isPaused ? "Pause" : "Play"}
          </button>
          <button
            className="control-icon"
            onClick={() => handleSkip(1)}
            disabled={!text || (isSpeaking && !isPaused)}
          >
            <FaStepForward />
          </button>
          <button
            className="control-button"
            onClick={handleCancel}
            disabled={!isSpeaking}
          >
            <FaStop /> Cancel
          </button>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}