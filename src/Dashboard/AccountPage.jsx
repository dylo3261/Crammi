import React, { useState, useEffect } from 'react';
import { fetchUserAttributes, fetchAuthSession, signOut, updateUserAttributes } from 'aws-amplify/auth';
import './AccountPage.css';
import { useNavigate } from 'react-router-dom';
import LoadingAnimation from './LoadingScreen';


export default function AccountPage(){
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPFP, setUserPFP] = useState('');
  const [activeSection, setActiveSection] = useState('General');
  const [isFederatedUser, setIsFederatedUser] = useState(false);
  const [identityProvider, setIdentityProvider] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      const attributes = await fetchUserAttributes();
      const session = await fetchAuthSession();
      
      setFullName(attributes.name || attributes.email || '');
      setUserEmail(attributes.email || '');
      setUserPFP(attributes.picture || '/crammipink.png');
      
      const identities = attributes.identities;
      if (identities) {
        try {
          const identitiesArray = JSON.parse(identities);
          if (identitiesArray && identitiesArray.length > 0) {
            setIsFederatedUser(true);
            setIdentityProvider(identitiesArray[0].providerName || 'Google');
          }
        } catch (e) {
          if (attributes.picture && attributes.picture.includes('googleusercontent')) {
            setIsFederatedUser(true);
            setIdentityProvider('Google');
          }
        }
      }
      
      const savedPreferredName = localStorage.getItem('preferredName') || attributes.name || attributes.email || '';
      setPreferredName(savedPreferredName);

      const token = session.tokens?.idToken?.toString();
      const response = await fetch('https://gwq0u2sdai.execute-api.us-west-2.amazonaws.com/prod/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserPlanDisplay = () => {
    if (!userProfile?.accountTier) return 'Free Plan';
    
    const tier = userProfile.accountTier.toLowerCase();

    switch(tier) {
      case 'free':
        return 'Free Plan';
      case 'plus':
        return 'Plus Plan';
      case 'pro':
        return 'Pro Plan';
      default:
        return tier.charAt(0).toUpperCase() + tier.slice(1) + ' Plan';
    }
  };
  const renderUserPlanDisplay = () => {
    if (!userProfile?.accountTier) return <div>Free Plan</div>;
  
    const tier = userProfile.accountTier.toLowerCase();
  
    switch (tier) {
      case 'free':
        return (
          <div>
            <ul>
              <li>✓ 3 uploads per month</li>
              <li>✓ Up to 5 photos per upload</li>
              <li>✓ Max 15 flashcards per set</li>
              <li>✓ Max 10 exam questions</li>
              <li>✓ Max 8 quiz questions</li>
            </ul>
          </div>
        );
  
      case 'plus':
        return (
          <div>
          
            <ul>
              <li>✓ 50 uploads per month</li>
              <li>✓ Up to 20 photos per upload</li>
              <li>✓ Max 50 flashcards per set</li>
              <li>✓ Max 25 exam questions</li>
              <li>✓ Max 15 quiz questions</li>
            </ul>
          </div>
        );
  
      case 'pro':
        return (
          <div>
         
            <ul>
              <li>✓ Unlimited uploads</li>
              <li>✓ Up to 50 photos per upload</li>
              <li>✓ Max 100 flashcards per set</li>
              <li>✓ Max 60 exam questions</li>
              <li>✓ Max 30 quiz questions</li>
            </ul>
          </div>
        );
  
      default:
        return (
          <div>
            {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
          </div>
        );
    }
  };
  
  const handleManageBilling = async () => {
    try {
      setPortalLoading(true);
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      const returnUrl = window.location.origin + '/settings';
      
      const response = await fetch('https://js065tswp1.execute-api.us-west-2.amazonaws.com/billing', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ returnUrl })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open billing portal. Please try again.');
        setPortalLoading(false);
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('An error occurred. Please try again.');
      setPortalLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      if (preferredName.trim().length === 0) {
        alert('Please enter a name.');
        return;
      }
      
      if (preferredName.length > 100) {
        alert('Name is too long. Please keep it under 100 characters.');
        return;
      }
      
      await updateUserAttributes({
        userAttributes: {
          name: preferredName.trim(),
        }
      });
      
      localStorage.setItem('preferredName', preferredName.trim());
      
      setFullName(preferredName.trim());
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      sessionStorage.removeItem('oauth_source');
      sessionStorage.removeItem('oauth_completed');
      await signOut({ global: true });
      setTimeout(() => navigate('/'), 0); 
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleResetPassword = () => {
    navigate('/forgot-password');
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      const response = await fetch('https://plbscwf6pk.execute-api.us-west-2.amazonaws.com/delAcc', {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        localStorage.clear();
        sessionStorage.clear();
        
        await signOut({ global: true });
        alert('Your account has been successfully deleted.');
        setTimeout(() => navigate('/'), 0);
      } else {
        alert('Failed to delete account. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('An error occurred while deleting your account. Please contact support.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getInitial = () => {
    if (fullName) return fullName.charAt(0).toUpperCase();
    if (userEmail) return userEmail.charAt(0).toUpperCase();
    return 'U';
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  if (loading) {
    return <LoadingAnimation/>;
  }

  const isSubscribed = userProfile?.accountTier && userProfile.accountTier.toLowerCase() !== 'free';

  return (
    <div className="crammi-account-settings-container">
      <div className="crammi-settings-mobile-header">
        <button
          className="crammi-settings-hamburger-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <img
            className="crammi-settings-hamburger-icon"
            src="/leftHamburgerIcon.png"
            alt="menu"
            onContextMenu={(e) => e.preventDefault()}
          />
        </button>
        <img className='crammi-settings-mobile-logo' src="/crammiLogo.png" alt="Crammi Logo"/>
        <h1 className="crammi-settings-mobile-title">Settings</h1>
      </div>

      <div 
        className={`crammi-mobile-menu-overlay ${mobileMenuOpen ? 'crammi-active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {showDeleteConfirm && (
        <div className="crammi-delete-modal-overlay" onClick={() => !deleteLoading && setShowDeleteConfirm(false)}>
          <div className="crammi-delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="crammi-delete-modal-title">Delete Account</h2>
            <p className="crammi-delete-modal-text">
              Are you sure you want to delete your account? This action cannot be undone. 
              All your data, including exams, quizzes, and flashcards will be permanently deleted. Any active subscriptions will be canceled.
            </p>
            <div className="crammi-delete-modal-buttons">
              <button 
                className="crammi-delete-cancel-button" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                className="crammi-delete-confirm-button" 
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Processing...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`crammi-account-settings-sidebar ${mobileMenuOpen ? 'crammi-mobile-open' : ''}`}>
        <img className='crammi-settingsLogo' src="/crammiLogo.png" alt="Crammi Logo"/>
        <h1 className="crammi-settings-title">Settings</h1>
        <nav className="crammi-settings-nav">
          <button 
            className={activeSection === 'General' ? 'crammi-settings-nav-item crammi-active' : 'crammi-settings-nav-item'}
            onClick={() => handleSectionChange('General')}
          >
            ⚙️ General
          </button>
          <button 
            className={activeSection === 'Account' ? 'crammi-settings-nav-item crammi-active' : 'crammi-settings-nav-item'}
            onClick={() => handleSectionChange('Account')}
          >
            👤 Account
          </button>
          <button 
            className={activeSection === 'Billing' ? 'crammi-settings-nav-item crammi-active' : 'crammi-settings-nav-item'}
            onClick={() => handleSectionChange('Billing')}
          >
            💸 Billing
          </button>
          <button 
            className="crammi-settings-nav-item"
            onClick={()=>{
              setMobileMenuOpen(false);
              navigate('/dashboard');
            }}
          >
            ← Back to Dashboard
          </button>
          <button 
            className="crammi-settings-nav-item crammi-sign-out-button"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </nav>
      </div>

      <div className="crammi-account-settings-content">
        {activeSection === 'General' && (
          <>
            <section className="crammi-settings-section">
              <h2 className="crammi-section-title2">Profile</h2>
              
              <div className="crammi-profile-card">
                <div className="crammi-profile-picture-section">
                  {userPFP ? (
                    <img 
                      src={userPFP} 
                      alt="Profile" 
                      className="crammi-profile-picture-large"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="crammi-profile-picture-large crammi-avatar-circle-large" style={{ display: userPFP ? 'none' : 'flex' }}>
                    {getInitial()}
                  </div>
                  <div className="crammi-profile-info-centered">
                    <h3 className="crammi-profile-name">{fullName}</h3>
                    <p className="crammi-profile-email">{userEmail}</p>
                  </div>
                </div>
              </div>

              <div className="crammi-form-group crammi-full-width">
                <label className="crammi-form-label">What should Crammi call you?</label>
                <input
                  type="text"
                  className="crammi-form-input"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="Enter your preferred name"
                />
              </div>

              <button className="crammi-save-button" onClick={handleSavePreferences}>
                Save Changes
              </button>
            </section>

            {isFederatedUser && (
              <section className="crammi-settings-section">
                <h2 className="crammi-section-title2">Linked Accounts</h2>
                <div className="crammi-linked-accounts-card">
                  <div className="crammi-linked-account-item">
                    <div className="crammi-linked-account-info">
                      <img 
                        src="https://www.google.com/favicon.ico" 
                        alt="Google" 
                        className="crammi-provider-icon"
                      />
                      <div className="crammi-linked-account-details">
                        <span className="crammi-linked-account-name">{identityProvider}</span>
                        <span className="crammi-linked-account-email">{userEmail}</span>
                      </div>
                    </div>
                    <span className="crammi-linked-badge">Connected</span>
                  </div>
                </div>
              </section>
            )}

            {!isFederatedUser && (
              <section className="crammi-settings-section">
                <h2 className="crammi-section-title2">Password</h2>
                <div className="crammi-password-card">
                  <div className="crammi-password-item">
                    <div className="crammi-password-field">
                      <label className="crammi-form-label">Current Password</label>
                      <input
                        type="password"
                        className="crammi-form-input"
                        value="••••••••••••"
                        disabled
                      />
                    </div>
                    <button className="crammi-reset-password-button" onClick={handleResetPassword}>
                      Reset Password
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {activeSection === 'Account' && (
          <>
            <section className="crammi-settings-section">
              <h2 className="crammi-section-title2">Account Information</h2>
              <div className="crammi-info-card">
                <div className="crammi-info-item">
                  <span className="crammi-info-label">Email:</span>
                  <span className="crammi-info-value">{userEmail}</span>
                </div>
                <div className="crammi-info-item">
                  <span className="crammi-info-label">Account Type:</span>
                  <span className="crammi-info-value">{getUserPlanDisplay()}</span>
                </div>
                <div className="crammi-info-item">
                  <span className="crammi-info-label">Account Permissions:</span>
                  <span className="crammi-info-value">{renderUserPlanDisplay()}</span>
                </div>
              </div>
            </section>

            <section className="crammi-settings-section">
              <h2 className="crammi-section-title2 crammi-danger-title">Danger Zone</h2>
              <div className="crammi-danger-card">
                <div className="crammi-danger-content">
                  <div className="crammi-danger-text">
                    <h3 className="crammi-danger-card-title">Delete Account</h3>
                    <p className="crammi-danger-card-description">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <button className="crammi-delete-account-button" onClick={() => setShowDeleteConfirm(true)}>
                    Delete Account
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {activeSection === 'Billing' && (
          <section className="crammi-settings-section">
            <h2 className="crammi-section-title2">Billing & Subscription</h2>
            <div className="crammi-info-card">
              <div className="crammi-info-item">
                <span className="crammi-info-label">Current Plan:</span>
                <span className="crammi-info-value">{getUserPlanDisplay()}</span>
              </div>
              
              {isSubscribed ? (
                <>
                  {userProfile?.accountTier?.toLowerCase() === 'plus' && (
                    <button 
                      className="crammi-upgrade-button-large"
                      onClick={() => navigate('/upgrade', { state: { userProfile: userProfile } })}
                    >
                      ⭐ Upgrade to Pro
                    </button>
                  )}
                  <button 
                    className="crammi-manage-billing-button" 
                    onClick={handleManageBilling}
                    disabled={portalLoading}
                  >
                    {portalLoading ? 'Opening Portal...' : '⚙️ Manage Billing & Subscription'}
                  </button>
                  <p className="crammi-billing-description">
                    {userProfile?.accountTier?.toLowerCase() === 'plus' 
                      ? 'Upgrade to Pro for more features, or manage your current subscription'
                      : 'Update payment method, view invoices, and manage your subscription'
                    }
                  </p>
                </>
              ) : (
                <button 
                  className="crammi-upgrade-button-large"
                  onClick={() => navigate('/upgrade', { state: { userProfile: userProfile } })}               
                >
                  ⭐ Upgrade to Pro
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};