import DashboardHeader from "./DashboardHeader"
import UploadModal from "./uploadModal"
import React, { useState } from "react";

export default function Dashboard(){
    const [activeUpload,changeActiveUpload]=useState(false);
    return(
       <>
        <DashboardHeader openUpload={()=>changeActiveUpload(true)}/>
        <UploadModal isOpen={activeUpload} close={() => changeActiveUpload(false)} />
        </>
    )
}