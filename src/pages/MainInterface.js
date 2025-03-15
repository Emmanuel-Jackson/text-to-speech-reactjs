import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";
import { FaPlay, FaPause, FaStop, FaCopy, FaSun, FaMoon, FaCog, FaTimes, FaTrashAlt, FaRunning, FaFileUpload, FaSignOutAlt, FaStepBackward, FaStepForward, FaRobot, FaDownload } from "react-icons/fa";
import { getDocument } from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import { createWorker } from 'tesseract.js';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';


export default function MainInterface() {
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
  const [isListening, setIsListening] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [isTyping, setIsTyping] = useState(false);
  const wordsRef = useRef([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [fontFamily, setFontFamily] = useState(() => {
    const savedFont = localStorage.getItem('fontFamily') || 'OpenDyslexic';
    return savedFont;
  });
  const [fontSize, setFontSize] = useState(() => {
    const savedSize = localStorage.getItem('fontSize');
    return savedSize ? parseInt(savedSize) : 16;
  });
  const [letterSpacing, setLetterSpacing] = useState(() => {
    const savedSpacing = localStorage.getItem('letterSpacing');
    return savedSpacing ? parseFloat(savedSpacing) : 1.5;
  });
    // New features state
    const [fontSettings, setFontSettings] = useState(() => {
      const savedFont = localStorage.getItem('fontSettings');
      return savedFont ? JSON.parse(savedFont) : {
        family: 'OpenDyslexic',
        size: 16,
        spacing: 1.5
      };
    });
    const [isProcessing, setIsProcessing] = useState(false);


    const synthesis = window.speechSynthesis;
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    const utteranceRef = useRef(null);
    const outputRef = useRef(null);
    const fileInputRef = useRef(null);
    const [estimatedTime, setEstimatedTime] = useState("0:00");
    const [currentSettings, setCurrentSettings] = useState({
      volume: 1,
      pitch: 1,
      rate: 1
    });
    const [selectedLanguage, setSelectedLanguage] = useState(
      localStorage.getItem('selectedLanguage') || 'en-US'
    );
    useEffect(() => {
      localStorage.setItem('fontSize', fontSize);
      localStorage.setItem('letterSpacing', letterSpacing);
    }, [fontSize, letterSpacing]);
    useEffect(() => {
      const words = text.split(/\s+/).filter(word => word).length;
      const minutes = words / (150 * currentSettings.rate); // 150 words/min base speed
      const seconds = Math.floor((minutes % 1) * 60);
      setEstimatedTime(`${Math.floor(minutes)}:${seconds.toString().padStart(2, '0')}`);
    }, [text, currentSettings.rate]);
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
 
    // Add dyslexia font effect
   // useEffect(() => {
      //document.documentElement.style.setProperty('--dyslexia-font', fontFamily);
   // }, [fontFamily]);

   useEffect(() => {
    localStorage.setItem('fontFamily', fontFamily);
  }, [fontFamily]);
 
    // Document upload handler

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    } else {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);


  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0) {
        const matchingVoice = availableVoices.find(v => v.lang === selectedLanguage) || availableVoices[0];
        setSelectedVoice(matchingVoice);
      }
    };

    if (synthesis.onvoiceschanged !== undefined) {
      synthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();

    return () => {
      synthesis.onvoiceschanged = null;
    };
  }, [selectedLanguage]);

  // Handle font change
  const handleFontChange = (e) => {
    const newFont = e.target.value;
    setFontFamily(newFont);
    document.documentElement.style.setProperty('--main-font', newFont);
  };
  // Handle language change
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    localStorage.setItem('selectedLanguage', newLanguage);
  };
  useEffect(() => {
    recognition.continuous = true; // Enable continuous listening
    recognition.interimResults = true; // Get interim results


    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setText(transcript); // Update text with the recognized speech
    };


    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };


    return () => {
      synthesis.cancel();
      recognition.abort();
    };
  }, []);


  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);


    return () => clearInterval(timer);
  }, []);


  useEffect(() => {
    if (text.length > 0) {
      setIsTyping(true);
      const timeout = setTimeout(() => setIsTyping(false), 1000); // Reset after 1 second of inactivity
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [text]);


  const handleSpeak = () => {

    if (showSettings) {
      setShowSettings(false);
    }
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


    if (!text) return;


    wordsRef.current = text.split(" ");
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;


    utterance.volume = volume;
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.voice = selectedVoice;


    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentWordIndex(-1);
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

    synthesis.speak(utterance);
  };


  const handleCancel = () => {
    synthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setText("");
    wordsRef.current = [];
  };


  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setShowCopyPopup(true);
    setTimeout(() => setShowCopyPopup(false), 2000); // Hide popup after 2 seconds
  };


  const handleClear = () => {
    synthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setText("");
    wordsRef.current = [];
  };


  useEffect(() => {
    const savedText = localStorage.getItem('savedText');
    if (savedText) setText(savedText);
  }, []);
 
  useEffect(() => {
    localStorage.setItem('savedText', text);
  }, [text]);


  const Footer = () => (
    <footer className="app-footer">
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


  const speakWord = (word) => {
    synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.voice = selectedVoice;
    utterance.volume = volume;
    utterance.pitch = pitch;
    utterance.rate = rate;
    synthesis.speak(utterance);
  };


  return (
  <div className="app-container">
  <header className="header">
    <div className="header-left">
      <h1 className="gradient-title-main-interface">Speech Aura</h1>
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
  <div classroom="profile-info">
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
      <span className="auth-prompt">
          Sign in to unlock saving features
      </span>
        )}
</div>
</div>
</div>

  </header>

  <div className="mobile-notice">
  <div className="desktop-emoji">💻</div>
  <span className="mobile-title-text"> Oops! This application is designed for desktop use only.<br /></span> <span className="mobile-subtitle-text">✨ For the best user experience, please access it from a computer.</span>
  </div>
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
          <button className="icon-button" onClick={handleCopy} disabled={!text}>
            <FaCopy />
          </button>
          <button className="icon-button" onClick={handleClear} disabled={!text}>
          <FaTrashAlt />
          </button>
          <div className="settings-dropdown">
          <button 
                className={`icon-button ${isSpeaking && !isPaused ? 'disabled' : ''}`}
                onClick={() => setShowSettings(!showSettings)}
                disabled={isSpeaking || isPaused}
              >
                <FaCog />
              </button>


            {showSettings && (
          <div className="dropdown-content">
            <div className="close-setting-container">
            <button
            style={{cursor:"pointer"}}onClick={() => setShowSettings(false)}
            className="close-settings"
            >
            Close <FaTimes />
            </button>
            </div>
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
                   </label>
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
                   </label>
                   <div className="dyslexia-controls">
                <label>
                  Font Size:
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                  />
                </label>
                <label>
                  Letter Spacing:
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={letterSpacing}
                    onChange={(e) => setLetterSpacing(Number(e.target.value))}
                  />
                </label>
            </div>
                 </div>
               )}
          </div>
          <div className="voice-dropdown">
          <select
                className={`voice-select ${darkMode ? 'dark' : 'light'}`}
                value={selectedVoice?.name || ""}
                onChange={(e) => setSelectedVoice(voices.find(v => v.name === e.target.value))}
                disabled={isSpeaking || isPaused}
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
                fontFamily: fontFamily,
                fontSize: `${fontSize}px`,
                letterSpacing: `${letterSpacing}px`,
                backgroundColor: darkMode ? '#2d2d2d' : '#ffffff'
              }}
              placeholder="Enter Text..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={true}
              disabled={isSpeaking}
            />
        <div className="font-controls">
        <select
                value={fontFamily}
                onChange={handleFontChange}
                className={`font-select ${darkMode ? 'dark' : 'light'}`}
              >
                <option value="OpenDyslexic">OpenDyslexic</option>
                <option value="Arial">Arial</option>
                <option value="Comic Sans MS">Comic Sans</option>
              </select>
              <select
                value={selectedLanguage}
                onChange={handleLanguageChange}
                disabled={isSpeaking || isPaused}
                className={`language-select ${darkMode ? 'dark' : 'light'}`}
              >
                <option value="en-US">English (US) Accent</option>
                <option value="es-ES">Spanish Accent</option>
                <option value="fr-FR">French Accent</option>
                <option value="de-DE">German Accent</option>
              </select>
        </div>
        <div className="word-count">
          {text.split(/\s+/).filter(word => word).length} words, {text.length} characters
        </div>
        <div className="metrics">
            <span>Est. time: {estimatedTime}</span>
          </div>
      </div>


<div className="output-section">
  <div className="output" ref={outputRef}>
    {text.split(/\s+/).map((word, index) => (
      <span
        key={index}
        className={`word ${index === currentWordIndex ? "highlight" : ""}`}
        style={{ fontFamily: fontFamily, fontSize: `${fontSize}px`, letterSpacing: `${letterSpacing}px` }}
      >
        {word}{" "}
      </span>
    ))}
  </div>
</div>
    </div>


  <div className="controls">

  <button
    className="control-button"
    onClick={handleSpeak}
    disabled={!text}
    style={{ 
      backgroundColor: isSpeaking && !isPaused ? '#ff6b6b' : '#4ecdc4' 
    }}
  >
    {isSpeaking && !isPaused ? <FaPause /> : <FaPlay />}
    {isSpeaking && !isPaused ? "Pause" : "Play"}
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


  {showCopyPopup && (
    <div className="copy-popup">
      <span>Text copied to clipboard!</span>
    </div>
  )}
        {isProcessing && (
        <div className="processing-overlay">
          Processing {fileInputRef.current?.files[0]?.type.startsWith('image/') ? 'image' : 'PDF'}...
        </div>
      )}
    <Footer />
  </div>

);
}