import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaTrash, FaTimes } from 'react-icons/fa';

const SavedDocuments = ({ 
  isOpen, 
  onClose, 
  onDocumentSelect,
  currentText,
  setCurrentDocument
}) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocuments = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/documents`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDocuments(response.data);
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error fetching documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen]);

  const handleDelete = async (docId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/documents/${docId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDocuments(documents.filter(doc => doc._id !== docId));
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const handleSelect = (doc) => {
    setCurrentDocument(doc);
    onDocumentSelect(doc.content, doc);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="documents-popup-overlay">
      <div className="documents-popup">
        <div className="documents-popup-header">
          <h3>Your Saved Documents</h3>
          <button className="close-popup" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="documents-list-container">
          {isLoading ? (
            <div className="loading-documents">Loading documents...</div>
          ) : error ? (
            <div className="documents-error">{error}</div>
          ) : documents.length === 0 ? (
            <div className="no-documents">No documents saved yet</div>
          ) : (
            <ul className="documents-list">
              {documents.map((doc) => (
                <li key={doc._id} className="document-item">
                  <div className="document-content" onClick={() => handleSelect(doc)}>
                    <h4 className="document-title">{doc.title}</h4>
                    <p className="document-preview">
                      {doc.content.length > 100 
                        ? `${doc.content.substring(0, 100)}...` 
                        : doc.content}
                    </p>
                    <div className="document-meta">
                      <span className="document-date">
                        {new Date(doc.createdAt).toLocaleString()}
                      </span>
                      <span className="document-word-count">
                        {doc.content.split(/\s+/).length} words
                      </span>
                    </div>
                  </div>
                  <button 
                    className="delete-document"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc._id);
                    }}
                  >
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedDocuments;