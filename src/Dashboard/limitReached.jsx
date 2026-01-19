// LimitReached.jsx

import React, { useEffect, useState } from 'react';
import './limitReached.css';

export default function LimitReached({ isLimitReached, setIsLimitReached, limitReachedMessage, userProfile }) {
  const [isClosing, setIsClosing] = React.useState(false);
  const [userTier,setUserTier]=useState('5/5');
  useEffect(()=>{
    if(userProfile?.accountTier==='pro'||userProfile?.accountTier==='plus'){
      setUserTier('20/20')
    }
  },[userProfile]);
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
            {userTier} Monthly Uploads reached! Upgrade your account plan or {limitReachedMessage || "try again next month."}.
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
