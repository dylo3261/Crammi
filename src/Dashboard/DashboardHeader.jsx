import React, { useState, useEffect, useRef } from "react";
import Hamburger from "./Hamburger.jsx";
import { signOut } from 'aws-amplify/auth';
import { useNavigate } from "react-router-dom";
import { fetchUserAttributes } from 'aws-amplify/auth';
import { fetchAuthSession } from 'aws-amplify/auth';
import BatchesSection from "./BatchesSection.jsx";

function UploadBar({activeTab, openUpload, openUploadExisting, searchQuery, setSearchQuery}) {
  const showUploadButtons = activeTab !== "Files";
  
  return (
    <>
      <h1 className="bodyActiveTabLabel">{activeTab}</h1>
      <div style={{display: 'flex', gap: '1rem', alignItems: 'center', marginLeft: 'auto'}}>
        {showUploadButtons && (
          <>
            <button onClick={openUpload} className="bodyUploadButton">
              <span className="plusButtonIcon">➕</span>
              <span className="dashboardHeaderText">Upload New</span>
            </button>
            <button onClick={openUploadExisting} className="bodySecondUploadButton">
              <img
                className="uploadExistingIcon"
                src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2018/png/iconmonstr-cloud-upload-thin.png&r=0&g=0&b=0"
                alt="upload existing icon"
              />
              <span className="dashboardHeaderTextUpload">Upload existing</span>
            </button>
          </>
        )}
        <div className="searchBarContainer">
          <input 
            type="text" 
            className="searchInput" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}

function RecentsSection({recents, onRecentClick}) {
  if (!recents || recents.length === 0) return null;
  
  const getEmojiForType = (type) => {
    switch(type) {
      case 'Exams': return '📝';
      case 'Quizzes': return '📋';
      case 'Flashcards': return '🗂️';
      default: return '📁';
    }
  };

  return (
    <div className="recentsSection">
      <div className="recentsSectionHeader">
        <span className="recentsSectionTitle">RECENT</span>
      </div>
      <div className="recentsList">
        {recents.slice(0, 5).map((recent, index) => (
          <button 
            key={`${recent.id}-${index}`}
            className="recentItem"
            data-emoji={getEmojiForType(recent.type)}
            onClick={() => onRecentClick(recent)}
            title={recent.name}
          >
            <span className="recentItemName">{recent.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DashboardHeader({openUpload, changeActiveTab, activeTab, openUploadExisting, batches, setBatches, isLimitReached, setIsLimitReached, limitReachedMessage,userProfile}) {
  const [userName, setUserName] = useState('');
  const [userPFP, setUserPFP] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isLogoutPopup, setLogoutPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recents, setRecents] = useState([]);
  const logoutPopupRef = useRef(null);
  const profileButtonRef = useRef(null);
  const navigate = useNavigate(); 

  // Helper function to get user-specific localStorage key
  const getRecentsKey = () => {
    return userEmail ? `crammi_recents_${userEmail}` : 'crammi_recents';
  };

  const addToRecents = (item) => {
    setRecents(prev => {
      // Remove if already exists
      const filtered = prev.filter(r => r.id !== item.id);
      // Add to front
      const updated = [item, ...filtered].slice(0, 5);
      // Save to localStorage with user-specific key
      if (userEmail) {
        localStorage.setItem(getRecentsKey(), JSON.stringify(updated));
      }
      return updated;
    });
  };

  useEffect(() => {
    function handleClick(event) {
      if (logoutPopupRef.current && !logoutPopupRef.current.contains(event.target) &&
         profileButtonRef.current && !profileButtonRef.current.contains(event.target)) {
        setLogoutPopup(false);
      }
    }
    if (isLogoutPopup) {
      addEventListener("mousedown", handleClick);
    }
    return () => {
      removeEventListener("mousedown", handleClick);
    }
  }, [isLogoutPopup]);

  useEffect(() => {
    function escapeHandler(event) {
      if (event.key == "Escape") {
        setLogoutPopup(false);
      }
    }
    if (isLogoutPopup) {
      addEventListener("keydown", escapeHandler);
    }
    return () => {
      removeEventListener("keydown", escapeHandler);
    }
  }, [isLogoutPopup]);

  useEffect(() => {
    getUserName();
    getUserPFP();
    getUserEmail();
  }, []);

  // Modified: Load recents when userEmail is available
  useEffect(() => {
    if (userEmail) {
      const savedRecents = localStorage.getItem(getRecentsKey());
      if (savedRecents) {
        try {
          setRecents(JSON.parse(savedRecents));
        } catch (error) {
          console.error('Error parsing recents:', error);
          setRecents([]);
        }
      } else {
        // No recents for this user yet
        setRecents([]);
      }
    }
  }, [userEmail]);

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
      const session = await fetchAuthSession();
      const attributes = await fetchUserAttributes();
      setUserPFP(attributes.picture || "crammipink.png");
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const handleSignOut = async () => {
    try {
      sessionStorage.removeItem('oauth_source');
      sessionStorage.removeItem('oauth_completed');
      // Clear recents on sign out
      setRecents([]);
      await signOut({ global: true });
      setTimeout(() => navigate('/'), 0); 
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleRecentClick = (recent) => {
    const batchName = recent.name;
    const batchID = recent.id;
    if(recent.type === 'Exams'){
      navigate(`/Exam/${batchID}`, {state: {batchName, userProfile}});
    }
    else if(recent.type === 'Quizzes'){
      navigate(`/Quiz/${batchID}`, {state: {batchName, userProfile}});
    }
    else if(recent.type === 'Flashcards'){
      navigate(`/Flashcards/${batchID}`, {state: {batchName, userProfile}});
    }
    else if(recent.type === 'Files'){
      navigate(`/File/${batchID}`, {state: {batchName, userProfile}});
    }
  };

  return (
    <>
      <div className='DashboardHeader'>
        <div className="mobileHamburger">
          <Hamburger 
            changeActiveTab={changeActiveTab} 
            activeTab={activeTab}
            userName={userName}
            userEmail={userEmail}
            userPFP={userPFP}
            handleSignOut={handleSignOut}
            recents={recents} 
            onRecentClick={handleRecentClick}
            RecentsSection={RecentsSection}
            userProfile={userProfile}
          />
        </div>
        <img className='dashboardLogoMobile' src='/crammiLogo.png' alt='Crammi Logo'/>
      </div>
      
      <div className='sideBar'> 
        <div className='userInfoTab'>
          <img className='dashboardLogoSidebar' src='/CrammiFinalUppercase.png' alt='Crammi'/>
        </div>
        
        <div className='sideBarButtonDiv'>
          <div className="nav-section-label">MENU</div>
          <button 
            data-emoji="📝"
            onClick={() => changeActiveTab("Exams")} 
            className={activeTab === "Exams" ? 'activeDashboardSideButtons' : 'dashboardSideButtons'}
          >
            <span>Exams</span>
          </button>
          <button 
            data-emoji="📋"
            onClick={() => changeActiveTab("Quizzes")} 
            className={activeTab === "Quizzes" ? 'activeDashboardSideButtons' : 'dashboardSideButtons'}
          >
            <span>Quizzes</span>
          </button>
          <button 
            data-emoji="🗂️"
            onClick={() => changeActiveTab("Flashcards")} 
            className={activeTab === "Flashcards" ? 'activeDashboardSideButtons' : 'dashboardSideButtons'}
          >
            <span>Flashcards</span>
          </button>
          <button 
            data-emoji="📁"
            onClick={() => changeActiveTab("Files")} 
            className={activeTab === "Files" ? 'activeDashboardSideButtons' : 'dashboardSideButtons'}
          >
            <span>Files</span>
          </button>
        </div>
        <RecentsSection recents={recents} onRecentClick={handleRecentClick} />
      </div>

      <div className='dashboardBody'>
        <div className='dashboardBodyHeader'>
          <UploadBar 
            activeTab={activeTab} 
            openUpload={openUpload} 
            openUploadExisting={openUploadExisting}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>
        <div className='BatchesSection'>
          <BatchesSection 
            activeTab={activeTab} 
            batches={batches} 
            setBatches={setBatches}
            searchQuery={searchQuery}
            addToRecents={addToRecents}
            recents={recents}
            setRecents={setRecents}
            userEmail={userEmail}
            isLimitReached={isLimitReached}
            setIsLimitReached={setIsLimitReached}
            limitReachedMessage={limitReachedMessage}
            userProfile={userProfile}
          />
        </div>
      </div>

      {isLogoutPopup && (
        <div className="logoutPopupContainer">
          <div className="logoutPopup" ref={logoutPopupRef}>
            <div className='logoutPopupPFP'>
              <button className='PFPButtonPopup' onClick={()=>navigate('/Settings')}>
                <img 
                  className='userPFPPopup' 
                  src={userPFP} 
                  alt='profile picture'
                  onError={(e) => {
                    e.target.src = "crammipink.png";
                  }}
                />
                <div>
                  <span className='userNameText'>{userName}</span>
                  <p className='accountEmailDisplayPopup'>{userEmail}</p>
                </div>
              </button>
            </div>
            <div className='logoutPopupContent'>
              <div className='popupUpgradePlan'style={{display: userProfile.accountTier==="pro"? 'none': 'flex'}}>
                <button className='bottomDashboardSideButtons' onClick={() => navigate('/Upgrade', { state: { userProfile: userProfile } })} style={{display: userProfile.accountTier==="pro"? 'none': 'flex'}}>
                  <img className='sidebarIcon' src='/starIcon.png' alt='Upgrade icon'/>
                  <span>Upgrade Plan</span>
                </button>
              </div>
              <button className='bottomDashboardSideButtons' onClick={() => navigate('/Support')} >
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

      <div className='logOutSection'>
        <div className={isLogoutPopup ? 'activePFPWrapper' : 'PFPWrapper'}>
          <button ref={profileButtonRef} className='PFPButton' onClick={(e) => {
            e.stopPropagation();
            setLogoutPopup(!isLogoutPopup);
          }}>
            <img 
              className='userPFP' 
              src={userPFP} 
              alt='profile picture'
              onError={(e) => {
                e.target.src = "crammipink.png";
              }}
            />
            <div>
              <span className='userNameText'>{userName}</span>
              <p className='accountTierDisplay'>{userProfile?.accountTier==='pro'? 'Pro Plan' : userProfile?.accountTier==='plus'? 'Plus Plan' : 'Free Plan'}</p>
            </div>
          </button>
          <button className='upgradeButton' style={{display:userProfile?.accountTier==='pro'? 'none': 'block'}} onClick={() => navigate('/Upgrade', { state: { userProfile: userProfile } })}>
            Upgrade to Pro
          </button>
        </div>
      </div>
    </>
  );
}