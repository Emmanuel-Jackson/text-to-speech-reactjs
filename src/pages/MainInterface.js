import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";
import { FaPlay, FaPause, FaStop, FaCopy, FaSun, FaMoon, FaTimes, FaSignOutAlt, FaStepBackward, FaStepForward, FaUserCircle, FaInfoCircle, FaChevronDown, FaUnderline, FaUndo } from "react-icons/fa";
import { FaBold } from "react-icons/fa6";
import { IoMdExit } from "react-icons/io";
import { IoLink, IoSaveOutline } from "react-icons/io5";
import { BiHighlight } from "react-icons/bi";
import { TbMicrophone, TbMicrophoneOff } from "react-icons/tb";
import { MdDriveFolderUpload, MdContentCopy } from "react-icons/md";
import { LuBookA  } from "react-icons/lu";
import { IoSettingsOutline  } from 'react-icons/io5';
import { FaRegPaste, FaRegTrashCan } from "react-icons/fa6";
import { getDocument } from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import { createWorker } from 'tesseract.js';
import { useAuth } from '../context/AuthContext';
import SavedDocuments from './SavedDocuments';
import SaveDocumentPopup from '../components/SaveDocumentPopup';
import useDocuments from '../hooks/useDocuments';
import DictionaryPopup from '../components/DictionaryPopup';
import { motion } from 'framer-motion';
import { chunkText, getCurrentChunkIndex } from '../utils/textProcessor';
import { usePopup } from '../hooks/usePopup';
import { Link, useLocation } from 'react-router-dom'
import SettingsPopup from './SettingsPopup';
import DOMPurify from 'dompurify';

export default function MainInterface() {
  const [text, setText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
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
  const [isProcessing, setIsProcessing] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isEditable, setIsEditable] = useState(true);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const synthesis = window.speechSynthesis;
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  const [estimatedTime, setEstimatedTime] = useState("0:00");
  const [showDictionary, setShowDictionary] = useState(false);
  const [highlightColor, setHighlightColor] = useState(null);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showUrlPopup, setShowUrlPopup] = useState(false);
  const [webUrl, setWebUrl] = useState('');
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const [wordBoundaries, setWordBoundaries] = useState([]);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [scrollLockTimeout, setScrollLockTimeout] = useState(null);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const { user, logout } = useAuth();
  const utteranceRef = useRef(null);
  const textAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [textChunks, setTextChunks] = useState([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const CHUNK_SIZE = 1000; 
  const CHUNK_WORD_THRESHOLD = 2000; 

  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : true;
  });
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
  const [isUnderline, setIsUnderline] = useState(() => {
    return localStorage.getItem('isUnderline') === 'true';
  });
  const [placeholderText, setPlaceholderText] = useState(
    "Type or paste your text here"
  );
  const [selectedLanguage, setSelectedLanguage] = useState(
    localStorage.getItem('selectedLanguage') || 'en-US'
  );
  const [isBold, setIsBold] = useState(() => {
    return localStorage.getItem('isBold') === 'true';
  });

  const { showSavePopup, setShowSavePopup, showDocumentsPopup, setShowDocumentsPopup, saveNotification, saveDocument, currentDocument, setCurrentDocument, hasChanges, setHasChanges } = useDocuments();
  const recognitionRef = useRef(null);
  usePopup(showUrlPopup);
  const location = useLocation();

  const handleClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.location.reload();
    }
  };

  useEffect(() => {
    localStorage.setItem('isBold', isBold);
    localStorage.setItem('isUnderline', isUnderline);
  }, [isBold, isUnderline]);

  useEffect(() => {
    if (!text) return;
  
    const words = text.match(/\S+/g) || [];
    const wordCount = words.length;
  
    if (wordCount >= CHUNK_WORD_THRESHOLD) {
      const chunks = [];
      let startIndex = 0;
      
      while (startIndex < wordCount) {
        const endIndex = Math.min(startIndex + CHUNK_SIZE, wordCount);
        const chunkText = words.slice(startIndex, endIndex).join(' ');
        chunks.push({
          text: chunkText,
          startWordIndex: startIndex,
          endWordIndex: endIndex - 1,
          wordCount: endIndex - startIndex
        });
        startIndex = endIndex;
      }
      
      setTextChunks(chunks);
      setCurrentChunkIndex(0);
    } else {
      setTextChunks([{
        text: text,
        startWordIndex: 0,
        endWordIndex: wordCount - 1,
        wordCount: wordCount
      }]);
      setCurrentChunkIndex(0);
    }
    
    setCurrentWordIndex(-1);
  }, [text]);

  const getTotalWordCount = () => {
    return textChunks.reduce((total, chunk) => total + chunk.wordCount, 0);
  };

  useEffect(() => {
    if (textAreaRef.current) {
      const words = textAreaRef.current.querySelectorAll('.word');
      const boundaries = Array.from(words).map(word => {
        const rect = word.getBoundingClientRect();
        const containerRect = textAreaRef.current.getBoundingClientRect();
        return {
          top: rect.top - containerRect.top,
          bottom: rect.bottom - containerRect.top,
          left: rect.left - containerRect.left,
          right: rect.right - containerRect.left
        };
      });
      setWordBoundaries(boundaries);
    }
  }, [text, currentWordIndex]);

  const getCurrentWordIndex = (charIndex) => {
    const textSegments = text.match(/\S+|\s+/g) || [];
    let charCount = 0;
    let wordIndex = -1;
  
    for (const segment of textSegments) {
      if (/\S/.test(segment)) {
        wordIndex++;
      }
      charCount += segment.length;
      if (charCount > charIndex) {
        return wordIndex;
      }
    }
    return -1;
  };

  useEffect(() => {
    if (!textAreaRef.current || currentWordIndex === -1 || userHasScrolled) return;
  
    const words = textAreaRef.current.getElementsByClassName('word');
    if (words.length > currentWordIndex) {
      const wordElement = words[currentWordIndex];
      const container = textAreaRef.current;
      const wordRect = wordElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
  
      // Only scroll if word is not in view
      if (wordRect.bottom > containerRect.bottom || wordRect.top < containerRect.top) {
        const scrollPosition = wordRect.top - containerRect.top + container.scrollTop - (containerRect.height / 3);
        
        container.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
  
      // Reset scroll lock after delay
      if (scrollLockTimeout) clearTimeout(scrollLockTimeout);
      setScrollLockTimeout(setTimeout(() => setUserHasScrolled(false), 3000));
    }
  }, [currentWordIndex]);

  useEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;
  
    const handleScroll = () => {
      if (isSpeaking) {
        setUserHasScrolled(true);
        if (scrollLockTimeout) clearTimeout(scrollLockTimeout);
        setScrollLockTimeout(setTimeout(() => setUserHasScrolled(false), 5000));
      }
    };
  
    textArea.addEventListener('scroll', handleScroll);
    return () => textArea.removeEventListener('scroll', handleScroll);
  }, [isSpeaking, scrollLockTimeout]);

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
      setPlaceholderText("Type or paste your text here"); // Reset to original placeholder

    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setPlaceholderText("Listening... Speak now"); // Change to listening placeholder

      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsListening(false);
        setPlaceholderText("Type or paste your text here"); // Reset if error occurs

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
    const totalWords = getTotalWordCount();
    let wordsRemaining = 0;
    
    if (isSpeaking || isPaused) {
      wordsRemaining = Math.max(0, totalWords - (currentWordIndex + 1));
    } else {
      wordsRemaining = totalWords;
    }
    
    const minutes = Math.floor(wordsRemaining / (150 * rate));
    const seconds = Math.floor((wordsRemaining % (150 * rate)) / (150 * rate) * 60);
    
    setEstimatedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }, [currentWordIndex, isSpeaking, isPaused, rate, textChunks]);

  useEffect(() => {
    const totalWords = getTotalWordCount();
    let progress = 0;
    
    if (totalWords > 0 && currentWordIndex >= 0) {
      progress = ((currentWordIndex + 1) / totalWords) * 100;
      progress = Math.min(100, Math.max(0, progress));
    }
    
    setProgress(progress);
  }, [currentWordIndex, textChunks]);

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
    
    // Reset input to allow same file re-upload
    e.target.value = '';
    
    // === SECURITY CHECKS ===
    // 1. Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError({
        title: "Unsupported File Type",
        message: "Only PDF, JPG, PNG, and GIF files are allowed"
      });
      return;
    }
  
    // 2. Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError({
        title: "File Too Large",
        message: "Maximum file size is 10MB"
      });
      return;
    }
  
    // Set processing state
    setIsProcessing(`Processing ${file.type.startsWith('image/') ? 'image' : 'PDF'}...`);
  
    try {
      let extractedText = '';
      
      if (file.type === 'application/pdf') {
        const pdf = await getDocument({
          data: await file.arrayBuffer(),
          workerSrc: pdfjsWorker
        }).promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          extractedText += content.items
            .map(item => item.str)
            .join('')
            .replace(/([^\n])\n([^\n])/g, '$1 $2')
            + '\n\n';
        }
      } 
      else if (file.type.startsWith('image/')) {
        const worker = await createWorker();
        const { data: { text } } = await worker.recognize(file);
        extractedText = text
          .replace(/([^\n])\n([^\n])/g, '$1 $2')
          .replace(/\n{3,}/g, '\n\n');
        await worker.terminate();
      }
      
      setText(DOMPurify.sanitize(extractedText));
      
    } catch (error) {
      console.error("File processing error:", error);
      setUploadError({
        title: "Processing Error",
        message: `Failed to process file: ${error.message}`
      });
    } finally {
      setIsProcessing(null);
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

  // Add this effect for chunk scrolling
  useEffect(() => {
    if (!textAreaRef.current || currentWordIndex === -1 || userHasScrolled) return;
  
    const words = textAreaRef.current.getElementsByClassName('word');
    if (words.length > 0) {
      // Calculate relative word index within current chunk
      const relativeWordIndex = currentWordIndex - (textChunks[currentChunkIndex]?.startWordIndex || 0);
      const wordElement = words[relativeWordIndex];
      
      if (wordElement) {
        const container = textAreaRef.current;
        const wordRect = wordElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
  
        // Only scroll if word is not in view
        if (wordRect.bottom > containerRect.bottom || wordRect.top < containerRect.top) {
          const scrollPosition = wordRect.top - containerRect.top + container.scrollTop - (containerRect.height / 3);
          
          container.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      }
    }
  
    // Reset scroll lock after delay
    if (scrollLockTimeout) clearTimeout(scrollLockTimeout);
    setScrollLockTimeout(setTimeout(() => setUserHasScrolled(false), 3000));
  }, [currentWordIndex, currentChunkIndex]);

  const speakText = (textToSpeak, startWordIndex = 0) => {
    synthesis.cancel();
    setIsEditable(false);
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;
  
    // Apply speech settings
    utterance.volume = volume;
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.voice = selectedVoice;
  
    // Track word boundaries
    const segments = textToSpeak.match(/\S+|\s+/g) || [];
    let charPosition = 0;
    const wordPositions = [];
    
    segments.forEach(segment => {
      if (/\S/.test(segment)) {
        wordPositions.push({
          start: charPosition,
          end: charPosition + segment.length,
          word: segment
        });
      }
      charPosition += segment.length;
    });
  
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const currentWord = wordPositions.find(
          w => event.charIndex >= w.start && event.charIndex < w.end
        );
        
        if (currentWord) {
          const absoluteIndex = startWordIndex + wordPositions.indexOf(currentWord);
          setCurrentWordIndex(absoluteIndex);
          
          // Update current chunk if needed
          const newChunkIndex = textChunks.findIndex(
            chunk => absoluteIndex >= chunk.startWordIndex && 
                    absoluteIndex <= chunk.endWordIndex
          );
          
          if (newChunkIndex !== -1 && newChunkIndex !== currentChunkIndex) {
            setCurrentChunkIndex(newChunkIndex);
          }
        }
      }
    };
  
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentWordIndex(startWordIndex);
    };
  
    utterance.onend = () => {
      const nextChunkIndex = currentChunkIndex + 1;
      
      if (nextChunkIndex < textChunks.length) {
        // Auto-advance to next chunk
        const nextChunk = textChunks[nextChunkIndex];
        setCurrentChunkIndex(nextChunkIndex);
        speakText(nextChunk.text, nextChunk.startWordIndex);
      } else {
        // End of document
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentWordIndex(-1);
        setIsEditable(true);
      }
    };
  
    synthesis.speak(utterance);
  };

  const handlePlayPause = () => {
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
  
    // Determine where to start playback
    let startChunkIndex = currentChunkIndex;
    let startWordIndex = currentWordIndex >= 0 ? currentWordIndex : 0;
    
    // If at end of document, start from beginning
    if (currentChunkIndex === textChunks.length - 1 && 
        currentWordIndex >= textChunks[currentChunkIndex].endWordIndex) {
      startChunkIndex = 0;
      startWordIndex = 0;
    }
  
    setCurrentChunkIndex(startChunkIndex);
    speakText(
      textChunks[startChunkIndex].text.substring(
        getCharIndexForWord(startWordIndex, textChunks[startChunkIndex].text)
      ),
      startWordIndex
    );
  };
  
  
  // Helper function to get character index for a word index
  const getCharIndexForWord = (wordIndex, text) => {
    const segments = text.match(/\S+|\s+/g) || [];
    let charIndex = 0;
    let currentWord = -1;
    
    for (const segment of segments) {
      if (/\S/.test(segment)) {
        currentWord++;
        if (currentWord === wordIndex) break;
      }
      charIndex += segment.length;
    }
    
    return charIndex;
  };

  const handleSkip = (direction) => {
    if (!isSpeaking && !isPaused) return;
  
    const totalWords = getTotalWordCount();
    let newIndex = currentWordIndex;
  
    // Calculate new position
    if (direction === 'backward') {
      newIndex = Math.max(currentWordIndex - 10, 0);
    } else {
      newIndex = Math.min(currentWordIndex + 10, totalWords - 1);
    }
  
    // Find which chunk contains this word
    const newChunkIndex = textChunks.findIndex(
      chunk => newIndex >= chunk.startWordIndex && 
              newIndex <= chunk.endWordIndex
    );
  
    if (newChunkIndex === -1) return;
  
    // Calculate position within chunk
    const chunkStartIndex = textChunks[newChunkIndex].startWordIndex;
    const positionInChunk = newIndex - chunkStartIndex;
  
    // Get text from this position
    const segments = textChunks[newChunkIndex].text.match(/\S+|\s+/g) || [];
    let charPosition = 0;
    let wordsPassed = -1;
    
    for (const segment of segments) {
      if (/\S/.test(segment)) {
        wordsPassed++;
        if (wordsPassed === positionInChunk) break;
      }
      charPosition += segment.length;
    }
  
    const remainingText = textChunks[newChunkIndex].text.substring(charPosition);
  
    // Cancel current speech
    synthesis.cancel();
  
    // Update states
    setCurrentChunkIndex(newChunkIndex);
    setCurrentWordIndex(newIndex);
  
    // Start speaking from new position
    const utterance = new SpeechSynthesisUtterance(remainingText);
    utteranceRef.current = utterance;
    
    // Apply settings
    utterance.volume = volume;
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.voice = selectedVoice;
  
    // Track word boundaries
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const segments = remainingText.match(/\S+|\s+/g) || [];
        let charCount = 0;
        let wordCount = -1;
        
        for (const segment of segments) {
          if (/\S/.test(segment)) {
            wordCount++;
            if (charCount >= event.charIndex) {
              setCurrentWordIndex(newIndex + wordCount);
              break;
            }
          }
          charCount += segment.length;
        }
      }
    };
  
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
  
    utterance.onend = () => {
      if (newIndex >= totalWords - 1) {
        // End of document
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentWordIndex(-1);
        setIsEditable(true);
      } else if (newChunkIndex < textChunks.length - 1) {
        // Move to next chunk
        const nextChunk = textChunks[newChunkIndex + 1];
        setCurrentChunkIndex(newChunkIndex + 1);
        speakText(nextChunk.text, nextChunk.startWordIndex);
      }
    };
  
    synthesis.speak(utterance);
  };
// Helper to get character index for a word in a text


// Helper to get current chunk's text
const getCurrentChunkText = () => {
  return textChunks[currentChunkIndex]?.text || '';
};
  const handleCancel = () => {
    synthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setIsEditable(true);
    setCurrentWordIndex(-1);
    setCurrentChunkIndex(0); // Reset to first chunk
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setShowCopyPopup(true);
    setTimeout(() => setShowCopyPopup(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setText(prev => prev + (prev ? ' ' : '') + DOMPurify.sanitize(text));
      }
    } catch (err) {
      console.error('Failed to paste:', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      document.body.appendChild(textArea);
      textArea.focus();
      if (document.execCommand('paste')) {
        setText(prev => prev + (prev ? ' ' : '') + textArea.value);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleClear = () => {
    synthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setIsEditable(true);
    setCurrentWordIndex(-1);
    setText("");
    setEstimatedTime("0:00"); // Reset estimated time
    setProgress(0); // Reset progress bar
    setTextChunks([]); // Clear any chunks
    setCurrentChunkIndex(0); // Reset chunk index
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
    const currentChunk = textChunks[currentChunkIndex] || { text: '' };
    const segments = currentChunk.text.match(/\S+|\s+/g) || [];
    let wordIndex = currentChunk.startWordIndex - 1;
  
    return (
      <div className={`text-content ${isSpeaking ? 'speaking' : ''}`}
      style={{
        fontFamily: fontFamily, // Make sure this uses the selected font
        fontSize: `${fontSize}px`,
        fontWeight: isBold ? '900' : '400',
        outline: 'none',
        whiteSpace: 'pre-wrap', // Preserve whitespace
        letterSpacing: `${letterSpacing}px`,
        textDecoration: isUnderline ? 'underline' : 'none' 

      }}
      >
        {segments.map((segment, i) => {
          if (/\S/.test(segment)) {
            wordIndex++;
            return (
              <span
                key={`word-${i}`}
                className={`word ${wordIndex === currentWordIndex ? 'highlight' : ''}`}
                data-word-index={wordIndex}
                style={{ textDecoration: isUnderline ? 'underline' : 'none' }}

              >
                {segment}
              </span>
            );
          }
          return (
            <span key={`whitespace-${i}`} className="whitespace" style={{ textDecoration: isUnderline ? 'underline' : 'none' }}>
              {segment}
            </span>
          );
        })}
      </div>
    );
  };

  const showToast = (message, type = 'info') => {
    const toast = document.getElementById('speech-aura-toast') || createToastElement();
    
    // Set colors based on theme and type
    const colors = getToastColors(darkMode, type);
    
    Object.assign(toast.style, {
      backgroundColor: colors.background,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      boxShadow: darkMode 
        ? '0 4px 12px rgba(0, 0, 0, 0.25)' 
        : '0 4px 12px rgba(0, 0, 0, 0.1)'
    });
    
    toast.innerHTML = `
      <div class="toast-icon">${getToastIcon(type)}</div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" onclick="this.parentElement.style.opacity = '0'">
        &times;
      </button>
    `;
    
    toast.style.opacity = '1';
    
    // Auto-hide after 4 seconds unless it's an error
    if (type !== 'error') {
      setTimeout(() => {
        toast.style.opacity = '0';
      }, 4000);
    }
  };
  
  // Helper function to create toast element
  const createToastElement = () => {
    const toast = document.createElement('div');
    toast.id = 'speech-aura-toast';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
    return toast;
  };
  
  // Get appropriate colors based on theme and type
  const getToastColors = (isDarkMode, type) => {
    const colors = {
      error: {
        light: { background: '#FFEBEE', text: '#C62828', border: '#EF9A9A' },
        dark: { background: '#3A1D1D', text: '#FF8A80', border: '#5D2A2A' }
      },
      success: {
        light: { background: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
        dark: { background: '#1D3A1D', text: '#69F0AE', border: '#2D5D2D' }
      },
      info: {
        light: { background: '#E3F2FD', text: '#1565C0', border: '#90CAF9' },
        dark: { background: '#1D283A', text: '#82B1FF', border: '#2D3D5D' }
      }
    };
    
    return colors[type][isDarkMode ? 'dark' : 'light'];
  };
  
  // Get appropriate icon for toast type
  const getToastIcon = (type) => {
    const icons = {
      error: '❌',
      success: '✅',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  };
  
  // Enhanced content extraction function
  const extractMainContent = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
  
    // Try multiple strategies to find main content
    const contentElement = findMainContentElement(doc) || doc.body;
  
    // Clone to avoid modifying original DOM
    const clone = contentElement.cloneNode(true);
    
    // Remove unwanted elements
    removeUnwantedElements(clone);
  
    // Get clean text content
    let content = cleanTextContent(clone.textContent);
  
    // Add title if available
    const title = findArticleTitle(doc);
    if (title) content = `${title}\n\n${content}`;
  
    // Final cleanup
    return finalCleanup(content);
  };
  
  // Helper function to find main content element
    const findMainContentElement = (doc) => {
      const selectors = [
        'article[itemprop="articleBody"]',
        'article',
        '[role="article"]',
        '[itemprop="articleBody"]',
        '.article-body',
        '.entry-content',
        '.post-content',
        '.story-content',
        'main',
        '[class*="content"]',
        '[class*="body"]'
      ];

      for (const selector of selectors) {
        const element = doc.querySelector(selector);
        if (element && element.textContent.trim().length > 200) {
          return element;
        }
      }
      return null;
    };

    // Helper function to remove unnecessary elements
    const removeUnwantedElements = (element) => {
      const unwantedSelectors = [
        'header', 'footer', 'nav', 'aside', 'script', 'style', 
        'iframe', 'form', 'button', 'img', 'figure', 'video',
        '[class*="ad"]', '[class*="sidebar"]', '[class*="related"]',
        '[class*="newsletter"]', '[class*="social"]', '[class*="comment"]',
        '[class*="menu"]', '[class*="author"]', '[class*="meta"]',
        '[class*="breadcrumb"]', '[class*="recommend"]', '[class*="popular"]',
        '[itemprop="author"]', '[itemprop="datePublished"]', '.caption',
        '.credit', '.byline', '.dateline', '.sharing', '.tags'
      ];

      unwantedSelectors.forEach(selector => {
        element.querySelectorAll(selector).forEach(el => el.remove());
      });
    };

    // Helper function to clean text content
    const cleanTextContent = (text) => {
      return text
        .replace(/\n\s*\n/g, '\n\n')  // Preserve paragraph breaks
        .replace(/\s+/g, ' ')         // Collapse multiple spaces
        .replace(/(\w)\s([.,;:!?)])/g, '$1$2')  // Fix punctuation
        .replace(/([.,;:!?(])\s+/g, '$1 ')      // Fix punctuation
        .trim();
    };

    // Helper function to find article title
    const findArticleTitle = (doc) => {
      const titleSelectors = [
        'h1[itemprop="headline"]',
        'h1.article-title',
        'h1.entry-title',
        'h1.title',
        'h1'
      ];

      for (const selector of titleSelectors) {
        const title = doc.querySelector(selector);
        if (title) return title.textContent.trim();
      }
      return null;
    };

    // Helper function for final cleanup
    const finalCleanup = (text) => {
      return text
        .replace(/\n{3,}/g, '\n\n')  // Limit consecutive newlines
        .replace(/^\s+|\s+$/g, '');  // Trim whitespace
    };
      
  // Enhanced fetch function with modern UI
      const fetchWebpageContent = async () => {
        if (!webUrl.trim()) {
          showToast('Please enter a valid article URL', 'error');
          return;
        }
      
        try {
          setIsFetchingContent(true);
          setText('Extracting article content...');
          setPlaceholderText('Processing article, please wait...');
      
          // Validate URL
          let parsedUrl;
          try {
            parsedUrl = new URL(webUrl);
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
              throw new Error('Invalid URL protocol');
            }
          } catch {
            throw new Error('Please enter a valid URL starting with http:// or https://');
          }
      
          // Fetch with timeout
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000);
          
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(webUrl)}`;
          const response = await fetch(proxyUrl, { signal: controller.signal });
          clearTimeout(timeout);
      
          if (!response.ok) {
            throw new Error(`Failed to fetch article (${response.status})`);
          }
      
          const data = await response.json();
          if (!data.contents) {
            throw new Error('No readable content found in this article');
          }
      
          // Extract and set content
          const cleanContent = extractMainContent(data.contents);
          if (cleanContent.length < 200) {
            throw new Error('Not enough readable content found');
          }
      
          setText(cleanContent);
          showToast('Article extracted successfully!', 'success');
      
        } catch (error) {
          console.error('Extraction error:', error);
          showToast(
            `Failed to extract article: ${error.message}`,
            'error'
          );
          setText('');
        } finally {
          setIsFetchingContent(false);
          setPlaceholderText("Type or paste your text here");
          setShowUrlPopup(false); // Close the popup when done
        }
      };

  const Footer = () => (
    <footer className="app-footer">
      <div className="footer-left">
      <div className="footer-logo-wrapper">
      <span className="footer-logo-text">Speech</span>
      <span className="footer-logo-aura-container">
        <span className="footer-logo-aura-bg"></span>
        <span className="footer-logo-aura-text">Aura</span>
      </span>
    </div>
        <p>Developed by Elijah Jackson</p>
        <p className="copyright">© 2025 Speech Aura. All rights reserved</p>
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

  const ErrorPopup = () => {
    if (!uploadError) return null;
  
    return (
      <div className="error-popup-overlay">
        <div className="error-popup">
          <div className="error-popup-header">
            <div className="error-icon">⚠️</div>
            <h4>{uploadError.title}</h4>
            <button 
              className="close-popup" 
              onClick={() => setUploadError(null)}
            >
              <FaTimes />
            </button>
          </div>
          <div className="error-popup-content">
            <p>{uploadError.message}</p>
          </div>
          <div className="error-popup-actions">
            <button 
              className="error-popup-button"
              onClick={() => setUploadError(null)}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  const textareaValue = isListening ? (text + (text && transcribedText ? ' ' : '') + transcribedText) : text;
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  const formatEstimatedTime = (timeString) => {
    const [minutes, seconds] = timeString.split(':').map(Number);
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="app-container">
    <header className="modern-app-header">
      <div className="header-content">
        <div className="logo-container">
          <Link to="/" onClick={handleClick} className="logo-link" target="_blank" style={{ textDecoration: 'none' }}>
          <h1 className="app-logo">
            <span className="logo-text">Speech</span>
            <span className="logo-highlight">Aura</span>
          </h1>
          </Link>
          <p className="app-subtitle">A free unlimted student tool.</p>
        </div>

        <div className="header-right-section">
          <div className="time-display">
            <div className="time">{time}</div>
            <div className="date">{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}</div>
          </div>

          <div className="user-profile">
            <div className="profile-icon" onClick={() => setShowSettingsPopup(true)}>
              {user ? (
                <div className="user-initials">
                  {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  {(user?.lastName?.[0] || '').toUpperCase()}
                </div>
              ) : (
                <FaUserCircle className="default-user-icon" />
              )}
            </div>
            <div className="profile-info">
              <div className="welcome-message" style={{ cursor: "pointer" }} onClick={() => setShowSettingsPopup(true)}>
                {user?.firstName
                  ? `Hi, ${user.firstName} ${user.lastName}`
                  : user?.email
                    ? `Welcome, ${user.email.split('@')[0]}`
                    : 'Welcome, Guest'}
                <FaChevronDown className="profile-dropdown-icon" />
              </div>
              {user && (
                <button onClick={logout} className="logout-button">
                  <span className="logout-text">Sign Out <FaSignOutAlt className="logout-icon" /></span>
                </button>
              )}
            </div>
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
                title={darkMode ? 'Switch To Light Mode' : 'Switch To Dark Mode'}
                data-tooltip={darkMode ? 'Switch To Light Mode' : 'Switch To Dark Mode'}
              >
                {darkMode ? <FaSun /> : <FaMoon />}
              </button>
              <button className="icon-button" onClick={() => fileInputRef.current.click()} disabled={isSpeaking || isPaused} data-tooltip="Upload File (PDF/Image)" title="Upload File (PDF/Image)">
                <MdDriveFolderUpload size={60}/>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                className="icon-button"
                onClick={() => setShowUrlPopup(true)}
                disabled={isSpeaking || isPaused}
                title="Upload Webpage URL"
                data-tooltip="Upload Webpage URL"
              >
                <IoLink size={60}/>
              </button>
              <button className="icon-button" onClick={handleCopy} disabled={!text}
              data-tooltip="Copy Text To Clipboard" title="Copy Text To Clipboard"
              >
                <MdContentCopy size={60}/>
              </button>
              <button
                className="icon-button"
                onClick={handlePaste}
                title="Paste"
                data-tooltip="Paste"
                disabled={isSpeaking || isPaused}

              >
                <FaRegPaste size={60}/>
              </button>
              <button className="icon-button" onClick={handleClear} disabled={!text} data-tooltip="Clear" title="Clear">
                <FaRegTrashCan />
              </button>
              <button
                className={`icon-button ${isBold ? 'active' : ''}`}
                onClick={() => setIsBold(!isBold)}
                title="Bold"
                data-tooltip="Bold"
                disabled={!text}

              >
                <FaBold  />
              </button>
              <button
                className={`icon-button ${isUnderline ? 'active' : ''}`}
                onClick={() => setIsUnderline(!isUnderline)}
                title="Underline"
                data-tooltip="Underline"
                disabled={!text}
              >
                <FaUnderline /> 
              </button>
              <button
              className="icon-button"
              onClick={() => setShowHighlightMenu(!showHighlightMenu)}
              title="Text Highlight"
              data-tooltip="Text Highlight"
            >
              <BiHighlight  size={60}/>
            </button>
            {showHighlightMenu && (
              <div 
                className="highlight-dropdown"
                style={{
                  position: 'absolute',
                  zIndex: 1000,
                  marginTop: '40px', // Position below the button
                  marginLeft: '-100px', // Adjust horizontal position
                  backgroundColor: darkMode ? '#3a3a3a' : '#fff',
                  borderRadius: '8px',
                  boxShadow: darkMode 
                    ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
                    : '0 4px 20px rgba(0, 0, 0, 0.1)',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  border: darkMode ? '1px solid #555' : '1px solid #eee'
                }}
              >
              <div 
                className="highlight-options-title"
                style={{
                  fontSize: '12px',
                  color: darkMode ? '#aaa' : '#666',
                  padding: '0 4px',
                  marginBottom: '4px'
                }}
              >
                Highlight Color
              </div>
              <div 
                className="highlight-options-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px'
                }}
              >
              {['yellow', 'green', 'blue', 'pink', 'purple', 'none'].map((color) => (
                <button
                  key={color}
                  className={`highlight-option ${color}`}
                  onClick={() => {
                    setHighlightColor(color === 'none' ? null : color);
                    setShowHighlightMenu(false);
                  }}
                  title={color === 'none' ? 'Remove highlight' : color}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: color === 'none' ? 'transparent' : `var(--highlight-${color})`,
                    color: color === 'none' ? (darkMode ? '#fff' : '#333') : '#fff',
                    transition: 'transform 0.2s',
                    border: color === 'none' ? `1px solid ${darkMode ? '#555' : '#ddd'}` : 'none',
                    ':hover': {
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  {color === 'none' ? <FaTimes size={12} /> : null}
                </button>
              ))}
            </div>
          </div>
        )}
            {user && (
          <div className="documents-dropdown">
            <button
              className="icon-button"
              onClick={() => setShowDocDropdown(!showDocDropdown)}
              disabled={isSpeaking || isPaused}
              title="Your Saved Documents"
              data-tooltip="Your Saved Documents"
            >
              <IoSaveOutline size={45}/>
              {(hasChanges || (text && !currentDocument)) && (
              <motion.span 
                className="notification-dot"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              />
            )}
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
                title={isListening ? 'Stop Microphone' : 'Start Voice'}
                data-tooltip={isListening ? 'Stop Microphone' : 'Start Voice'}
                disabled={isSpeaking || isPaused}
              >
                {isListening ? <TbMicrophoneOff size={60}/> : <TbMicrophone size={60}/>}
              </button>
              <button 
                className="icon-button" 
                onClick={() => setShowDictionary(true)}
                title="Dictionary"
                data-tooltip="Dictionary"
              >
                  <LuBookA  size={60}/>
                </button>
              <div className="settings-dropdown">
                <button
                  className={`icon-button ${isSpeaking && !isPaused ? 'disabled' : ''}`}
                  onClick={() => setShowSettings(!showSettings)}
                  disabled={isSpeaking || isPaused}
                  data-tooltip="Settings"
                  title="Settings"
                >
                  <IoSettingsOutline  size={60}/>
                </button>

                {showSettings && (
                <div className="dropdown-content">
                  <div className="close-setting-container">
                    <button
                      style={{cursor:"pointer"}}
                      onClick={() => setShowSettings(false)}
                      className="close-settings"
                    >
                      Exit <FaTimes />
                    </button>
                  </div>

                  <div className="slider-container">
                    <label>
                      Volume: {volume.toFixed(1)}
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                      />
                    </label>
                  </div>

                  <div className="slider-container">
                    <label>
                      Pitch: {pitch.toFixed(1)}
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={pitch}
                        onChange={(e) => setPitch(parseFloat(e.target.value))}
                      />
                    </label>
                  </div>

                  <div className="slider-container">
                    <label>
                      Speed: {rate.toFixed(1)}x
                      {rate >= 1.0 && rate <= 2.0 && (
                        <span className="recommended-tag" style={{ color: '#ff6b6b', marginLeft: '8px' }}>
                          (Recommended)
                        </span>
                      )}
                      <input
                        type="range"
                        min="0.5"
                        max="3.5"
                        step="0.1"
                        value={rate}
                        onChange={(e) => setRate(parseFloat(e.target.value))}
                      />
                    </label>
                  </div>

                  <div className="dyslexia-controls">
                    <div className="slider-container">
                      <label>
                        Font Size: {fontSize}
                        <input
                          type="range"
                          min="12"
                          max="55"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                        />
                      </label>
                    </div>

                    <div className="slider-container">
                      <label>
                        Letter Spacing: {letterSpacing.toFixed(1)}
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
                    <div className="reset-container">
                    <button
                      className="reset-button"
                      onClick={() => {
                        setFontFamily('OpenDyslexic');
                        setFontSize(16);
                        setLetterSpacing(1.5);
                        setIsBold(false);
                        setIsUnderline(false);
                        setVolume(1);
                        setPitch(1);
                        setRate(1);
                        localStorage.setItem('fontFamily', 'OpenDyslexic');
                        localStorage.setItem('fontSize', '16');
                        localStorage.setItem('letterSpacing', '1.5');
                        localStorage.setItem('isBold', 'false');
                        localStorage.setItem('isUnderline', 'false');
                      }}
                      title="Reset all settings to default"
                    >
                      <FaUndo /> Reset All Settings
                    </button>
                  </div>
                  </div>
                </div>
              )}
              {currentDocument && (
              <button
                className="icon-button"
                onClick={() => {
                  setCurrentDocument(null);
                  setText("");
                  setHasChanges(false);
                }}
                style={{ cursor: "pointer", width: "90%", background: "#ff6b6b", color: "white", borderRadius: "8px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "40px", fontWeight: "bold" }}
                data-tooltip="Exit Current Document"
              >
                Exit Document <IoMdExit />
              </button>
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
                letterSpacing: `${letterSpacing}px`,
                backgroundColor: highlightColor 
                ? `var(--highlight-${highlightColor})` 
                : (darkMode ? '#2d2d2d' : '#ffffff')
              }}
            >
              {isEditable ? (
                <>
                <textarea
                  placeholder={placeholderText}
                  value={DOMPurify.sanitize(textareaValue)} 
                  onChange={(e) => setText(DOMPurify.sanitize(e.target.value))}  
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData('text/plain');
                    document.execCommand('insertText', false, text);
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    resize: 'none',
                    background: 'transparent',
                    color: 'inherit',
                    fontFamily: fontFamily,
                    fontSize: `${fontSize}px`,
                    textDecoration: isUnderline ? 'underline' : 'none',
                    letterSpacing: `${letterSpacing}px`,
                    fontWeight: isBold ? '900' : '400',
                    outline: 'none',
                    whiteSpace: 'pre-wrap' // Preserve whitespace
                  }}
                />
                </>
              ) : (
                renderHighlightedText()
              )}
            </div>
            {textChunks.length > 1 && (
            <div className="chunk-navigation-container">
              <button 
                onClick={() => {
                  const prevChunkIndex = Math.max(0, currentChunkIndex - 1);
                  const startWordIndex = textChunks[prevChunkIndex].startWordIndex;
                  
                  // Cancel current speech
                  synthesis.cancel();
                  
                  // Update states
                  setCurrentChunkIndex(prevChunkIndex);
                  setCurrentWordIndex(startWordIndex);
                  
                  // Calculate new progress
                  const totalWords = (text.match(/\S+/g) || []).length;
                  const newProgress = totalWords > 0 ? 
                    (startWordIndex / totalWords) * 100 : 0;
                  setProgress(newProgress);
                  
                  // Start reading from beginning of chunk
                  speakText(textChunks[prevChunkIndex].text, startWordIndex);
                }}
                disabled={currentChunkIndex === 0}
                className="chunk-nav-button"
              >
                Previous Page
              </button>
              <span className="chunk-counter">
                Page {currentChunkIndex + 1} of {textChunks.length}
              </span>
              <button 
                onClick={() => {
                  const nextChunkIndex = Math.min(textChunks.length - 1, currentChunkIndex + 1);
                  const startWordIndex = textChunks[nextChunkIndex].startWordIndex;
                  
                  // Cancel current speech
                  synthesis.cancel();
                  
                  // Update states
                  setCurrentChunkIndex(nextChunkIndex);
                  setCurrentWordIndex(startWordIndex);
                  
                  // Calculate new progress
                  const totalWords = (text.match(/\S+/g) || []).length;
                  const newProgress = totalWords > 0 ? 
                    (startWordIndex / totalWords) * 100 : 0;
                  setProgress(newProgress);
                  
                  // Start reading from beginning of chunk
                  speakText(textChunks[nextChunkIndex].text, startWordIndex);
                }}
                disabled={currentChunkIndex === textChunks.length - 1}
                className="chunk-nav-button"
              >
                Next Page
              </button>
            </div>
          )}
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
              <span className="word-count">
                {formatNumber((text.match(/\S+/g) || []).length)} Words
              </span>
              <span className="character-count">
                {formatNumber(text.length)} Characters
              </span>
              <span className="estimated-time">
                Est. Time: {formatEstimatedTime(estimatedTime)}
              </span>
            </div>
            <div className="playback-controls">
            <div className="controls-row">
              <button 
                className="control-icon" 
                onClick={() => handleSkip('backward')}
                disabled={!isSpeaking && !isPaused}
                title="Skip backward 10 words"
                data-tooltip="Backward"
              >
                <FaStepBackward />
              </button>
              
              <button 
                className="control-icon" 
                onClick={handlePlayPause}
                style={{ backgroundColor: isSpeaking && !isPaused ? '#ff6b6b' : '#4ecdc4' }}
                disabled={!text}
                title={isSpeaking && !isPaused ? 'Pause' : 'Play'}
                data-tooltip={isSpeaking && !isPaused ? 'Pause' : 'Play'}
              >
                {isSpeaking && !isPaused ? <FaPause /> : <FaPlay />}
              </button>
              
              <button 
                className="control-icon" 
                onClick={() => handleSkip('forward')}
                disabled={!isSpeaking && !isPaused}
                title="Skip forward 10 words"
                data-tooltip="Forward"
              >
                <FaStepForward />
              </button>
              
              <button 
                className="control-icon" 
                onClick={handleCancel}
                disabled={!isSpeaking}
                title="Stop"
                data-tooltip="Stop"
              >
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
        {isProcessing}
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

      <DictionaryPopup 
        isOpen={showDictionary} 
        onClose={() => setShowDictionary(false)}
        darkMode={darkMode}
      />
      {showUrlPopup && (
        <div className="url-popup-overlay">
        <div className="url-popup">
          <div className="url-popup-header">
            <h3><IoLink size={28} className="title-icon" /> Webpage URL</h3>
            <button className="close-popup" onClick={() => setShowUrlPopup(false)}>
              <FaTimes />
            </button>
          </div>
          <div className="url-popup-content">
            <div className="url-input-container">
              <input
                type="url"
                value={webUrl}
                onChange={(e) => setWebUrl(e.target.value)}
                placeholder="Paste article URL here..."
                className="url-input"
              />
              <button
                className="paste-button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setWebUrl(text);
                  } catch (error) {
                    console.error('Paste failed:', error);
                  }
                }}
              >
                <FaCopy /> Paste
              </button>
            </div>
            <div className={`url-popup-note ${darkMode ? 'dark' : 'light'}`}>
              <FaInfoCircle className="info-icon" />
              <span>Works best with news articles and blog posts</span>
            </div>
            <div className="url-popup-note">
              <strong>Note:</strong> This feature is still improving and may not work perfectly 
              with all websites. For best results, try mainstream news articles and blogs.
            </div>
          </div>
            <div className="url-popup-actions">
              <button
                className="cancel-button"
                onClick={() => {
                  setShowUrlPopup(false);
                  setWebUrl('');
                }}
              >
                Cancel
              </button>
              <button
                className="fetch-button primary-button"
                onClick={fetchWebpageContent}
                disabled={!webUrl.trim() || isFetchingContent}
                style={{ backgroundColor: '#4ecdc4' }}
              >
                {isFetchingContent ? (
                  <>
                    <span className="spinner"></span>
                    Extracting...
                  </>
                ) : (
                  'Extract Article'
                )}
              </button>
            </div>
          </div>
        </div>
        )}

      <SettingsPopup 
        isOpen={showSettingsPopup}
        onClose={() => setShowSettingsPopup(false)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        setText={setText}
        text={text}
        setSelectedLanguage={setSelectedLanguage}
        selectedLanguage={selectedLanguage}
      />
      <div className="coming-soon-section" style={{ marginBottom: "35px" }}>
        <div className="coming-soon-badge">Coming Soon</div>
        <div className="coming-soon-text">
          <ul className="coming-soon-list">
            <li>Realistic Voices</li>
            <li>AI Assistant</li>
            <li>MP3 Download</li>
            <li>Language Options</li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
}