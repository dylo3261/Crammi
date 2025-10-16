import React, { useEffect, useState, useRef } from "react";
import "./Header.css";
import { Link } from "react-router-dom";


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

      {/* Center Links */}
      <div className="header-box center-box">
        <Link className="centerBoxButtons">Product</Link>
        <Link className="centerBoxButtons">About</Link>
        <Link className="centerBoxButtons">Pricing</Link>
      </div>

      {/* Right Buttons */}
      <div className="header-box right-box">
        <Link className="header-btn headerButton">Contact Sales</Link>
        <Link className="header-btn headerButton">Log In</Link>
        <Link to='/Dashboard' className="header-btn outline"><span className='useCrammi'>Use Crammi, </span> It’s Free</Link>
      </div>

      {/* Hamburger */}
      <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        <div></div>
        <div></div>
        <div></div>
      </div>

      {/* Dropdown */}
      <div ref={dropdownRef} className={`dropdown ${menuOpen ? "show" : ""}`}>
        <Link>Product</Link>
        <Link>About</Link>
        <Link>Pricing</Link>
        <Link>Contact Sales</Link>
        <Link>Log In</Link>
      </div>
    </header>
  );
}
