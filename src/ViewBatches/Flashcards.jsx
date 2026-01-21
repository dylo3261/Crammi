import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { fetchAuthSession, fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import ViewHamburger from "./ViewHamburger";
import "./Flashcards.css";
import LoadingAnimation from "../Dashboard/LoadingScreen";
import IgnoredDetected from "./IgnoredDetected";
// Load KaTeX once globally
let katexLoaded = false;
let katexLoadingPromise = null;

function loadKaTeX() {
    if (katexLoaded) {
        return Promise.resolve();
    }
    
    if (katexLoadingPromise) {
        return katexLoadingPromise;
    }
    
    katexLoadingPromise = new Promise((resolve) => {
        if (window.katex) {
            katexLoaded = true;
            resolve();
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        script.onload = () => {
            katexLoaded = true;
            resolve();
        };
        document.head.appendChild(script);
    });
    
    return katexLoadingPromise;
}

// Memoized LaTeX Rendering Component
const LatexText = React.memo(({ text }) => {
    const containerRef = useRef(null);
    const [isReady, setIsReady] = useState(katexLoaded);
    const lastTextRef = useRef(null);

    useEffect(() => {
        loadKaTeX().then(() => setIsReady(true));
    }, []);

    useEffect(() => {
        // Skip if text hasn't changed
        if (!containerRef.current || !text || !isReady || lastTextRef.current === text) {
            return;
        }

        lastTextRef.current = text;
        const container = containerRef.current;
        container.innerHTML = '';
        
        let textContent = text;
        
        // Auto-wrap LaTeX commands
        if (!textContent.includes('$') && (textContent.includes('\\text') || textContent.includes('\\,'))) {
            textContent = '$' + textContent + '$';
        }
        
        if (!textContent.includes('$')) {
            container.textContent = textContent;
            return;
        }
        
        // Parse and render LaTeX
        let currentPos = 0;
        
        while (currentPos < textContent.length) {
            const dollarPos = textContent.indexOf('$', currentPos);
            
            if (dollarPos === -1) {
                const textNode = document.createTextNode(textContent.substring(currentPos));
                container.appendChild(textNode);
                break;
            }
            
            if (dollarPos > currentPos) {
                const textNode = document.createTextNode(textContent.substring(currentPos, dollarPos));
                container.appendChild(textNode);
            }
            
            const closingDollarPos = textContent.indexOf('$', dollarPos + 1);
            
            if (closingDollarPos === -1) {
                const textNode = document.createTextNode(textContent.substring(dollarPos));
                container.appendChild(textNode);
                break;
            }
            
            const latexContent = textContent.substring(dollarPos + 1, closingDollarPos);
            const span = document.createElement('span');
            
            try {
                window.katex.render(latexContent, span, {
                    displayMode: false,
                    throwOnError: false
                });
                container.appendChild(span);
            } catch (e) {
                const textNode = document.createTextNode('$' + latexContent + '$');
                container.appendChild(textNode);
            }
            
            currentPos = closingDollarPos + 1;
        }
    }, [text, isReady]);

    return <span ref={containerRef}>{!isReady ? text : ''}</span>;
});

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
  const location = useLocation();
  const [batchName, setBatchName] = useState(location.state?.batchName || 'Unknown Batch');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingName, setEditingName] = useState('');
  const titleInputRef = useRef(null);
  const [isIgnoredRequest, setIsIgnoredRequest] = useState('');

  // Sidebar state
  const [userName, setUserName] = useState('');
  const [userPFP, setUserPFP] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isLogoutPopup, setLogoutPopup] = useState(false);
  const [isIgnoredPopup, setIsIgnoredPopup] = useState(false);
  const logoutPopupRef = useRef(null);
  const ignoredPopupRef = useRef(null);
  const ignoredButtonRef = useRef(null);
  const profileButtonRef = useRef(null);

  const userProfile = location.state?.userProfile || { accountTier: 'free' };
  // Memoize current card to prevent unnecessary re-renders
  const currentCard = useMemo(() => {
    return batchJSON?.[currentIndex];
  }, [batchJSON, currentIndex]);

  // Fetch user data once on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const attributes = await fetchUserAttributes();
        setUserName(attributes.name || attributes.email);
        setUserEmail(attributes.email || attributes.name);
        setUserPFP(attributes.picture || "/crammipink.png");
      } catch (error) {
        console.error('Error fetching user attributes:', error);
      }
    };
    fetchUserData();

  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      sessionStorage.removeItem('oauth_source');
      sessionStorage.removeItem('oauth_completed');
      await signOut({ global: true });
      setTimeout(() => navigate('/'), 0);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, [navigate]);

  // Combine popup click handlers into one effect
  useEffect(() => {
    function handleClick(event) {
      if (logoutPopupRef.current && 
          !logoutPopupRef.current.contains(event.target) &&
          profileButtonRef.current &&
          !profileButtonRef.current.contains(event.target)) {
        setLogoutPopup(false);
      }
      
      if (ignoredPopupRef.current && 
          !ignoredPopupRef.current.contains(event.target) &&
          ignoredButtonRef.current &&
          !ignoredButtonRef.current.contains(event.target)) {
        setIsIgnoredPopup(false);
      }
    }

    if (isLogoutPopup || isIgnoredPopup) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [isLogoutPopup, isIgnoredPopup]);

  // Combine escape handlers
  useEffect(() => {
    function escapeHandler(event) {
      if (event.key === "Escape") {
        setLogoutPopup(false);
        setIsIgnoredPopup(false);
      }
    }
    
    if (isLogoutPopup || isIgnoredPopup) {
      document.addEventListener("keydown", escapeHandler);
      return () => document.removeEventListener("keydown", escapeHandler);
    }
  }, [isLogoutPopup, isIgnoredPopup]);

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
        const items = data.items || data;
        const ignoredRequests = data.ignored_requests || '';
        
        setBatchJSON(items);
        if (ignoredRequests) {
          setIsIgnoredRequest(ignoredRequests);
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

  // Memoized navigation functions
  const goToNext = useCallback(() => {
    if (!batchJSON || currentIndex >= batchJSON.length - 1 || isNavigating) return;
    
    setIsNavigating(true);
    setIsFlipped(false);
    
    // Small delay to ensure flip animation completes before slide
    setTimeout(() => {
      setSlideDirection('slide-left');
      
      setTimeout(() => {
        setCurrentIndex(prev => Math.min(prev + 1, batchJSON.length - 1));
        setSlideDirection('');
        setIsNavigating(false);
      }, 150);
    }, 50);
  }, [batchJSON, currentIndex, isNavigating]);

  const goToPrevious = useCallback(() => {
    if (!batchJSON || currentIndex <= 0 || isNavigating) return;
    
    setIsNavigating(true);
    setIsFlipped(false);
    
    // Small delay to ensure flip animation completes before slide
    setTimeout(() => {
      setSlideDirection('slide-right');
      
      setTimeout(() => {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
        setSlideDirection('');
        setIsNavigating(false);
      }, 150);
    }, 50);
  }, [batchJSON, currentIndex, isNavigating]);

  const handleCardClick = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleShuffle = useCallback(() => {
    if (!batchJSON || batchJSON.length === 0) return;
    
    const shuffled = [...batchJSON].sort(() => Math.random() - 0.5);
    setBatchJSON(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [batchJSON]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!batchJSON || batchJSON.length === 0 || isEditingTitle) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [batchJSON, isEditingTitle, goToNext, goToPrevious]);

  const handleTitleClick = useCallback(() => {
    setIsEditingTitle(true);
    setEditingName(batchName);
  }, [batchName]);

  const handleTitleSubmit = useCallback(async () => {
    if (!editingName.trim() || editingName === batchName) {
      setIsEditingTitle(false);
      setEditingName('');
      return;
    }

    const oldName = batchName;
    setBatchName(editingName);
    setIsEditingTitle(false);
    setEditingName('');

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
        setBatchName(oldName);
      }
    } catch (err) {
      console.error('Error renaming batch:', err);
      setBatchName(oldName);
    }
  }, [editingName, batchName, batchID]);

  const handleTitleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setEditingName('');
    }
  }, [handleTitleSubmit]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (titleInputRef.current && !titleInputRef.current.contains(event.target)) {
        handleTitleSubmit();
      }
    };

    if (isEditingTitle) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditingTitle, handleTitleSubmit]);

  if (isLoading) {
    return <LoadingAnimation/>;
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

  return (
    <>
    {isIgnoredRequest ? <IgnoredDetected 
                isDetected={isIgnoredRequest}
                /> : null}
      <div className='flashcardDashboardHeader'>
        <div className="flashcardMobileHamburger">
          <ViewHamburger 
            userName={userName}
            userEmail={userEmail}
            userPFP={userPFP}
            handleSignOut={handleSignOut}
            onNavigateDashboard={() => navigate('/dashboard')}
            onUpgradePlan={() => {navigate('/upgrade', { state: { userProfile: userProfile } })}}
            onSupport={() => {navigate('/support')}}
            showIgnoredButton={!!isIgnoredRequest}
            isIgnoredRequest={isIgnoredRequest}
          />
        </div>
        <img className='dashboardLogoMobile' src='/crammiLogo.png' alt="logo"/>
      </div>

      <div className='collapsedSidebar'>
        <div className='collapsedSidebarButtons'>
          <button 
            className='homeButton'
            title="Dashboard"
            onClick={() => navigate('/dashboard')}
          >
            <img 
              className='homeButtonIcon' 
              src='/homeIcon.png' 
              alt='home icon'
            />
          </button>
          
          <Link 
            to="/upgrade"
            state={{ userProfile: userProfile }}
            className='collapsedSideButton'
            title="Upgrade Plan"
            style={{display: userProfile.accountTier==='pro'? 'none' : 'flex'}}
          >
            <img 
              className='collapsedSidebarIcon' 
              src='/starIcon.png' 
              alt='upgrade icon'
            />
          </Link>
          
          {isIgnoredRequest && (
            <button 
              ref={ignoredButtonRef}
              className='collapsedSideButton'
              title="Ignored Special Instructions"
              onClick={(e) => {
                e.stopPropagation();
                setIsIgnoredPopup(!isIgnoredPopup);
              }}
            >
              <img 
                className='collapsedSidebarIcon ignoredIcon' 
                src='/ignoredIcon.png' 
                alt='warning icon'
              />
            </button>
          )}
        </div>

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
                  e.target.src = "/crammipink.png";
                }}
              />
            </button>
          </div>
        </div>

        {isLogoutPopup && (
          <div className="collapsedLogoutPopupContainer">
            <div className="logoutPopup" ref={logoutPopupRef}>
              <div className='viewLogoutPopupPFP'>
                <div className='PFPWrapper'>
                <Link to="/settings" className='PFPButtonPopup'>
                <img 
                  className='userPFPPopup' 
                  src={userPFP} 
                  alt='profile picture'
                  onError={(e) => {
                    e.target.src = "/crammipink.png";
                  }}
                />
                <div>
                  <span className='userNameText'>{userName}</span>
                  <p className='accountEmailDisplayPopup'>{userEmail}</p>
                </div>
              </Link>
                </div>
              </div>
          
              <div className='logoutPopupContent'>
              <div className='popupUpgradePlan'>
              <Link 
                to="/upgrade" 
                state={{ userProfile: userProfile }}
                className='bottomDashboardSideButtons' 
                style={{display: userProfile.accountTier==='pro'? 'none' : 'flex'}}
              >
                <img className='sidebarIcon' src='/starIcon.png' alt='Upgrade icon'/>
                <span>Upgrade Plan</span>
              </Link>
            </div>
            <Link to="/support" className='bottomDashboardSideButtons'>
              <img className='sidebarIcon' src='/supportIcon.png' alt='Support icon'/>
              <span>Support</span>
            </Link>
            <button className='bottomDashboardSideButtons' onClick={handleSignOut}>
              <img className='sidebarIcon' src='/signOutIcon.png' alt='Logout icon'/>
              <span>Sign Out</span>
            </button>
              </div>
            </div>
          </div>
        )}

        {isIgnoredPopup && (
          <div className="ignoredPopupContainer">
            <div className="ignoredPopup" ref={ignoredPopupRef}>
              <h3 style={{ marginBottom: '10px', fontSize: '16px', fontWeight: '600', color: '#333' }}>Ignored Special Instructions</h3>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5', margin: 0 }}>
                {isIgnoredRequest}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flashcard-container">
        <div className="flashcard-header">
          <h1 className="flashcardTitle" onClick={handleTitleClick} style={{ cursor: 'pointer' }}>
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
              batchName
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
                <div className="card-content">
                  <LatexText text={currentCard?.front || ''} />
                </div>
              </div>
              <div className="card-face card-back">
                <div className="card-label">ANSWER</div>
                <div className="card-content">
                  <LatexText text={currentCard?.back || ''} />
                </div>
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
              src='/shuffleIcon.png'
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