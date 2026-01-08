import React, { useState, useEffect } from 'react';
import { fetchUserAttributes, fetchAuthSession, signOut, updateUserAttributes } from 'aws-amplify/auth';
import './AccountPage.css';
import { useNavigate } from 'react-router-dom';
import LoadingAnimation from './LoadingScreen';

export default function AccountPage({ onNavigateBack }){
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  // Form state
  const [fullName, setFullName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPFP, setUserPFP] = useState('');
  const [activeSection, setActiveSection] = useState('General');
  const [isFederatedUser, setIsFederatedUser] = useState(false);
  const [identityProvider, setIdentityProvider] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user attributes
      const attributes = await fetchUserAttributes();
      const session = await fetchAuthSession();
      
      setFullName(attributes.name || attributes.email || '');
      setUserEmail(attributes.email || '');
      setUserPFP(attributes.picture || 'crammipink.png');
      
      // Check if user is federated (signed in with Google)
      const identities = attributes.identities;
      if (identities) {
        try {
          const identitiesArray = JSON.parse(identities);
          if (identitiesArray && identitiesArray.length > 0) {
            setIsFederatedUser(true);
            setIdentityProvider(identitiesArray[0].providerName || 'Google');
          }
        } catch (e) {
          // If identities is not JSON, check if picture URL indicates Google
          if (attributes.picture && attributes.picture.includes('googleusercontent')) {
            setIsFederatedUser(true);
            setIdentityProvider('Google');
          }
        }
      }
      
      // Load preferred name from localStorage
      const savedPreferredName = localStorage.getItem('preferredName') || attributes.name || attributes.email || '';
      setPreferredName(savedPreferredName);

      // Fetch user profile from API
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

  const handleSavePreferences = async () => {
    try {
      // Validate input length
      if (preferredName.trim().length === 0) {
        alert('Please enter a name.');
        return;
      }
      
      if (preferredName.length > 100) {
        alert('Name is too long. Please keep it under 100 characters.');
        return;
      }
      
      // Save to Cognito User Pool
      await updateUserAttributes({
        userAttributes: {
          name: preferredName.trim(), // Also trim whitespace
        }
      });
      
      // Also save to localStorage as backup
      localStorage.setItem('preferredName', preferredName.trim());
      
      // Update local state
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
    navigate('/ForgotPassword');
  };

  const handleDeleteAccount = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      // Call your delete account API endpoint
      const response = await fetch('', {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Clear localStorage
        localStorage.clear();
        sessionStorage.clear();
        
        // Sign out and redirect
        await signOut({ global: true });
        alert('Your account has been successfully deleted.');
        setTimeout(() => navigate('/'), 0);
      } else {
        alert('Failed to delete account. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('An error occurred while deleting your account. Please contact support.');
    }
  };

  const getInitial = () => {
    if (fullName) return fullName.charAt(0).toUpperCase();
    if (userEmail) return userEmail.charAt(0).toUpperCase();
    return 'U';
  };

  if (loading) {
    return (
      <LoadingAnimation/>
    );
  }

  return (
    <div className="account-settings-container">
      {showDeleteConfirm && (
        <div className="delete-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="delete-modal-title">Delete Account</h2>
            <p className="delete-modal-text">
              Are you sure you want to delete your account? This action cannot be undone. 
              All your data, including exams, quizzes, and flashcards will be permanently deleted.
            </p>
            <div className="delete-modal-buttons">
              <button className="delete-cancel-button" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="delete-confirm-button" onClick={handleDeleteAccount}>
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="account-settings-sidebar">
        <img className='settingsLogo' src="crammiLogo.png" alt="Crammi Logo"/>
        <h1 className="settings-title">Settings</h1>
        <nav className="settings-nav">
          <button 
            className={activeSection === 'General' ? 'settings-nav-item active' : 'settings-nav-item'}
            onClick={() => setActiveSection('General')}
          >
            ⚙️ General
          </button>
          <button 
            className={activeSection === 'Account' ? 'settings-nav-item active' : 'settings-nav-item'}
            onClick={() => setActiveSection('Account')}
          >
            👤 Account
          </button>
          <button 
            className={activeSection === 'Billing' ? 'settings-nav-item active' : 'settings-nav-item'}
            onClick={() => setActiveSection('Billing')}
          >
            💸 Billing
          </button>
          <button 
            className="settings-nav-item"
            onClick={()=>navigate('/Dashboard')}
          >
            ← Back to Dashboard
          </button>
          <button 
            className="settings-nav-item sign-out-button"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </nav>
      </div>

      <div className="account-settings-content">
        {activeSection === 'General' && (
          <>
            <section className="settings-section">
              <h2 className="section-title">Profile</h2>
              
              <div className="profile-card">
                <div className="profile-picture-section">
                  {userPFP ? (
                    <img 
                      src={userPFP} 
                      alt="Profile" 
                      className="profile-picture-large"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="profile-picture-large avatar-circle-large" style={{ display: userPFP ? 'none' : 'flex' }}>
                    {getInitial()}
                  </div>
                  <div className="profile-info-centered">
                    <h3 className="profile-name">{fullName}</h3>
                    <p className="profile-email">{userEmail}</p>
                  </div>
                </div>
              </div>

              <div className="form-group full-width">
                <label className="form-label">What should Crammi call you?</label>
                <input
                  type="text"
                  className="form-input"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="Enter your preferred name"
                />
              </div>

              <button className="save-button" onClick={handleSavePreferences}>
                Save Changes
              </button>
            </section>

            {isFederatedUser && (
              <section className="settings-section">
                <h2 className="section-title">Linked Accounts</h2>
                <div className="linked-accounts-card">
                  <div className="linked-account-item">
                    <div className="linked-account-info">
                      <img 
                        src="https://www.google.com/favicon.ico" 
                        alt="Google" 
                        className="provider-icon"
                      />
                      <div className="linked-account-details">
                        <span className="linked-account-name">{identityProvider}</span>
                        <span className="linked-account-email">{userEmail}</span>
                      </div>
                    </div>
                    <span className="linked-badge">Connected</span>
                  </div>
                </div>
              </section>
            )}

            {!isFederatedUser && (
              <section className="settings-section">
                <h2 className="section-title">Password</h2>
                <div className="password-card">
                  <div className="password-item">
                    <div className="password-field">
                      <label className="form-label">Current Password</label>
                      <input
                        type="password"
                        className="form-input"
                        value="••••••••••••"
                        disabled
                      />
                    </div>
                    <button className="reset-password-button" onClick={handleResetPassword}>
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
            <section className="settings-section">
              <h2 className="section-title">Account Information</h2>
              <div className="info-card">
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{userEmail}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Account Type:</span>
                  <span className="info-value">{userProfile?.subscription || 'Free Plan'}</span>
                </div>
                {userProfile?.examsGenerated !== undefined && (
                  <div className="info-item">
                    <span className="info-label">Exams Generated:</span>
                    <span className="info-value">{userProfile.examsGenerated}</span>
                  </div>
                )}
                {userProfile?.quizzesGenerated !== undefined && (
                  <div className="info-item">
                    <span className="info-label">Quizzes Generated:</span>
                    <span className="info-value">{userProfile.quizzesGenerated}</span>
                  </div>
                )}
              </div>
            </section>

            <section className="settings-section">
              <h2 className="section-title danger-title">Danger Zone</h2>
              <div className="danger-card">
                <div className="danger-content">
                  <div className="danger-text">
                    <h3 className="danger-card-title">Delete Account</h3>
                    <p className="danger-card-description">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <button className="delete-account-button" onClick={() => setShowDeleteConfirm(true)}>
                    Delete Account
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {activeSection === 'Billing' && (
          <section className="settings-section">
            <h2 className="section-title">Billing</h2>
            <div className="info-card">
              <div className="info-item">
                <span className="info-label">Current Plan:</span>
                <span className="info-value">{userProfile?.subscription || 'Free'}</span>
              </div>
              <button className="upgrade-button-large">
                ⭐ Upgrade to Pro
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};