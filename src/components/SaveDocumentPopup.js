import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';

const SaveDocumentPopup = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialContent,
  currentDocument
}) => {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentDocument) {
      setTitle(currentDocument.title);
    } else {
      setTitle('');
    }
  }, [currentDocument]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    onSave(title, !!currentDocument);
    setTitle('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="save-document-popup-overlay">
      <div className="save-document-popup">
        <div className="save-document-popup-header">
          <h3>{currentDocument ? 'Update Document' : 'Save Document'}</h3>
          <button className="close-popup" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="document-title">Document Title</label>
            <input
              id="document-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your document"
              autoFocus
            />
            {error && <div className="error-message">{error}</div>}
          </div>
          
          <div className="save-document-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-button">
              <FaSave /> {currentDocument ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveDocumentPopup;