import React, { useState } from 'react';
import { signIn, signInWithRedirect } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signIn({
        username: email,
        password: password
      });
      navigate('/Dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithRedirect({ provider: 'Google' });
    } catch (err) {
      setError('Failed to sign in with Google');
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSignIn();
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <h2>Sign in</h2>
        </div>

        <button className="google-button" onClick={handleGoogleSignIn}>
          <div className="google-button-content">
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </div>
          <span className="arrow-icon">›</span>
        </button>

        <div className="divider-container">
          <div className="divider-line"></div>
          <span className="divider-text">Or</span>
          <div className="divider-line"></div>
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        
        <button className="primary-button" onClick={handleSignIn} disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <div className="auth-footer-text">
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup')}>Sign Up</button>
        </div>
        <div className="auth-footer-text">
          <button >Forgot Your Password?</button>
        </div>
      </div>
    </div>
  );
}