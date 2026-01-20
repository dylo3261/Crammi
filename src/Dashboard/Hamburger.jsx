import React, { useState } from "react";
import "./Hamburger.css";
import { useNavigate } from "react-router-dom";
export default function Hamburger({ userName, userEmail, userPFP, handleSignOut, changeActiveTab, activeTab, recents, onRecentClick, RecentsSection, userProfile }) { 
  const [isOpen, setIsopen] = useState(false);
  const navigate = useNavigate(); 
  
  
  return (
    <>
      <button
        className="hamburgerButton"
        onClick={() => setIsopen(!isOpen)}
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
        <div className="dropdownMenuLabel">MENU</div>
        
        {/* Main Navigation Buttons with emojis */}
        <button 
          data-emoji="📝"
          className={activeTab === "Exams" ? "activeDropdownItem" : "dropdownItem"} 
          onClick={() => {
            changeActiveTab("Exams");
            setIsopen(false);
          }}
        >
          <span>Exams</span>
        </button>

        <button 
          data-emoji="📋"
          className={activeTab === "Quizzes" ? "activeDropdownItem" : "dropdownItem"} 
          onClick={() => {
            changeActiveTab("Quizzes");
            setIsopen(false);
          }}
        >
          <span>Quizzes</span>
        </button>

        <button 
          data-emoji="🃏"
          className={activeTab === "Flashcards" ? "activeDropdownItem" : "dropdownItem"} 
          onClick={() => {
            changeActiveTab("Flashcards");
            setIsopen(false);
          }}
        >
          <span>Flashcards</span>
        </button>

        <button 
          data-emoji="🗂️"
          className={activeTab === "Files" ? "activeDropdownItem" : "dropdownItem"} 
          onClick={() => {
            changeActiveTab("Files");
            setIsopen(false);
          }}
        >
          <span>Files</span>
        </button>
        <RecentsSection recents={recents} onRecentClick={onRecentClick} />
        {/* Bottom Section with Support and Sign Out */}
        <div className='dropdownLogOutSection'>
         
          
          <button className='dropdownItem' onClick={() => navigate('/support')}>
            <img className='sidebarIcon' src='/supportIcon.png' alt='Support icon'/>
            <span>Support</span>
          </button>
          
          <button className='dropdownItem' onClick={handleSignOut}>
            <img className='sidebarIcon' src='/signOutIcon.png' alt='Logout icon'/>
            <span>Sign Out</span>
          </button>
        </div>

        {/* User Profile Section at Bottom */}
        <div className='dropdownProfileSection'>
          <div className='PFPWrapper'>
            <button className='PFPButton' onClick={() => navigate('/settings')} >
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
                <p className='accountTierDisplay'>Free Plan</p>
              </div>
            </button>
            <button className='upgradeButton' onClick={() => navigate('/upgrade', { state: { userProfile: userProfile } })}>
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </>
  );
}