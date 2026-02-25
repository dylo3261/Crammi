// LimitReached.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './limitReached.css';

export default function LimitReached({ isLimitReached, setIsLimitReached, limitReachedMessage, userProfile, activeTab }) {
  const [isClosing, setIsClosing] = useState(false);
  const [userTier,setUserTier]=useState('3/3');
  useEffect(()=>{
    if(userProfile?.accountTier==='plus'){
      setUserTier('50/50')
    }
    else if(userProfile?.accountTier==='pro'){
      setUserTier('300/300')
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
      }, 15000);
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
          {activeTab === 'Course Mode' ? (
            `30/30 Monthly Course Uploads Reached! Please ${limitReachedMessage || "try again next month."}`
          ) : (
            <>
              {userTier} Monthly Uploads reached!{' '}
              <Link
                to="/upgrade"
                style={{ textDecoration: 'underline', color: '#ab9ff2', cursor: 'pointer'}}
              >
                Upgrade your account plan here
              </Link>{' '}
              or {limitReachedMessage || "try again next month."}.
            </>
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
