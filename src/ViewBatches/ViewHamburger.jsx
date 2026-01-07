import React, { useState } from "react";
import "./ViewHamburger.css";

export default function ViewHamburger({ 
  userName, 
  userEmail, 
  userPFP, 
  handleSignOut, 
  onNavigateDashboard,
  onUpgradePlan,
  onSupport,
  showIgnoredButton = false,
  isIgnoredRequest = '',
  onIgnoredClick
}) { 
  const [isOpen, setIsOpen] = useState(false);
  const [isIgnoredPopup, setIsIgnoredPopup] = useState(false);

  const handleIgnoredClick = (e) => {
    e.stopPropagation();
    setIsIgnoredPopup(!isIgnoredPopup);
    if (onIgnoredClick) {
      onIgnoredClick();
    }
  };

  return (
    <>
      <button
        className="viewHamburgerButton"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img
          className="viewHamburgerIcon"
          src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/7.4.0/png/iconmonstr-menu-left-lined.png&r=0&g=0&b=0"
          alt="menu"
          onContextMenu={(e) => e.preventDefault()}
        />
      </button>

      {/* dropdown menu */}
      <div className={`viewDropdownMenu ${isOpen ? "open" : ""}`}>
        
        {/* Navigation Buttons */}
        <button 
          className="viewDropdownItem" 
          onClick={() => {
            if (onNavigateDashboard) onNavigateDashboard();
            setIsOpen(false);
          }}
        >
          <img 
            className="viewSidebarIcon" 
            src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2012/png/iconmonstr-home-3.png&r=0&g=0&b=0" 
            alt="home icon"
          />
          Dashboard
        </button>

        <button 
          className="viewDropdownItem"
          onClick={() => {
            if (onUpgradePlan) onUpgradePlan();
            setIsOpen(false);
          }}
        >
          <img 
            className="viewSidebarIcon" 
            src="/starIcon.png" 
            alt="upgrade icon"
          />
          Upgrade Plan
        </button>

        {showIgnoredButton && (
          <button 
            className="viewDropdownItem"
            onClick={handleIgnoredClick}
          >
            <img 
              className="viewSidebarIcon" 
              src="https://uxwing.com/wp-content/themes/uxwing/download/signs-and-symbols/exclamation-icon.png" 
              alt="ignored instructions icon"
            />
            Ignored Instructions
          </button>
        )}

        {/* Bottom Section with Support and Sign Out */}
        <div className='viewDropdownLogOutSection'>
          <button 
            className='viewDropdownItem'
            onClick={() => {
              if (onSupport) onSupport();
              setIsOpen(false);
            }}
          >
            <img 
              className='viewSidebarIcon' 
              src='https://uxwing.com/wp-content/themes/uxwing/download/computers-mobile-hardware/headphone-headset-icon.png' 
              alt='Support icon'
            />
            <span>Support</span>
          </button>
          
          <button className='viewDropdownItem' onClick={handleSignOut}>
            <img 
              className='viewSidebarIcon' 
              src='https://uxwing.com/wp-content/themes/uxwing/download/web-app-development/log-in-icon.png' 
              alt='Logout icon'
            />
            <span>Sign Out</span>
          </button>
        </div>

        {/* User Profile Section at Bottom */}
        <div className='viewDropdownProfileSection'>
          <div className='viewPFPWrapper'>
            <button className='viewPFPButton'>
              <img 
                className='viewUserPFP' 
                src={userPFP} 
                alt='profile picture'
                onError={(e) => {
                  e.target.src = "https://askthescientists.com/wp-content/uploads/2021/04/AdobeStock_240042551-scaled.jpeg";
                }}
              />
              <div>
                <span className='viewUserNameText'>{userName}</span>
                <p className='viewAccountTierDisplay'>Free</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Ignored Instructions Popup */}
      {isIgnoredPopup && isIgnoredRequest && (
        <div className="viewIgnoredPopupOverlay" onClick={() => setIsIgnoredPopup(false)}>
          <div className="viewIgnoredPopup" onClick={(e) => e.stopPropagation()}>
            <h3 className="viewIgnoredPopupTitle">Ignored Special Instructions</h3>
            <p className="viewIgnoredPopupText">{isIgnoredRequest}</p>
            <button 
              className="viewIgnoredPopupClose"
              onClick={() => setIsIgnoredPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}