import React, { useEffect, useState, useRef } from "react";
import "./Header.css";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
//alright
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown if click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && menuOpen) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header className={`header ${scrolled ? "scrolled" : ""}`}>
      {/* Left Logo */}
      <div className="header-box left-box">
        <h1 className="logo">Logo</h1>
      </div>

      {/* Center Buttons */}
      <div className="header-box center-box">
        <button className="centerBoxButtons">Product</button>
        <button className="centerBoxButtons">About</button>
        <button className="centerBoxButtons">Pricing</button>
      </div>

      {/* Right Buttons */}
      <div className="header-box right-box">
        <button className="header-btn">Contact Sales</button>
        <button className="header-btn">Log In</button>
        <button className="header-btn outline">Use Crammi, It’s Free</button>
      </div>

      {/* Hamburger */}
      <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        <div></div>
        <div></div>
        <div></div>
      </div>

      {/* Dropdown */}
      <div ref={dropdownRef} className={`dropdown ${menuOpen ? "show" : ""}`}>
        <button>Product</button>
        <button>About</button>
        <button>Pricing</button>
        <button>Contact Sales</button>
        <button>Log In</button>
      </div>
    </header>
  );
}
