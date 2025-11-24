import React, { useState } from "react";
import "./Hamburger.css";

export default function Hamburger({changeActiveTab,activeTab}) {
  const [isOpen, setIsopen] = useState(false);

  return (
    <>
      <button
        className="hamburgerButton"
        onClick={() => setIsopen(!isOpen)}
      >
        <img
          className="hamburgerIcon"
          src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/7.4.0/png/iconmonstr-menu-right-lined.png&r=0&g=0&b=0"
          alt="menu"
          onContextMenu={(e) => e.preventDefault()}
        />
      </button>

      {/* dropdown menu */}
      <div className={`dropdownMenu ${isOpen ? "open" : ""}`}>


          <button className="dropdownItem" onClick={()=> changeActiveTab("Exams")}>
            <img className="sidebarIcon" src="https://uxwing.com/wp-content/themes/uxwing/download/editing-user-action/edit-list-icon.png" alt="exam icon"/>
            Exams
          </button>

          <button className="dropdownItem" onClick={()=> changeActiveTab("Quizzes")}>
            <img className="sidebarIcon" src="https://uxwing.com/wp-content/themes/uxwing/download/file-and-folder-type/unknown-file-icon.png" alt="quiz icon"/>
            Quizzes
          </button>

          <button className="dropdownItem" onClick={()=> changeActiveTab("Flashcards")}>
            <img className="sidebarIcon" src="../public/FlashcardIcon.png" alt="flashcards icon"/>
            Flashcards
          </button>

          <button className="dropdownItem" onClick={()=> changeActiveTab("Files")}>
            <img className="sidebarIcon" src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2012/png/iconmonstr-folder-19.png&r=0&g=0&b=0" alt="files icon"/>
            Files
          </button>

          <button className="dropdownItem">
            <img className="sidebarIcon" src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2018/png/iconmonstr-user-circle-thin.png&r=0&g=0&b=0" alt="account icon"/>
            Account
          </button>

          <div className='dropdownLogOutSection'>
            <button className='dropdownItem' >
                <img className='sidebarIcon' src='https://uxwing.com/wp-content/themes/uxwing/download/communication-chat-call/question-inquiry-icon.png' alt='Support icon'/>
                <span>Support</span>
            </button>
            <button className='dropdownItem' >
                <img className='sidebarIcon' src='https://uxwing.com/wp-content/themes/uxwing/download/web-app-development/logout-line-icon.png' alt='Logout icon'/>
                <span>Sign Out</span>
            </button>
        </div>
        </div>
      
    </>
  );
}
