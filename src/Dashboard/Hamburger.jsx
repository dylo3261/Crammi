import React, { useState, useEffect, useRef } from "react";
import "./Hamburger.css";
import { useNavigate } from "react-router-dom";

export default function Hamburger({ 
  userName, 
  userEmail, 
  userPFP, 
  handleSignOut, 
  changeActiveTab, 
  activeTab, 
  recents, 
  onRecentClick, 
  RecentsSection, 
  userProfile 
}) { 
  const [isOpen, setIsOpen] = useState(false);
  const [isProfilePopup, setIsProfilePopup] = useState(false);
  const [isProfilePopupClosing, setIsProfilePopupClosing] = useState(false);
  const navigate = useNavigate();
  const popupRef = useRef(null);

  // Close popup with animation
  const closeProfilePopup = () => {
    setIsProfilePopupClosing(true);
    setTimeout(() => {
      setIsProfilePopup(false);
      setIsProfilePopupClosing(false);
    }, 300); // Match animation duration
  };

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        closeProfilePopup();
      }
    }

    if (isProfilePopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfilePopup]);

  // Close popup on escape key
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        closeProfilePopup();
      }
    }

    if (isProfilePopup) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProfilePopup]);

  const handleProfileClick = () => {
    setIsProfilePopup(true);
  };

  const handleUpgradeClick = () => {
    closeProfilePopup();
    setIsOpen(false);
    navigate('/upgrade', { state: { userProfile: userProfile } });
  };

  const handleSupportClick = () => {
    closeProfilePopup();
    setIsOpen(false);
    navigate('/support');
  };

  const handleSettingsClick = () => {
    closeProfilePopup();
    setIsOpen(false);
    navigate('/settings');
  };

  const handleSignOutClick = () => {
    closeProfilePopup();
    setIsOpen(false);
    handleSignOut();
  };
  
  return (
    <>
      <button
        className="hamburgerButton"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img
          className="hamburgerIcon"
          src="/leftHamburgerIcon.png"
          alt="menu"
          onContextMenu={(e) => e.preventDefault()}
        />
      </button>

      {/* Dropdown menu */}
      <div className={`dropdownMenu ${isOpen ? "open" : ""}`}>
        
        {/* MENU Section Label */}
        <div className="dropdownMenuLabelStudy">STUDY</div>
        
        {/* Main Navigation Buttons with emojis */}
        <button 
          data-emoji="📝"
          className={activeTab === "Exams" ? "activeDropdownItem" : "dropdownItem"} 
          onClick={() => {
            changeActiveTab("Exams");
            setIsOpen(false);
          }}
        >
          <span>Exams</span>
        </button>

        <button 
          data-emoji="📋"
          className={activeTab === "Quizzes" ? "activeDropdownItem" : "dropdownItem"} 
          onClick={() => {
            changeActiveTab("Quizzes");
            setIsOpen(false);
          }}
        >
          <span>Quizzes</span>
        </button>

        <button 
          data-emoji="🃏"
          className={activeTab === "Flashcards" ? "activeDropdownItem" : "dropdownItem"} 
          onClick={() => {
            changeActiveTab("Flashcards");
            setIsOpen(false);
          }}
        >
          <span>Flashcards</span>
        </button>

        <button 
          data-emoji="🗂️"
          className={activeTab === "Files" ? "activeDropdownItem" : "dropdownItem"} 
          onClick={() => {
            changeActiveTab("Files");
            setIsOpen(false);
          }}
        >
          <span>Files</span>
        </button>
        <div className="dropdownMenuLabel">COURSES</div>

        <button 
          data-emoji="📚"
          className={activeTab === "Course Mode" ? "activeDropdownItem" : "dropdownItem"} 
          onClick={() => {
            changeActiveTab("Course Mode");
            setIsOpen(false);
          }}
        >
          <span>Course Mode</span>
        </button>
        <div style={{display: recents.length>0 ? 'flex' : 'none'}}className="dropdownMenuLabelStudy">RECENT</div>

        {RecentsSection && <RecentsSection recents={recents} onRecentClick={onRecentClick} />}


        {/* User Profile Section at Bottom - Now opens popup */}
        <div className='dropdownProfileSection'>
          <div className='PFPWrapper'>
            <button className='PFPButton' onClick={handleProfileClick}>
              <img 
                className='userPFP' 
                src={userPFP} 
                alt='profile picture'
                onError={(e) => {
                  e.target.src = "/crammipink.png";
                }}
              />
              <div>
                <span className='userNameText'>{userName}</span>
                <p className='accountTierDisplay'>
                  {userProfile?.accountTier === 'pro' ? 'Pro Plan' : 
                   userProfile?.accountTier === 'plus' ? 'Plus Plan' : 'Free Plan'}
                </p>
              </div>
            </button>
            {userProfile?.accountTier !== 'pro' && (
              <button className='upgradeButton' onClick={handleUpgradeClick}>
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Profile Popup */}
      {isProfilePopup && (
        <div className={`dashboard-hamburger-popup-container ${isProfilePopupClosing ? 'closing' : ''}`}>
          <div className="dashboard-hamburger-popup" ref={popupRef}>
            <button onClick={handleSettingsClick} className='dashboard-hamburger-popup-pfp'>
              <img 
                src={userPFP} 
                alt='profile picture'
                onError={(e) => {
                  e.target.src = "/crammipink.png";
                }}
              />
              <div>
                <span className='dashboard-hamburger-popup-username'>{userName}</span>
                <p className='dashboard-hamburger-popup-email'>{userEmail}</p>
              </div>
            </button>
            
            <div className='dashboard-hamburger-popup-content'>
              {userProfile?.accountTier !== 'pro' && (
                <button 
                  className='dashboard-hamburger-popup-button dashboard-hamburger-popup-upgrade' 
                  onClick={handleUpgradeClick}
                >
                  <span>⭐</span>
                  <span>Upgrade Plan</span>
                </button>
              )}
            
              
              <button 
                className='dashboard-hamburger-popup-button' 
                onClick={handleSupportClick}
              >
                <img src='/supportIcon.png' alt='Support icon'/>
                <span>Support</span>
              </button>
              
              <button 
                className='dashboard-hamburger-popup-button' 
                onClick={handleSignOutClick}
              >
                <img src='/signOutIcon.png' alt='Logout icon'/>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}