import { useState, useEffect } from 'react';
import axios from 'axios';

const useDocuments = () => {
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showDocumentsPopup, setShowDocumentsPopup] = useState(false);
  const [saveNotification, setSaveNotification] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const saveDocument = async (title, content, isUpdate = false) => {
    try {
      let result;
      if (isUpdate && currentDocument) {
        result = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/documents/${currentDocument._id}`,
          { title, content },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      } else {
        result = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/documents`,
          { title, content },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      }
      setSaveNotification(true);
      setTimeout(() => setSaveNotification(false), 3000);
      setCurrentDocument(isUpdate ? { ...currentDocument, title, content } : null);
      setHasChanges(false);
      return result.data;
    } catch (err) {
      console.error('Error saving document:', err);
      return false;
    }
  };

  return {
    showSavePopup,
    setShowSavePopup,
    showDocumentsPopup,
    setShowDocumentsPopup,
    saveNotification,
    setSaveNotification,
    saveDocument,
    currentDocument,
    setCurrentDocument,
    hasChanges,
    setHasChanges
  };
};

export default useDocuments;