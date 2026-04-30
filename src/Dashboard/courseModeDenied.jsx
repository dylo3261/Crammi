import React from 'react';
import './CourseModeDenied.css';

export default function CourseModeDenied({ isOpen, onClose, onUpgrade }) {
  if (!isOpen) return null;

  return (
    <div className="denied-overlay">
      <div className="denied-wrapper">
        
        <div className="denied-content">
          <div className="denied-icon-wrapper">
            <div className="denied-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>

          <h2 className="denied-title">Upgrade to PRO <span>👑</span></h2>
          
          <p className="denied-description">
            PDF course uploads are a premium feature. Upgrade to PRO to unlock:
          </p>

          <ul className="denied-features">
            <li><span className="denied-check">✓</span>Upload up to 1,500 pages of course material</li>
            <li><span className="denied-check">✓</span>Advanced AI study guides with summaries and practice material</li>
            <li><span className="denied-check">✓</span>Our most intelligent AI models for quality learning</li>
            <li><span className="denied-check">✓</span>Organize multiple courses</li>
            <li><span className="denied-check">✓</span>Priority Processing</li>
          </ul>
          <a 
          href="https://crammi.com/course-mode-demo.mp4" 
          className="denied-see-how" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          See how it works →
        </a>
          <div className="denied-buttons">
            <button className="denied-btn-cancel" onClick={onClose}>Maybe Later</button>
            <button className="denied-btn-upgrade" onClick={onUpgrade}>Upgrade to PRO</button>
          </div>
        </div>

        <div className="denied-video-panel">
          <video autoPlay loop muted playsInline className="denied-video">
            <source src="/course-mode-demo.mp4" type="video/mp4" />
          </video>
        </div>

      </div>
    </div>
  );
}