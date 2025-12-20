import DashboardHeader from "./DashboardHeader";
import UploadModal from "./uploadModal";
import Hamburger from "./Hamburger";
import React, { useState,useEffect } from "react";
import { fetchAuthSession } from 'aws-amplify/auth';


export default function Dashboard(){
    const [activeUpload,changeActiveUpload]=useState(false);
    const [activeTab,changeActiveTab]=useState("Exams");
    const [userProfile, setUserProfile] = useState(null);
    const [idToken, setIdToken] = useState(null);


    useEffect(() => {
        const fetchUserProfile = async () => {
          try {
            // console.log('Fetching user profile...');
            
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();
            setIdToken(token);
            // console.log('Got ID token:', idToken ? 'Yes' : 'No');
      
            const response = await fetch('https://gwq0u2sdai.execute-api.us-west-2.amazonaws.com/prod/profile', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // console.log('Response status:', response.status);
      
            const data = await response.json();
            // console.log('User profile data:', data);
            
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