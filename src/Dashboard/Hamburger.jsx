import React, { useState } from "react";
import "./Hamburger.css"

export default function Hamburger(){
    const [isOpen,setIsopen]=useState(false);
    return (
    <>
    <button className="hamburgerButton" onClick={() => setIsopen(!isOpen)}
    >
        <img 
        className="hamburgerIcon"
        src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/7.4.0/png/iconmonstr-menu-right-lined.png&r=0&g=0&b=0"
        onContextMenu={(e) => e.preventDefault()}
        />
    </button>

    {/* dropdown menu */}
    <div className="dropdownMenu" style={{display: isOpen ? "flex" : "none"}}>
        <button>X</button>
        <button className="dropdownItem">Exams</button>
        <button className="dropdownItem">Quizzes</button>
        <button className="dropdownItem">Flashcards</button>
        <button className="dropdownItem">Files</button>
        <button className="dropdownItem">Account</button>
    </div>

    </>

    );
}