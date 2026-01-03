import React, { useState, useEffect, useRef } from "react";
import { fetchAuthSession, fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import "./Flashcards.css";

export default function Flashcards() {
  const { batchID } = useParams();
  const navigate = useNavigate();
  const [batchJSON, setBatchJSON] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef(null);
  const location = useLocation();
  const [batchName, setBatchName] = useState(location.state?.batchName || 'Unknown Batch');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingName, setEditingName] = useState('');
  const titleInputRef = useRef(null);
  const [isIgnoredRequest,setIsIgnoredRequest]= useState('')

  // Sidebar state
  const [userName, setUserName] = useState('');
  const [userPFP, setUserPFP] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isLogoutPopup, setLogoutPopup] = useState(false);
  const logoutPopupRef = useRef(null);

  // Fetch user data


  useEffect(() => {
    getUserName();
    getUserEmail();
    getUserPFP();
  }, []);

  async function getUserName() {
    try {
      const attributes = await fetchUserAttributes();
      setUserName(attributes.name || attributes.email);
    } catch (error) {
      console.error('Error fetching user attributes:', error);
    }
  }

  async function getUserEmail() {
    try {
      const attributes = await fetchUserAttributes();
      setUserEmail(attributes.email || attributes.name);
    } catch (error) {
      console.error('Error fetching user Email:', error);
    }
  }

  async function getUserPFP() {
    try {
      const attributes = await fetchUserAttributes();
      setUserPFP(attributes.picture || "https://askthescientists.com/wp-content/uploads/2021/04/AdobeStock_240042551-scaled.jpeg");
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const handleSignOut = async () => {
    try {
      sessionStorage.removeItem('oauth_source');
      sessionStorage.removeItem('oauth_completed');
      await signOut({ global: true });
      setTimeout(() => navigate('/'), 0);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Close popup when clicking outside
  const profileButtonRef = useRef(null);
  
  useEffect(() => {
    function handleClick(event) {
      if (logoutPopupRef.current && 
          !logoutPopupRef.current.contains(event.target) &&
          profileButtonRef.current &&
          !profileButtonRef.current.contains(event.target)) {
        setLogoutPopup(false);
      }
    }
    if (isLogoutPopup) {
      addEventListener("mousedown", handleClick);
    }
    return () => {
      removeEventListener("mousedown", handleClick);
    };
  }, [isLogoutPopup]);

  // Close popup on escape
  useEffect(() => {
    function escapeHandler(event) {
      if (event.key === "Escape") {
        setLogoutPopup(false);
      }
    }
    if (isLogoutPopup) {
      addEventListener("keydown", escapeHandler);
    }
    return () => {
      removeEventListener("keydown", escapeHandler);
    };
  }, [isLogoutPopup]);

  useEffect(() => {
    const fetchJSON = async () => {
      try {
        setIsLoading(true);
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        
        const response = await fetch(
          `https://9e89rfm90l.execute-api.us-west-2.amazonaws.com/getJSON`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              batchID: batchID,
              type: 'Flashcards'
            })
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        // Extract items array and ignored_requests
        const items = data.items || data;  // Fallback to data if old format
        const ignoredRequests = data.ignored_requests || '';
        
        setBatchJSON(items);  // ✅ Store only the items array
        
        // Log ignored requests if present
        if (ignoredRequests) {
            setIsIgnoredRequest(ignoredRequests)
        }
        
        setIsLoading(false);
    } catch (err) {
        console.error('Error fetching flashcard data:', err);
        setError(err.message);
        setIsLoading(false);
        }
    };

    if (batchID) {
        fetchJSON();
    }
    }, [batchID]);

    useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!batchJSON || batchJSON.length === 0 || isEditingTitle) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0 && !isNavigating) {
          setIsNavigating(true);
          setIsFlipped(false);
          setSlideDirection('slide-right');
          
          setTimeout(() => {
            setCurrentIndex(prev => Math.max(prev - 1, 0));
            setSlideDirection('');
          }, 200);
          
          setTimeout(() => {
            setIsNavigating(false);
          }, 150);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < batchJSON.length - 1 && !isNavigating) {
          setIsNavigating(true);
          setIsFlipped(false);
          setSlideDirection('slide-left');
          
          setTimeout(() => {
            setCurrentIndex(prev => Math.min(prev + 1, batchJSON.length - 1));
            setSlideDirection('');
          }, 200);
          
          setTimeout(() => {
            setIsNavigating(false);
          }, 150);
        }
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [batchJSON, currentIndex, isNavigating, isEditingTitle]);

  const goToNext = () => {
    if (currentIndex >= batchJSON.length - 1 || isNavigating) return;
    
    setIsNavigating(true);
    setIsFlipped(false);
    setSlideDirection('slide-left');
    
    setTimeout(() => {
      setCurrentIndex(prev => Math.min(prev + 1, batchJSON.length - 1));
      setSlideDirection('');
    }, 200);
    
    setTimeout(() => {
      setIsNavigating(false);
    }, 150);
  };

  const goToPrevious = () => {
    if (currentIndex <= 0 || isNavigating) return;
    
    setIsNavigating(true);
    setIsFlipped(false);
    setSlideDirection('slide-right');
    
    setTimeout(() => {
      setCurrentIndex(prev => Math.max(prev - 1, 0));
      setSlideDirection('');
    }, 200);
    
    setTimeout(() => {
      setIsNavigating(false);
    }, 150);
  };

  const handleShuffle = () => {
    if (!batchJSON || batchJSON.length === 0) return;
    
    const shuffled = [...batchJSON].sort(() => Math.random() - 0.5);
    setBatchJSON(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleCardClick = () => {
    setIsFlipped(prev => !prev);
  };

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setEditingName(batchName);
  };

  const handleTitleSubmit = async () => {
    if (!editingName.trim()) {
      setIsEditingTitle(false);
      return;
    }

    // If name hasn't changed, just exit editing mode
    if (editingName === batchName) {
      setIsEditingTitle(false);
      setEditingName('');
      return;
    }

    const oldName = batchName;
    
    // Optimistically update the UI
    setBatchName(editingName);
    setIsEditingTitle(false);
    setEditingName('');

    // API call in background
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      const response = await fetch('https://9e89rfm90l.execute-api.us-west-2.amazonaws.com/rename', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batch_ID: batchID,
          new_name: editingName
        })
      });
      
      if (!response.ok) {
        // Rollback on failure
        setBatchName(oldName);
      }
    } catch (err) {
      console.error('Error renaming batch:', err);
      // Rollback on error
      setBatchName(oldName);
    }
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setEditingName('');
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Close title input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (titleInputRef.current && !titleInputRef.current.contains(event.target)) {
        handleTitleSubmit();
      }
    };

    if (isEditingTitle) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingTitle, editingName, batchName, batchID]);

  if (isLoading) {
    return (
      <div className="flashcard-container loading">
        <div className="message">Loading flashcards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flashcard-container error">
        <div className="message">Error: {error}</div>
      </div>
    );
  }

  if (!batchJSON || batchJSON.length === 0) {
    return (
      <div className="flashcard-container empty">
        <div className="message">No flashcard data found</div>
      </div>
    );
  }

  const currentCard = batchJSON[currentIndex];

  return (
    <>
      {/* Collapsed Sidebar */}
      <div className='collapsedSidebar'>
        <div className='collapsedSidebarButtons'>
          
          <button 
            className='homeButton'
            title="Dashboard"
            onClick={() => navigate('/Dashboard')}
            >
            <img 
              className='homeButtonIcon' 
              src='https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2012/png/iconmonstr-home-3.png&r=0&g=0&b=0' 
              alt='quiz icon'
            />
          </button>
          
          <button 
            className='collapsedSideButton'
            title="Upgrade Plan"
          >
            <img 
              className='collapsedSidebarIcon' 
              src='/starIcon.png' 
              alt='flashcards icon'
            />
          </button>
          
          <button 
            className='collapsedSideButton'
            title="Ignored Special Instructions"
          >
            <img 
              className='collapsedSidebarIcon' 
              src='https://uxwing.com/wp-content/themes/uxwing/download/signs-and-symbols/exclamation-icon.png' 
              alt='flashcards icon'
            />
          </button>
        </div>

        {/* Profile Section at Bottom */}
        <div className='collapsedLogOutSection'>
          <div className={isLogoutPopup ? 'activeCollapsedPFPWrapper' : 'collapsedPFPWrapper'}>
            <button 
              ref={profileButtonRef}
              className='collapsedPFPButton' 
              onClick={(e) => {
                e.stopPropagation();
                setLogoutPopup(!isLogoutPopup);
              }}
              title='Account'
            >
              <img 
                className='collapsedUserPFP' 
                src={userPFP} 
                alt='profile picture'
                onError={(e) => {
                  e.target.src = "https://askthescientists.com/wp-content/uploads/2021/04/AdobeStock_240042551-scaled.jpeg";
                }}
              />
            </button>
          </div>
        </div>

        {/* Logout Popup */}
        {isLogoutPopup && (
          <div className="collapsedLogoutPopupContainer">
            <div className="logoutPopup" ref={logoutPopupRef}>
              <div className='logoutPopupPFP'>
                <div className='PFPWrapper'>
                  <button className='PFPButtonPopup'>
                    <img 
                      className='userPFPPopup' 
                      src={userPFP} 
                      alt='profile picture'
                      onError={(e) => {
                        e.target.src = "https://askthescientists.com/wp-content/uploads/2021/04/AdobeStock_240042551-scaled.jpeg";
                      }}
                    />
                    <div>
                      <span className='userNameText'>{userName}</span>
                      <p className='accountEmailDisplayPopup'>{userEmail}</p>
                    </div>
                  </button>
                </div>
              </div>
          
              <div className='logoutPopupContent'>
                <div className='popupUpgradePlan'>
                  <button className='bottomDashboardSideButtons'>
                    <img className='sidebarIcon' src='/starIcon.png' alt='Support icon'/>
                    <span>Upgrade Plan</span>
                  </button>
                </div>
                <button className='bottomDashboardSideButtons'>
                  <img className='sidebarIcon' src='https://uxwing.com/wp-content/themes/uxwing/download/computers-mobile-hardware/headphone-headset-icon.png' alt='Support icon'/>
                  <span>Support</span>
                </button>
                <button className='bottomDashboardSideButtons' onClick={handleSignOut}>
                  <img className='sidebarIcon' src='https://uxwing.com/wp-content/themes/uxwing/download/web-app-development/log-in-icon.png' alt='Logout icon'/>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Flashcard Content */}
      <div className="flashcard-container">
        <div className="flashcard-header">
          <h1 className="title" onClick={handleTitleClick} style={{ cursor: 'pointer' }}>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                className="title-input"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  border: '2px solid #AB9FF2',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  outline: 'none',
                  width: '100%',
                  maxWidth: '500px'
                }}
              />
            ) : (
              `${batchName}`
            )}
          </h1>
          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{
                width: `${((currentIndex + 1) / batchJSON.length) * 100}%`
              }}
            />
          </div>
          <p className="card-counter">
            Card {currentIndex + 1} of {batchJSON.length}
          </p>
          <p className="instructions">
            Click card or press Space/↑/↓ to flip • ← → to navigate
          </p>
        </div>

        <div className="card-and-controls-wrapper">
          <div className="card-wrapper">
            <div 
              className={`card ${isFlipped ? 'flipped' : ''} ${slideDirection}`}
              onClick={handleCardClick}
            >
              <div className="card-face card-front">
                <div className="card-label">QUESTION</div>
                <div className="card-content">{currentCard.front}</div>
              </div>
              <div className="card-face card-back">
                <div className="card-label">ANSWER</div>
                <div className="card-content">{currentCard.back}</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleShuffle}
            className="shuffle-button"
            title="Shuffle cards"
          >
            <img 
              className='shuffleIcon' 
              src='https://uxwing.com/wp-content/themes/uxwing/download/controller-and-music/music-player-shuffle-symbol-icon.png'
              alt='shuffle'
            />
          </button>
        </div>

        <div className="navigation-controls">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="nav-button"
          >
            <span className="arrow">←</span>
          </button>

          <button
            onClick={goToNext}
            disabled={currentIndex === batchJSON.length - 1}
            className="nav-button"
          >
            <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </>
  );
}