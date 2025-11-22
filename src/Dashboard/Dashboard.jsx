import DashboardHeader from "./DashboardHeader"
import UploadModal from "./uploadModal"
import React, { useState } from "react";

export default function Dashboard(){
    const [activeUpload,changeActiveUpload]=useState(false);
    const [activeTab,changeActiveTab]=useState("Exams");
    
    return(
       <>
        <DashboardHeader openUpload={()=>changeActiveUpload(true)} changeActiveTab={changeActiveTab} activeTab={activeTab}/>
        <UploadModal isOpen={activeUpload} close={() => changeActiveUpload(false)} activeTab={activeTab} />
        </>
    )
}