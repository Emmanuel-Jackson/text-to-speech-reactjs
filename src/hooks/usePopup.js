import { useEffect } from 'react';

export const usePopup = (isOpen) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('popup-open');
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('popup-open');
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.classList.remove('popup-open');
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);
};