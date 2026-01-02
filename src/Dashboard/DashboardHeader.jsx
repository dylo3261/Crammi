import React, { useState,useEffect,useRef } from "react";
import UploadModal from './uploadModal.jsx'
import Hamburger from "./Hamburger.jsx";
import { signOut } from 'aws-amplify/auth';
import { useNavigate } from "react-router-dom";
import { fetchUserAttributes } from 'aws-amplify/auth';
import { fetchAuthSession } from 'aws-amplify/auth';
import BatchesSection from "./BatchesSection.jsx";



function UploadBar({activeTab,openUpload}) {
  
    const showUploadExisting = activeTab !== "Files";
    return (
      <>
        <h1 className="bodyActiveTabLabel">{activeTab}</h1>
        <button onClick={openUpload}className="bodyUploadButton">
          <img
            className="uploadNewIcon"
            src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2012/png/iconmonstr-plus-6.png&r=255&g=255&b=255"
            alt="upload new icon"
          />
          <span className="dashboardHeaderText">Upload New</span>
        </button>
  
        {showUploadExisting && (
          <button className="bodySecondUploadButton">
            <img
              className="uploadExistingIcon"
              src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2018/png/iconmonstr-cloud-upload-thin.png&r=0&g=0&b=0"
              alt="upload existing icon"
            />
            <span className="dashboardHeaderTextUpload">Upload existing</span>
          </button>
        )}
  
        <div className="searchBarContainer">
          <img
            src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2018/png/iconmonstr-search-thin.png&r=0&g=0&b=0"
            alt="search icon"
            className="searchIcon"
          />
          <input type="text" className="searchInput" placeholder="Search..." />
        </div>
      </>
    );
}

export default function DashboardHeader({openUpload,changeActiveTab,activeTab}) {
  const [userName, setUserName] = useState('');
  const [userPFP, setUserPFP] = useState(null);
  const [userEmail, setUserEmail]= useState('')
  const [isLogoutPopup,setLogoutPopup]=useState(false);
  const logoutPopupRef=useRef(null);
  const profileButtonRef=useRef(null);
  const navigate = useNavigate(); 


  useEffect(()=>{
    function handleClick(event){
      if(logoutPopupRef.current&&!logoutPopupRef.current.contains(event.target)&&
         profileButtonRef.current&&!profileButtonRef.current.contains(event.target)){
        setLogoutPopup(false);
      }
    }
    if(isLogoutPopup){
      addEventListener("mousedown",handleClick);
    }
    return ()=>{
      removeEventListener("mousedown",handleClick);
    }

  },[isLogoutPopup]); //if you click anywhere outside of logout popup it goes away

  useEffect(()=>{
    
    function escapeHandler(event){
      if(event.key=="Escape"){
        setLogoutPopup(false);
      }
    }
    if(isLogoutPopup){
      addEventListener("keydown",escapeHandler);
    }
    return()=>{
      removeEventListener("keydown",escapeHandler);
    }
  },[isLogoutPopup]);


  useEffect(() => {
    getUserName();
  }, []);
  useEffect(() => {
    getUserPFP();
  }, []);
  useEffect(() => {
    getUserEmail();
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
    const session = await fetchAuthSession();

    
    const attributes = await fetchUserAttributes();
   
    
    setUserPFP(attributes.picture || "https://askthescientists.com/wp-content/uploads/2021/04/AdobeStock_240042551-scaled.jpeg");
  } catch (error) {
    console.error('Error:', error);
  }
}
  
  

const handleSignOut = async () => {
  try {
    // Clear OAuth flags before signing out
    sessionStorage.removeItem('oauth_source');
    sessionStorage.removeItem('oauth_completed');
    
    await signOut({ global: true });   // always global – fixes federated consistency
    // delay one microtask so router does NOT redirect before session clears
    setTimeout(() => navigate('/'), 0); 
  } catch (error) {
    console.error("Sign out error:", error);
  }
};

 

    return (
      <>
        <div className='DashboardHeader'>
          <h4 className="logotemp">Logo</h4>
          <div className="mobileHamburger">
            <Hamburger changeActiveTab={changeActiveTab} activeTab={activeTab}/>
          </div>
        </div>
        <div className='sideBar'> 
          <div className='userInfoTab'>
          </div>
          <div className='sideBarButtonDiv'>                                                              
          <button onClick={()=> changeActiveTab("Exams")} className={activeTab==="Exams" ? 'activeDashboardSideButtons' : 'dashboardSideButtons' }>
            <img className='sidebarIcon' src='https://uxwing.com/wp-content/themes/uxwing/download/editing-user-action/edit-list-icon.png' alt='exam icon in dashboard'/>
            <span>Exams</span>
          </button>
          <button onClick={()=> changeActiveTab("Quizzes")} className={activeTab==="Quizzes" ? 'activeDashboardSideButtons' : 'dashboardSideButtons' }>
            <img className='sidebarIcon' src='https://uxwing.com/wp-content/themes/uxwing/download/file-and-folder-type/unknown-file-icon.png' alt='quiz icon'/>
            <span>Quizzes</span>
          </button>
          <button onClick={()=> changeActiveTab("Flashcards")} className={activeTab==="Flashcards" ? 'activeDashboardSideButtons' : 'dashboardSideButtons' }>
            <img className='sidebarIcon' src='../public/FlashcardIcon.png' alt='flashcards icon'/>
            <span>Flashcards</span>
          </button>
          </div>
          <button onClick={()=> changeActiveTab("Files")} className={activeTab==="Files" ? 'activeDashboardSideButtons' : 'dashboardSideButtons' }>
            <img className='sidebarIcon' src='https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2012/png/iconmonstr-folder-19.png&r=0&g=0&b=0' alt='flashcards icon'/>
            <span>Files</span>
            
          </button>
        </div>
        <div className='dashboardBody'>
            <div className='dashboardBodyHeader'>
              <UploadBar activeTab={activeTab} openUpload={openUpload} />
            </div>
            <div className='BatchesSection'>
              <BatchesSection activeTab={activeTab}/>
            </div>
        </div>


        {isLogoutPopup && (
          <div className="logoutPopupContainer">
            <div className="logoutPopup" ref={logoutPopupRef}>

              
          <div className='logoutPopupPFP'>
          <div className='PFPWrapper'>
          <button className='PFPButtonPopup'>  {/* leaving this a button in case want to do something with it */}
            <img 
              className='userPFPPopup' 
              src={userPFP} 
              alt='profile picture'
              onError={(e) => {
                console.log('Image failed to load:', userPFP);
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
                <button className='bottomDashboardSideButtons' >
                        <img className='sidebarIcon' src='/starIcon.png' alt='Support icon'/>
                        <span>Upgrade Plan</span>
                    </button>

          </div>
              <button className='bottomDashboardSideButtons' >
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
          
             <div className={isLogoutPopup ? 'activePFPWrapper':'PFPWrapper'}>
          <button ref={profileButtonRef} className='PFPButton' onClick={(e)=> {
            e.stopPropagation();
            setLogoutPopup(!isLogoutPopup);
          }}>
            <img 
              className='userPFP' 
              src={userPFP} 
              alt='profile picture'
              onError={(e) => {
                console.log('Image failed to load:', userPFP);
                e.target.src = "https://askthescientists.com/wp-content/uploads/2021/04/AdobeStock_240042551-scaled.jpeg";
              }}
            />
            <div>
            <span className='userNameText'>{userName}</span>
            <p className='accountTierDisplay'>Free</p>
            </div>
           
           
          </button>
          <button className='upgradeButton'>
              Upgrade
            </button>
          </div>
        </div>
      </>
    )
};