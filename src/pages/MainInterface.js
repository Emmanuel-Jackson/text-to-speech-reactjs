import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";
import { FaPlay, FaPause, FaStop, FaCopy, FaSun, FaMoon, FaCog, FaTimes, FaTrashAlt, FaFileUpload, FaSignOutAlt, FaStepBackward, FaStepForward, FaBold, FaPlus, FaFileAlt, FaMicrophone, FaMicrophoneSlash  } from "react-icons/fa";
import { getDocument } from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import { createWorker } from 'tesseract.js';
import { useAuth } from '../context/AuthContext';
import SavedDocuments from './SavedDocuments';
import SaveDocumentPopup from '../components/SaveDocumentPopup';
import useDocuments from '../hooks/useDocuments';


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
  const [transcribedText, setTranscribedText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const wordsRef = useRef([]);
  const [showDocDropdown, setShowDocDropdown] = useState(false);
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);



  const synthesis = window.speechSynthesis;
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  const utteranceRef = useRef(null);
  const textAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [estimatedTime, setEstimatedTime] = useState("0:00");
  const [selectedLanguage, setSelectedLanguage] = useState(
    localStorage.getItem('selectedLanguage') || 'en-US'
  );
  const [isBold, setIsBold] = useState(() => {
    return localStorage.getItem('isBold') === 'true';
  });
  const {
    showSavePopup,
    setShowSavePopup,
    showDocumentsPopup,
    setShowDocumentsPopup,
    saveNotification,
    saveDocument,
    currentDocument,
    setCurrentDocument,
    hasChanges,
    setHasChanges
  } = useDocuments();

  const recognitionRef = useRef(null);
  
  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = selectedLanguage;

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscribedText(interimTranscript);
      if (finalTranscript) {
        setText(prevText => prevText + (prevText ? ' ' : '') + finalTranscript);
      }
    };

    recognitionRef.current.onerror = (event) => {
      if (event.error !== 'no-speech') { // Ignore 'no-speech' errors
        console.error("Speech recognition error:", event.error);
      }
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      if (isListening) {
        recognitionRef.current.start();
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [selectedLanguage]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setText(prevText => prevText + (prevText && transcribedText ? ' ' : '') + transcribedText);
      setTranscribedText('');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsListening(false);
      }
    }
  };

  useEffect(() => {
    if (currentDocument && text !== currentDocument.content) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [text, currentDocument]);

  useEffect(() => {
    localStorage.setItem('isBold', isBold);
  }, [isBold]);


  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('letterSpacing', letterSpacing);
    localStorage.setItem('fontFamily', fontFamily);
  }, [fontSize, letterSpacing, fontFamily]);




  useEffect(() => {
    wordsRef.current = text.split(/\s+/).filter(word => word);
    const words = wordsRef.current.length;
    const minutes = words / (150 * rate);
    const seconds = Math.floor((minutes % 1) * 60);
    setEstimatedTime(`${Math.floor(minutes)}:${seconds.toString().padStart(2, '0')}`);
  }, [text, rate]);




  // Calculate progress
  useEffect(() => {
    const totalWords = wordsRef.current.length;
    const calculatedProgress = totalWords > 0 ? ((currentWordIndex + 1) / totalWords) * 100 : 0;
    setProgress(calculatedProgress);
  }, [currentWordIndex, text]);




  // Auto-scroll during speech
  useEffect(() => {
    if (textAreaRef.current && currentWordIndex !== -1) {
      const words = textAreaRef.current.getElementsByClassName('word');
      if (words.length > 0 && currentWordIndex < words.length) {
        const wordElement = words[currentWordIndex];
        const container = textAreaRef.current;
        const wordRect = wordElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
       
        const scrollPosition = wordRect.top - containerRect.top + container.scrollTop - (containerRect.height / 2);
       
        container.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [currentWordIndex]);




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




  const handleFontChange = (e) => {
    const newFont = e.target.value;
    setFontFamily(newFont);
  };




  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    localStorage.setItem('selectedLanguage', newLanguage);
  };




  useEffect(() => {
    recognition.continuous = true;
    recognition.interimResults = true;




    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setText(transcript);
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
      const timeout = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [text]);




  const speakText = (textToSpeak, startIndex = 0) => {
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;




    utterance.volume = volume;
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.voice = selectedVoice;




    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentWordIndex(startIndex - 1);
    };




    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
      setIsEditable(true);
    };




    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const utteranceText = textToSpeak.substr(0, event.charIndex);
        const utteranceWords = utteranceText.split(/\s+/).length - 1;
        setCurrentWordIndex(startIndex + utteranceWords);
      }
    };




    synthesis.speak(utterance);
  };




  const handlePlayPause = () => {
    if (showSettings) setShowSettings(false);
   
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
   
    setIsEditable(false);
    speakText(text);
  };




  const handleSkip = (direction) => {
    if (!isSpeaking && !isPaused) return;
   
    synthesis.cancel();
    const words = wordsRef.current;
    let newIndex = currentWordIndex;
   
    if (direction === 'backward') {
      newIndex = Math.max(currentWordIndex - 10, 0);
    } else {
      newIndex = Math.min(currentWordIndex + 10, words.length - 1);
    }
   
    const newText = words.slice(newIndex).join(' ');
    speakText(newText, newIndex);
  };




  const handleCancel = () => {
    synthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setIsEditable(true);
    setCurrentWordIndex(-1);
  };




  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setShowCopyPopup(true);
    setTimeout(() => setShowCopyPopup(false), 2000);
  };




  const handleClear = () => {
    synthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setIsEditable(true);
    setCurrentWordIndex(-1);
    setText("");
  };




  useEffect(() => {
    const savedText = localStorage.getItem('savedText');
    if (savedText) setText(savedText);
  }, []);




  useEffect(() => {
    localStorage.setItem('savedText', text);
  }, [text]);


  const handleSaveDocument = async (title, isUpdate = false) => {
    const success = await saveDocument(title, text, isUpdate);
    if (success) {
      setShowSavePopup(false);
    }
  };

const handleDocumentSelect = (content, document) => {
  setCurrentDocument(document);
  setText(content);
  setHasChanges(false);
};
  const renderHighlightedText = () => {
    return (
      <div
        className={`text-content ${isSpeaking ? 'speaking' : ''}`}
        style={{
          fontFamily: fontFamily,
          fontSize: `${fontSize}px`,
          letterSpacing: `${letterSpacing}px`,
          fontWeight: isBold ? '900' : '400',
          minHeight: '100%'
        }}
      >
        {text.split(/\s+/).map((word, index) => (
          <span
            key={index}
            className={`word ${index === currentWordIndex ? "highlight" : ""}`}
          >
            {word}{" "}
          </span>
        ))}
      </div>
    );
  };




  const Footer = () => (
    <footer className="app-footer">
      <div className="footer-left">
        <h3 className="footer-title">Speech Aura</h3>
        <p>Developed by Elijah Jackson</p>
        <p className="copyright">© 2025 Speech Aura. All rights reserved</p>
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


  const calculateRemainingTime = () => {
    const remaining = wordsRef.current.length - currentWordIndex - 1;
    const minutes = Math.floor(remaining / (150 * rate));
    const seconds = Math.floor((remaining % (150 * rate)) / (150 * rate) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
 
  const textareaValue = isListening ? (text + (text && transcribedText ? ' ' : '') + transcribedText) : text;

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
        <span className="mobile-title-text"> Oops! This application is designed for desktop use only.<br /></span>
        <span className="mobile-subtitle-text">✨ For the best user experience, please access it from a computer.</span>
      </div>




      <div className="main-content">
        <div className="text-areas">
          <div className="input-section">
            <div className="textarea-header">
            <button 
                className="icon-button" 
                onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                data-tooltip={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <FaSun /> : <FaMoon />}
              </button>
              <button className="icon-button" onClick={() => fileInputRef.current.click()} disabled={isSpeaking || isPaused} data-tooltip="Upload file (PDF/image)" title="Upload file (PDF/image)">
                <FaFileUpload />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button className="icon-button" onClick={handleCopy} disabled={!text}
              data-tooltip="Copy text to clipboard" title="Copy text to clipboard"
              >
                <FaCopy />
              </button>
              <button className="icon-button" onClick={handleClear} disabled={!text} data-tooltip="Clear all text" title="Clear all text">
                <FaTrashAlt />
              </button>
              <button
                className={`icon-button ${isBold ? 'active' : ''}`}
                onClick={() => setIsBold(!isBold)}
                title="Toggle Bold"
                disabled={isSpeaking || isPaused}
                data-tooltip="Toggle bold text"
              >
                <FaBold />
              </button>
            {user && (
          <div className="documents-dropdown">
            <button 
              className="icon-button"
              onClick={() => setShowDocDropdown(!showDocDropdown)}
              disabled={isSpeaking || isPaused}
              title="Document options"
              data-tooltip="Document options"
            >
              <FaFileAlt />
            </button>
            {showDocDropdown && (
              <div className="doc-dropdown-content">
                <button 
                  onClick={() => {
                    setShowDocumentsPopup(true);
                    setShowDocDropdown(false);
                  }}
                >
                  Your Documents
                </button>
                {text && (
                  <button 
                    onClick={() => {
                      setShowSavePopup(true);
                      setShowDocDropdown(false);
                    }}
                    disabled={!text.trim()}
                  >
                    {currentDocument ? 'Update Document' : 'Save Document'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      <button 
        className={`icon-button ${isListening ? 'listening' : ''}`}
        onClick={toggleListening}
        title={isListening ? 'Stop microphone' : 'Start voice input'}
        data-tooltip={isListening ? 'Stop microphone' : 'Start voice input'}
        disabled={isSpeaking || isPaused}
      >
        {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
      </button>
              <div className="settings-dropdown">
                <button
                  className={`icon-button ${isSpeaking && !isPaused ? 'disabled' : ''}`}
                  onClick={() => setShowSettings(!showSettings)}
                  disabled={isSpeaking || isPaused}
                  data-tooltip="Settings" 
                  title="Settings"
                >
                  <FaCog />
                </button>


                {showSettings && (
                  <div className="dropdown-content">
                    <div className="close-setting-container">
                      <button
                        style={{cursor:"pointer"}}
                        onClick={() => setShowSettings(false)}
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
                          max="55"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                        />
                      </label>
                      <label>
                        Letter Spacing:
                        <input
                          type="range"
                          min="1"
                          max="15"
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
                  title="Select voice"
                >
                  {voices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>




            <div
              className={`text-area ${isSpeaking ? 'disabled' : ''}`}
              ref={textAreaRef}
              style={{
                backgroundColor: darkMode ? '#2d2d2d' : '#ffffff',
                width: '1000px',
                height: '350px',
                overflowY: 'auto',
                padding: '15px',
                borderRadius: '10px',
                border: darkMode ? '1px solid #444' : '1px solid #ccc',
                fontFamily: fontFamily,
                fontSize: `${fontSize}px`,
                fontWeight: isBold ? '900' : '400',
                letterSpacing: `${letterSpacing}px`
              }}
            >
              {isEditable ? (
                <>
                <textarea
                placeholder={isListening ? "Listening... Speak now. Click microphone when done" : "Type or paste your text here"}
                value={textareaValue}
                onChange={(e) => setText(e.target.value)}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  resize: 'none',
                  background: 'transparent',
                  color: 'inherit',
                  fontFamily: fontFamily,
                  fontSize: `${fontSize}px`,
                  letterSpacing: `${letterSpacing}px`,
                  fontWeight: isBold ? '900' : '400',
                  outline: 'none'
                }}
                />
            {isListening && (
              <div className="listening-indicator">
                <div className="pulse-animation"></div>
                Listening...
              </div>
            )}
                </>
              ) : (
                renderHighlightedText()
              )}
            </div>




            <div className="font-language-controls">
              <select
                value={fontFamily}
                onChange={handleFontChange}
                className={`font-select ${darkMode ? 'dark' : 'light'}`}
              >
                <option value="OpenDyslexic">OpenDyslexic Mode ✨</option>
                <option value="Arial">Arial</option>
                <option value="Comic Sans MS">Comic Sans</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Impact">Impact</option>
                <option value="Lucida Console">Lucida Console</option>
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




            <div className="metrics-controls-container">
              <div className="text-metrics">
                <span className="word-count">{wordsRef.current.length} words</span>
                <span className="character-count">{text.length} characters</span>
                <span className="estimated-time">Est. time: {isSpeaking || isPaused ? calculateRemainingTime() : estimatedTime}</span>
              </div>
              <div className="playback-controls">
                <div className="controls-row">
                  <button className="control-icon" onClick={() => handleSkip('backward')}
                    disabled={!isSpeaking && !isPaused}>
                    <FaStepBackward />
                  </button>
                 
                  <button className="control-icon" onClick={handlePlayPause}
                    style={{ backgroundColor: isSpeaking && !isPaused ? '#ff6b6b' : '#4ecdc4' }}
                    disabled={!text}>
                    {isSpeaking && !isPaused ? <FaPause /> : <FaPlay />}
                  </button>
                 
                  <button className="control-icon" onClick={() => handleSkip('forward')}
                    disabled={!isSpeaking && !isPaused}>
                    <FaStepForward />
                  </button>
                 
                  <button className="control-icon" onClick={handleCancel}
                    disabled={!isSpeaking}>
                    <FaStop />
                  </button>
                </div>
               
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>
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


        {user && (
          <>
            <SavedDocuments
              isOpen={showDocumentsPopup}
              onClose={() => setShowDocumentsPopup(false)}
              onDocumentSelect={handleDocumentSelect}
              currentText={text}
              setCurrentDocument={setCurrentDocument}
            />
            
            <SaveDocumentPopup
              isOpen={showSavePopup}
              onClose={() => {
                setShowSavePopup(false);
                setCurrentDocument(null);
              }}
              onSave={handleSaveDocument}
              initialContent={text}
              currentDocument={currentDocument}
            />
            
            {saveNotification && (
              <div className={`save-notification ${currentDocument ? 'update' : ''}`}>
                {currentDocument ? 'Document updated!' : 'Document saved!'}
              </div>
            )}
          </>
        )}

      <Footer />
    </div>
  );
}
