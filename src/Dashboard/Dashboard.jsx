import DashboardHeader from "./DashboardHeader";
import UploadModal from "./uploadModal";
import UploadExistingModal from "./UploadExistingModal";
import UploadCourseModal from "./UploadCourseModal"
import Hamburger from "./Hamburger";
import React, { useState, useEffect } from "react";
import { fetchAuthSession } from 'aws-amplify/auth';


export default function Dashboard(){
    // Load activeTab from localStorage, default to "Exams"
    const [activeTab, changeActiveTab] = useState(() => {
        return localStorage.getItem('activeTab') || "Exams";
    });
    const [activeUploadExisting, changeActiveUploadExisting]= useState(false);
    const [activeUpload, changeActiveUpload] = useState(false);
    const [activeCourseUpload, changeActiveCourseUpload]=useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [idToken, setIdToken] = useState(null);
    //to pass down to uploadexisting and batchessection
    const [batches, setBatches] = useState([])

    const [isLimitReached, setIsLimitReached]= useState(false);
    const [limitReachedMessage, setLimitReachedMessage]= useState(null)
    
    // Save activeTab to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('activeTab', activeTab);
    }, [activeTab]);
  
    useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem('userProfile');
        const cacheTime = localStorage.getItem('userProfileTime');
        
        // Use cache if less than 2 minutes old
        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          if (age < 0 * 60 * 1000) { // 2 minutes
            setUserProfile(JSON.parse(cached));
            return;
          }
        }

        // Fetch fresh data
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        setIdToken(token);
  
        const response = await fetch('https://gwq0u2sdai.execute-api.us-west-2.amazonaws.com/prod/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
  
        const data = await response.json();
        setUserProfile(data);
        
        // Cache the result
        localStorage.setItem('userProfile', JSON.stringify(data));
        localStorage.setItem('userProfileTime', Date.now().toString());
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
  
    fetchUserProfile();
}, []);
    
    return(
       <>
        <DashboardHeader openUpload={()=>changeActiveUpload(true)} changeActiveTab={changeActiveTab} activeTab={activeTab} openUploadExisting={()=>changeActiveUploadExisting(true)} batches={batches} setBatches={setBatches} isLimitReached={isLimitReached} setIsLimitReached={setIsLimitReached} limitReachedMessage={limitReachedMessage} userProfile={userProfile} openCourseUpload={()=>{changeActiveCourseUpload(true)}}>
            <Hamburger changeActiveTab={changeActiveTab} activeTab={activeTab} />
        </DashboardHeader>
        <UploadModal isOpen={activeUpload} close={() => changeActiveUpload(false)} activeTab={activeTab} userProfile={userProfile} setUserProfile={setUserProfile} setIsLimitReached={setIsLimitReached} setLimitReachedMessage={setLimitReachedMessage} />
        <UploadExistingModal isOpen={activeUploadExisting} close={()=>changeActiveUploadExisting(false)} activeTab={activeTab} batches={batches} setIsLimitReached={setIsLimitReached} setLimitReachedMessage={setLimitReachedMessage}/>
        <UploadCourseModal isOpen={activeCourseUpload} close={()=>{changeActiveCourseUpload(false)}} userProfile={userProfile} setIsLimitReached={setIsLimitReached} setLimitReachedMessage={setLimitReachedMessage}/>
        </>
    )
}