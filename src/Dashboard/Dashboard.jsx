import DashboardHeader from "./DashboardHeader";
import UploadModal from "./uploadModal";
import Hamburger from "./Hamburger";
import BatchesSection from "./BatchesSection";
import React, { useState, useEffect } from "react";
import { fetchAuthSession } from 'aws-amplify/auth';


export default function Dashboard(){
    // Load activeTab from localStorage, default to "Exams"
    const [activeTab, changeActiveTab] = useState(() => {
        return localStorage.getItem('activeTab') || "Exams";
    });
    
    const [activeUpload, changeActiveUpload] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [idToken, setIdToken] = useState(null);

    // Save activeTab to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('activeTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        const fetchUserProfile = async () => {
          try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();
            setIdToken(token);
      
            const response = await fetch('https://gwq0u2sdai.execute-api.us-west-2.amazonaws.com/prod/profile', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
      
            const data = await response.json();
            setUserProfile(data);
          } catch (error) {
            console.error('Error fetching profile:', error);
          }
        };
      
        fetchUserProfile();
    }, []);
    
    return(
       <>
        <DashboardHeader openUpload={()=>changeActiveUpload(true)} changeActiveTab={changeActiveTab} activeTab={activeTab}>
            <Hamburger changeActiveTab={changeActiveTab} activeTab={activeTab}/>
        </DashboardHeader>
        <UploadModal isOpen={activeUpload} close={() => changeActiveUpload(false)} activeTab={activeTab} userProfile={userProfile} setUserProfile={setUserProfile} />
        </>
    )
}