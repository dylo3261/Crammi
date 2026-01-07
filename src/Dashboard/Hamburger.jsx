import React, { useState } from "react";
import "./Hamburger.css";

export default function Hamburger({ userName, userEmail, userPFP, handleSignOut, changeActiveTab, activeTab }) { 
  const [isOpen, setIsopen] = useState(false);
  
  return (
    <>
      <button
        className="hamburgerButton"
        onClick={() => setIsopen(!isOpen)}
      >
        <img
          className="hamburgerIcon"
          src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/7.4.0/png/iconmonstr-menu-left-lined.png&r=0&g=0&b=0"
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
          data-emoji="🗂️"
          className={activeTab === "Flashcards" ? "activeDropdownItem" : "dropdownItem"} 
          onClick={() => {
            changeActiveTab("Flashcards");
            setIsopen(false);
          }}
        >
          <span>Flashcards</span>
        </button>

        <button 
          data-emoji="📁"
          className={activeTab === "Files" ? "activeDropdownItem" : "dropdownItem"} 
          onClick={() => {
            changeActiveTab("Files");
            setIsopen(false);
          }}
        >
          <span>Files</span>
        </button>

        {/* Bottom Section with Support and Sign Out */}
        <div className='dropdownLogOutSection'>
         
          
          <button className='dropdownItem'>
            <img className='sidebarIcon' src='https://uxwing.com/wp-content/themes/uxwing/download/computers-mobile-hardware/headphone-headset-icon.png' alt='Support icon'/>
            <span>Support</span>
          </button>
          
          <button className='dropdownItem' onClick={handleSignOut}>
            <img className='sidebarIcon' src='https://uxwing.com/wp-content/themes/uxwing/download/web-app-development/log-in-icon.png' alt='Logout icon'/>
            <span>Sign Out</span>
          </button>
        </div>

        {/* User Profile Section at Bottom */}
        <div className='dropdownProfileSection'>
          <div className='PFPWrapper'>
            <button className='PFPButton'>
              <img 
                className='userPFP' 
                src={userPFP} 
                alt='profile picture'
                onError={(e) => {
                  e.target.src = "https://askthescientists.com/wp-content/uploads/2021/04/AdobeStock_240042551-scaled.jpeg";
                }}
              />
              <div>
                <span className='userNameText'>{userName}</span>
                <p className='accountTierDisplay'>Free Plan</p>
              </div>
            </button>
            <button className='upgradeButton'>
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </>
  );
}