import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function IgnoredDetected({ isDetected }) {
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  
  const handleUpgrade = () => {
    navigate('/upgrade');
  };

  // Check if isDetected contains upgrade-related keywords
  const shouldShowUpgrade = () => {
    if (!isDetected || typeof isDetected !== 'string') return false;
    
    const keywords = ['max', 'upgrade', 'tier','plan','exceed'];
    const lowerCaseDetected = isDetected.toLowerCase();
    
    return keywords.some(keyword => lowerCaseDetected.includes(keyword));
  };

  useEffect(() => {
    if (isDetected) {
      setIsVisible(true);
      setIsClosing(false);
    }
  }, [isDetected]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => setIsVisible(false), 400);
  };

  if (!isVisible) return null;

  return (
        <div className={`errorNotification ${!isClosing ? 'show' : ''}`}>
        <div className="errorNotificationContent">
        <div className="errorIconWrapper">
          <span className="errorIcon">⚠️</span>
        </div>
        <div className="errorTextWrapper">
          <h3 className="errorTitle">Ignored Special Instructions</h3>
          <p className="errorMessage">
            {isDetected}{' '}
            {shouldShowUpgrade() && (
              <span
                onClick={handleUpgrade}
                style={{ textDecoration: 'underline', color: '#ab9ff2', cursor: 'pointer' }}
              >
                Upgrade Plan Now ⭐
              </span>
            )}
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