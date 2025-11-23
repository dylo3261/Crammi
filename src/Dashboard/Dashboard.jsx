import DashboardHeader from "./DashboardHeader"
import UploadModal from "./uploadModal"
import Hamburger from "./Hamburger"
import React, { useState } from "react";

export default function Dashboard(){
    const [activeUpload,changeActiveUpload]=useState(false);
    const [activeTab,changeActiveTab]=useState("Exams");
    
    return(
       <>
        <DashboardHeader openUpload={()=>changeActiveUpload(true)} changeActiveTab={changeActiveTab} activeTab={activeTab}>
            <Hamburger changeActiveTab={changeActiveTab} activeTab={activeTab}/>
        </DashboardHeader>
        <UploadModal isOpen={activeUpload} close={() => changeActiveUpload(false)} activeTab={activeTab} />
        </>
    )
}