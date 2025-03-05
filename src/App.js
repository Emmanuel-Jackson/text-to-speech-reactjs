import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { FaPlay, FaPause, FaStop, FaCopy, FaSun, FaMoon, FaMicrophone, FaCog, FaTimes, FaVolumeUp } from "react-icons/fa";

export default function App() {
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

  const synthesis = window.speechSynthesis;
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  const utteranceRef = useRef(null);

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
        setSelectedVoice(availableVoices[0]);
      }
    };

    synthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      synthesis.onvoiceschanged = null;
    };
  }, []);

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

  const handleListen = () => {
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleClear = () => {
    setText("");
    wordsRef.current = [];
  };

  return (
    <div className="app-container">
<header className="header">
  <div className="header-left">
    <h1 className="gradient-title">Speech Studio</h1>
    <div className="subtitle">Unlimited Words. Free. No Complexity.</div>
  </div>
  
  <div className="time-date">
    <div className="time">{time}</div>
    <div className="date">{new Date().toLocaleDateString()}</div>
  </div>
</header>

      <div className="main-content">
        <div className="text-areas">
          {/* Input Section */}
          <div className="input-section">
            <div className="textarea-header">
        <button
          className="mode-toggle"
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
              <button className="icon-button" onClick={handleCopy}>
                <FaCopy />
              </button>
              <button className="icon-button" onClick={handleClear}>
                <FaTimes />
              </button>
              <div className="settings-dropdown">
                <button
                  className="icon-button"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <FaCog />
                </button>
                {showSettings && (
                  <div className="dropdown-content">
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
                  </div>
                )}
              </div>
              <div className="voice-dropdown">
                <select
                  value={selectedVoice ? selectedVoice.name : ""}
                  onChange={(e) => {
                    const voice = voices.find((v) => v.name === e.target.value);
                    setSelectedVoice(voice);
                  }}
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
              placeholder="Enter Text..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="word-count">
              {text.split(/\s+/).filter((word) => word.length > 0).length} words, {text.length} characters
            </div>
          </div>

          {/* Output Section */}
          <div className="output-section">
            <div className="output">
              {isTyping ? "Typing..." : wordsRef.current.map((word, index) => (
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

        <div className="controls">
          <button
            className="control-button"
            onClick={handleSpeak}
            disabled={!text}
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
    </div>
  );
}