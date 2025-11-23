import React, { useState } from "react";
import "./horizontalActiveTabs.css"

export default function HorizontalActiveTabs({activeTab,changeActiveTab}){
    return(
        <>
        <div className="horizontalSidebar">
  <button
    onClick={() => changeActiveTab("Exams")}
    className={activeTab === "Exams" ? "activeDashboardSideButtons" : "dashboardSideButtons"}
  >
    <img
      className="sidebarIcon"
      src="https://uxwing.com/wp-content/themes/uxwing/download/editing-user-action/edit-list-icon.png"
      alt="exam icon"
    />
    <span>Exams</span>
  </button>

  <button
    onClick={() => changeActiveTab("Quizzes")}
    className={activeTab === "Quizzes" ? "activeDashboardSideButtons" : "dashboardSideButtons"}
  >
    <img
      className="sidebarIcon"
      src="https://uxwing.com/wp-content/themes/uxwing/download/file-and-folder-type/unknown-file-icon.png"
      alt="quiz icon"
    />
    <span>Quizzes</span>
  </button>

  <button
    onClick={() => changeActiveTab("Flashcards")}
    className={activeTab === "Flashcards" ? "activeDashboardSideButtons" : "dashboardSideButtons"}
  >
    <img className="sidebarIcon" src="../public/FlashcardIcon.png" alt="flashcards icon" />
    <span>Flashcards</span>
  </button>

  <button
    onClick={() => changeActiveTab("Files")}
    className={activeTab === "Files" ? "activeDashboardSideButtons" : "dashboardSideButtons"}
  >
    <img
      className="sidebarIcon"
      src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2012/png/iconmonstr-folder-19.png&r=0&g=0&b=0"
      alt="files icon"
    />
    <span>Files</span>
  </button>

  <button className="dashboardSideButtons">
    <img
      className="sidebarIcon"
      src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2018/png/iconmonstr-user-circle-thin.png&r=0&g=0&b=0"
      alt="account icon"
    />
    <span>Account</span>
  </button>
</div>

        </>

    );
}