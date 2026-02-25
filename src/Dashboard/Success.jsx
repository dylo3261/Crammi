import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Success.css';

export default function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const [plan, setPlan] = useState('Pro');

  useEffect(() => {
    // Determine plan from URL path
    const path = location.pathname.toLowerCase();
    if (path.includes('plus')) {
      setPlan('Plus');
    } else if (path.includes('pro')) {
      setPlan('Pro');
    }

    // Create confetti
    createConfetti();
  }, [location]);

  const createConfetti = () => {
    const confettiContainer = document.querySelector('.confetti-container');
    const colors = ['#ab9ff2', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
    
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
      confettiContainer.appendChild(confetti);
    }
  };

  const getPlanFeatures = () => {
    if (plan === 'Plus') {
      return [
        '50 uploads per month',
        '20 photo batches',
        'Limit 25 question exams',
        'Limit 15 quiz questions',
        'Limit 50 card flashcard sets',
      ];
    } else {
      return [
        'Unlimited uploads',
        '*NEW* Course Mode',
        '50 photo batches',
        'Limit 60 question exams',
        'Limit 30 quiz questions',
        'Limit 100 card flashcard sets',
      ];
    }
  };

  return (
    <div className="success-page">
      <div className="confetti-container"></div>
      
      <div className="success-content">
        <div className="success-icon">🎉</div>
        <h1 className="success-title">Welcome to Crammi {plan}!</h1>
        <p className="success-subtitle">
          Your subscription is now active. Get ready to supercharge your studying!
        </p>

        <div className="features-card">
          <h2 className="features-title">What you get with {plan}:</h2>
          <ul className="features-list">
            {getPlanFeatures().map((feature, index) => (
              <li key={index} className="feature-item">
                <span className="feature-checkmark">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <button className="dashboard-button" onClick={() => navigate('/dashboard')}>
          Go to Dashboard →
        </button>

        <p className="success-note">
          You can manage your subscription anytime in Settings
        </p>
      </div>
    </div>
  );
}