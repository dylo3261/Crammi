import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';

import './Upgrade.css';

// Load Stripe.js
const loadStripe = () => {
  return new Promise((resolve) => {
    if (window.Stripe) {
      resolve(window.Stripe('pk_live_51SnVDcDj4TJhWvNPdgvvODiTfOIBQNTILVkwZLGAlVYEjGs2ddpuKEYl7NZTg2sjUqQyxT5aWYQn09ciNobISO3100gMAWUYZc'));
    } else {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        resolve(window.Stripe('pk_live_51SnVDcDj4TJhWvNPdgvvODiTfOIBQNTILVkwZLGAlVYEjGs2ddpuKEYl7NZTg2sjUqQyxT5aWYQn09ciNobISO3100gMAWUYZc'));
      };
      document.body.appendChild(script);
    }
  });
};

export default function Upgrade() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isFree, setIsFree] = useState(false);
  const [isPlus, setIsPlus] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const location = useLocation();
  const stateUserProfile = location.state?.userProfile;

  // Fetch user profile every time
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const session = await fetchAuthSession({ forceRefresh: true });
        const token = session.tokens?.idToken?.toString();
        
  
        const response = await fetch('https://gwq0u2sdai.execute-api.us-west-2.amazonaws.com/prod/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
  
        const data = await response.json();
        setUserProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
  
    fetchUserProfile();
  }, []);

  const handleUpgrade = async (planId, billingCycle) => {
    // Block downgrades - Pro users can't click Plus button
    if (isPro && planId === 'plus') {
      return;
    }

    // If user is changing from Plus to Pro, show confirmation
    if (isPlus && planId === 'pro') {
      const targetPlan = plans.find(p => p.id === planId);
      const price = billingCycle === 'monthly' ? targetPlan.price.monthly : targetPlan.price.annual;
      
      setConfirmationDetails({
        planId,
        billingCycle,
        planName: targetPlan.name,
        price,
        period: billingCycle === 'monthly' ? 'month' : 'year'
      });
      setShowConfirmation(true);
      return;
    }

    // Otherwise, proceed normally (free -> paid)
    await processUpgrade(planId, billingCycle);
  };

  const processUpgrade = async (planId, billingCycle) => {
    setIsLoading(true);
    setLoadingPlan(planId);

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      const response = await fetch('https://js065tswp1.execute-api.us-west-2.amazonaws.com/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          planId: planId,
          billingCycle: billingCycle,
          email: userProfile?.userEmail 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle duplicate subscription error
        if (errorData.error === 'duplicate_subscription') {
          alert(errorData.message);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      console.log('Lambda response:', data);
      
      // If action is 'modified', show success and refresh
      if (data.action === 'modified') {
        setShowConfirmation(false);
        navigate(`/success/${data.newPlan}`);
        return;
      }
      
      // Otherwise redirect to checkout
      if (data.action === 'checkout' && data.sessionId) {
        console.log('Received session ID:', data.sessionId);
        const stripe = await loadStripe();
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId
        });
      
        if (error) {
          console.error('Stripe redirect error:', error);
          alert('Failed to redirect to checkout. Please try again.');
        }
      } else {
        console.error('Unexpected response format:', data);
        alert('Unexpected response from server');
      }

    } catch (error) {
      console.error('Error calling Lambda:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingPlan(null);
    }
  };

  const handleConfirmUpgrade = () => {
    processUpgrade(confirmationDetails.planId, confirmationDetails.billingCycle);
  };

  // Update tier states when userProfile changes
  useEffect(() => {
    if (!userProfile) return;
    
    switch(userProfile?.accountTier){
        case 'plus':
            setIsFree(false);
            setIsPro(false);
            setIsPlus(true);
            break;
        case 'pro':
            setIsPlus(false);
            setIsFree(false);
            setIsPro(true)
            break;
        default:
            setIsFree(true);
            setIsPro(false);
            setIsPlus(false);
    }
   }, [userProfile]);
   
  const plans = [
    {
      id: 'free',
      name: 'Free',
      emoji: '🌱',
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for trying out Crammi',
      features: [
        '3 uploads per month',
        'Up to 5 photos per upload',
        'Max 15 flashcards per set',
        'Max 10 exam questions',
        'Max 8 quiz questions',
      ],
      buttonText: 'Current Plan',
      buttonStyle: 'disabled'
    },
    {
      id: 'plus',
      name: 'Plus',
      emoji: '⚡',
      price: { monthly: 3.99, annual: 29.99 },
      description: 'Great for regular students',
      features: [
        '50 uploads per month',
        'Up to 20 photos per upload',
        'Max 50 flashcards per set',
        'Max 25 exam questions',
        'Max 15 quiz questions',
      ],
      buttonText: isPlus ? 'Current Plan' : (isPro ? 'Current Plan' : 'Upgrade to Plus'),
      buttonStyle: isPlus ? 'disabled' : (isPro ? 'disabled' : 'primary'),
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      emoji: '🚀',
      price: { monthly: 8.49, annual: 69.99 },
      description: 'For serious students who need unlimited power',
      features: [
        'Unlimited uploads',
        '*NEW* Course Mode (x5/month)',
        'Up to 50 photos per upload',
        'Max 100 flashcards per set',
        'Max 60 exam questions',
        'Max 30 quiz questions',
      ],
      buttonText: isPro ? 'Current Plan' : 'Upgrade to Pro',
      buttonStyle: isPro ? 'disabled' : 'secondary',
    }
  ];

  return (
    <div className="upgrade-page">
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="confirmation-overlay">
          <div className="confirmation-modal">
            <h2>Confirm Plan Change</h2>
            <p>You're about to change your plan to <strong>{confirmationDetails.planName}</strong></p>
            <div className="confirmation-price">
              <span className="confirm-amount">${confirmationDetails.price}</span>
              <span className="confirm-period">/{confirmationDetails.period}</span>
            </div>
            <p className="confirmation-note">
              Your subscription will be modified immediately and you'll be charged a prorated amount.
            </p>
            <div className="confirmation-buttons">
              <button 
                className="cancel-button" 
                onClick={() => setShowConfirmation(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                className="confirm-button" 
                onClick={handleConfirmUpgrade}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      <button className="back-button" onClick={() => navigate('/dashboard')}>
        ← 
      </button>
      
      <div className="upgrade-header">
        <h1 className="upgrade-title">Choose Your Plan</h1>
        <p className="upgrade-subtitle">
          Select the perfect plan for your study needs
        </p>
        
        <div className="billing-toggle" data-cycle={billingCycle}>
          <button
            className={`billing-option ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={`billing-option ${billingCycle === 'annual' ? 'active' : ''}`}
            onClick={() => setBillingCycle('annual')}
          >
            Annual
            <span className="save-badge">~4 mo/free</span>
          </button>
        </div>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${plan.popular ? 'popular' : ''}`}
          >
            {plan.popular && (
              <div className="popular-badge">Most Popular</div>
            )}
            
            <div className="plan-header">
              <div className="plan-emoji">{plan.emoji}</div>
              <h2 className="plan-name">{plan.name}</h2>
              
              <div className="plan-price">
                <span className="price-amount">
                  ${billingCycle === 'monthly' ? plan.price[billingCycle] : plan.price.annual}
                </span>
                <span className="price-period">
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
              
              {billingCycle === 'annual' && plan.price.annual > 0 && (
                <div className="annual-savings">
                  Save ${Math.round(((plan.price.monthly * 12) - plan.price.annual) * 100) / 100} per year
                </div>
              )}
            </div>

            <div className="plan-description">
              <p>{plan.description}</p>
            </div>

            <div className="plan-features">
              {plan.features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <button
              className={`plan-button ${plan.buttonStyle}`}
              disabled={plan.buttonStyle === 'disabled' || isLoading}
              onClick={() => plan.buttonStyle !== 'disabled' && handleUpgrade(plan.id, billingCycle)}
            >
              {isLoading && loadingPlan === plan.id ? 'Processing...' : plan.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}