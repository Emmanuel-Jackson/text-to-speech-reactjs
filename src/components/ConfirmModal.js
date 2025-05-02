import React from 'react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  darkMode
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay">
      <div className={`confirm-modal ${darkMode ? 'dark' : 'light'}`}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            {cancelText}
          </button>
          <button className="confirm-btn" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;