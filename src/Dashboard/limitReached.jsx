// LimitReached.jsx

import React, { useEffect } from 'react';
import './limitReached.css';

export default function LimitReached({ isLimitReached, setIsLimitReached, limitReachedMessage }) {
  const [isClosing, setIsClosing] = React.useState(false);

  useEffect(() => {
    if (isLimitReached) {
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          setIsLimitReached(false);
          setIsClosing(false);
        }, 400);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isLimitReached, setIsLimitReached]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsLimitReached(false);
      setIsClosing(false);
    }, 400);
  };

  if (!isLimitReached) return null;

  return (
    <div className={`errorNotification ${isLimitReached && !isClosing ? 'show' : ''}`}>
      <div className="errorNotificationContent">
        <div className="errorIconWrapper">
          <span className="errorIcon">⚠️</span>
        </div>
        <div className="errorTextWrapper">
          <h3 className="errorTitle">Upload Failed</h3>
          <p className="errorMessage">
            Daily Upload limit reached. Please upgrade your account plan or {limitReachedMessage || "try again later"}.
          </p>
        </div>
        <button 
          className="errorCloseButton"
          onClick={handleClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
