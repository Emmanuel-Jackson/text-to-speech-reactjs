import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaBook } from 'react-icons/fa';
import { BiSolidError } from "react-icons/bi";
import axios from 'axios';
import { LuBookA  } from "react-icons/lu";

const DictionaryPopup = ({ isOpen, onClose, darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Prevent background scrolling when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const searchDictionary = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${searchTerm}`
      );
      setResults(response.data[0]);
    } catch (err) {
      setError('It seems like the word does not exist. Please Try again.');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      searchDictionary();
    }
  };


  if (!isOpen) return null;

  return (
    <div 
      className="dictionary-popup-overlay"
    >
      <div className={`dictionary-popup ${darkMode ? 'dark' : 'light'}`}>
        <div className="popup-header">
          <div className="title-container">
            <LuBookA size={28} className="title-icon" />
            <h3>Dictionary</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="search-container">
          <div className="search-input-container">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a word..."
              className="search-input"
              autoFocus
            />
            <button 
              className="search-btn"
              onClick={searchDictionary}
              disabled={!searchTerm.trim() || isLoading}
            >
              <FaSearch />
            </button>
          </div>
        </div>

        <div className="results-container">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Searching dictionary...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <BiSolidError style={{fontSize: "3rem"}}>⚠️</BiSolidError>
              <p>{error}</p>
            </div>
          ) : results ? (
            <div className="dictionary-results">
              <div className="word-header">
                <h4>{results.word}</h4>
                {results.phonetic && (
                  <span className="phonetic">/{results.phonetic}/</span>
                )}
              </div>

              {results.meanings.map((meaning, index) => (
                <div key={index} className="meaning-section">
                  <div className="part-of-speech">
                    {meaning.partOfSpeech}
                  </div>
                  <div className="definitions">
                    <h5>Definitions:</h5>
                    <ol>
                      {meaning.definitions.slice(0, 3).map((def, defIndex) => (
                        <li key={defIndex} className="definition-item">
                          <p className="definition-text">{def.definition}</p>
                          {def.example && (
                            <p className="example-text">"{def.example}"</p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <LuBookA size={60} className="empty-icon" />
              <p>Search for a word to see its definition</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DictionaryPopup;