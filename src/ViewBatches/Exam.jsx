import React, { useState, useEffect, useRef } from "react";
import { fetchAuthSession, fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import "./Exam.css";

export default function Exam() {
    const { batchID } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [batchJSON, setBatchJSON] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [batchName, setBatchName] = useState(location.state?.batchName || 'Unknown Batch');
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

    // Close logout popup when clicking outside
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
                setIsIgnoredPopup(false);
            }
        }
        if (isLogoutPopup || isIgnoredPopup) {
            addEventListener("keydown", escapeHandler);
        }
        return () => {
            removeEventListener("keydown", escapeHandler);
        };
    }, [isLogoutPopup, isIgnoredPopup]);

    // Close ignored popup when clicking outside
    useEffect(() => {
        function handleClick(event) {
            if (ignoredPopupRef.current && 
                !ignoredPopupRef.current.contains(event.target) &&
                ignoredButtonRef.current &&
                !ignoredButtonRef.current.contains(event.target)) {
                setIsIgnoredPopup(false);
            }
        }
        if (isIgnoredPopup) {
            addEventListener("mousedown", handleClick);
        }
        return () => {
            removeEventListener("mousedown", handleClick);
        };
    }, [isIgnoredPopup]);

    // Fetch exam data
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
                            type: 'Exams'
                        })
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                // Extract items array and ignored_requests
                const items = data.items || data;
                const ignoredRequests = data.ignored_requests || '';
                
                setBatchJSON(items);
                
                if (ignoredRequests) {
                    setIsIgnoredRequest(ignoredRequests);
                }
                
                setIsLoading(false);
            } catch (err) {
                console.error('Error fetching exam data:', err);
                setError(err.message);
                setIsLoading(false);
            }
        };

        if (batchID) {
            fetchJSON();
        }
    }, [batchID]);

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
                                className='collapsedSidebarIcon' 
                                src='https://uxwing.com/wp-content/themes/uxwing/download/signs-and-symbols/exclamation-icon.png' 
                                alt='ignored instructions icon'
                            />
                        </button>
                    )}
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

                {/* Ignored Instructions Popup */}
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

            {/* Exam Content - Empty for now */}
            <div className="exam-container">
                {/* Your exam UI will go here */}
            </div>
        </>
    );
}