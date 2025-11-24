import React, { useState, useEffect } from "react";
import UploadModal from './uploadModal.jsx'
import Hamburger from "./Hamburger.jsx";
import { useAuth } from "react-oidc-context"; 
import { useNavigate } from "react-router-dom";


//perfect
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
    const auth = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!auth.isLoading && !auth.isAuthenticated) {
        navigate("/");
      }
    }, [auth.isLoading, auth.isAuthenticated, navigate]);
  
    const signOutRedirect = () => {
      // Clear localStorage
      localStorage.clear();
      
      // Use environment variables
      const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
      const logoutUri = import.meta.env.VITE_LOGOUT_URI;
      const cognitoDomain = `https://${import.meta.env.VITE_COGNITO_DOMAIN}.auth.${import.meta.env.VITE_COGNITO_REGION}.amazoncognito.com`;
      
      window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    };
    
    if (auth.isLoading) {
      return <div>Loading...</div>;
    }
  
    if (auth.error) {
      return <div>Encountering error... {auth.error.message}</div>;
    }
  
    // if (auth.isAuthenticated) {
    //   return (
    //     <div>
    //       <pre> Hello: {auth.user?.profile.email} </pre>
    //       <pre> ID Token: {auth.user?.id_token} </pre>
    //       <pre> Access Token: {auth.user?.access_token} </pre>
    //       <pre> Refresh Token: {auth.user?.refresh_token} </pre>
  
    //       <button onClick={() => auth.removeUser()}>Sign out</button>
    //     </div>
    //   );
    // }

    return (
      <>
        <div className='DashboardHeader'>
          <h4 className="logotemp">Logo</h4>
          <div className="mobileHamburger">

          <Hamburger changeActiveTab={changeActiveTab} activeTab={activeTab}/>

          </div>
        </div>
        <div className='sideBar'>                                                               
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
          <button onClick={()=> changeActiveTab("Files")} className={activeTab==="Files" ? 'activeDashboardSideButtons' : 'dashboardSideButtons' }>
            <img className='sidebarIcon' src='https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2012/png/iconmonstr-folder-19.png&r=0&g=0&b=0' alt='flashcards icon'/>
            <span>Files</span>
          </button>
          <button className='dashboardSideButtons'>
            <img className='sidebarIcon' src='https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2018/png/iconmonstr-user-circle-thin.png&r=0&g=0&b=0' alt='flashcards icon'/>
            <span>Account</span>
          </button>
        </div>
        <div className='dashboardBody'>
            <div className='dashboardBodyHeader'>
            <UploadBar activeTab={activeTab} openUpload={openUpload} />
            </div>
          
        </div>
        <div className='logOutSection'>
            <button className='bottomDashboardSideButtons' >
                <img className='sidebarIcon' src='https://uxwing.com/wp-content/themes/uxwing/download/communication-chat-call/question-inquiry-icon.png' alt='Support icon'/>
                <span>Support</span>
            </button>
            <button className='bottomDashboardSideButtons' onClick={signOutRedirect}>
                <img className='sidebarIcon' src='https://uxwing.com/wp-content/themes/uxwing/download/web-app-development/logout-line-icon.png' alt='Logout icon'/>
                <span>Sign Out</span>
            </button>
        </div>
      </>
    )
  };
  