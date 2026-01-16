import React, { useState, useEffect, useRef } from 'react';
import { signUp, confirmSignUp, signInWithRedirect, getCurrentUser } from 'aws-amplify/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import './Auth.css';

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [curPassword, setPassword] = useState("");
  const [PWrequirements, setPWRequirements] = useState({
    length: false,
    number: false,
    uppercase: false,
    lowercase: false,
    special: false
  });
  const validatePassword = (password) => {
    setPWRequirements({
      length: password.length >= 8,
      number: /\d/.test(password),
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      special: /[@$!%*?&#]/.test(password)
    });
  };
  
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value;
  
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
  
    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };
  
  useEffect(() => {
    const checkOAuthReturn = async () => {
      const oauthCompleted = sessionStorage.getItem('oauth_completed');
      const oauthSource = sessionStorage.getItem('oauth_source');
      
      // Check if OAuth was initiated from landing page or signup page
      if (oauthCompleted === 'true' && (oauthSource === '/signup' || oauthSource === '/')) {
        sessionStorage.removeItem('oauth_source');
        sessionStorage.removeItem('oauth_completed');
        
        try {
          await getCurrentUser();
          navigate('/Dashboard');
        } catch {
          setError('An account with this email already exists or was deleted recently. Please sign in with your email and password. If your account was recently deleted, please wait 7 days from the deletion date.');
        }
      }
    };
    
    checkOAuthReturn();
  }, [navigate]);

  const handleSignUp = async () => {
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp({
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: {
            email: formData.email,
            name: formData.name
          }
        }
      });
      setVerificationStep(true);
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    setError('');
    setLoading(true);

    try {
      await confirmSignUp({
        username: formData.email,
        confirmationCode: verificationCode.join('')
      });
      navigate('/signin');
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      sessionStorage.setItem('oauth_source', '/signup');
      await signInWithRedirect({ provider: 'Google' });
    } catch (err) {
      sessionStorage.removeItem('oauth_source');
      setError('Failed to sign in with Google');
    }
  };

  const handleSignUpKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSignUp();
    }
  };

  const handleVerificationKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleVerification();
    }
  };

  if (verificationStep) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container">
          <div className="auth-header">
            <h2>Verify Your Email</h2>
          </div>
          
          <p style={{ color: '#5f6368', marginBottom: '24px' }}>
            We sent a code to {formData.email}
          </p>
          
          {error && <div className="error">{error}</div>}
          
          <div className="codeInputContainer">
            {[...Array(6)].map((_, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                className="codeInput"
                value={verificationCode[i]}
                ref={(el) => (inputsRef.current[i] = el)}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
              />
            ))}
          </div>

          
          <button className="primary-button" onClick={handleVerification} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Account'}
          </button>
          <div className="auth-footer-text">
           Go back to{' '}
           <button onClick={() => navigate('/signin')}>Sign In</button>
         </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <h2>Sign up</h2>
        </div>

        <button className="google-button" onClick={handleGoogleSignUp}>
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
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          onKeyPress={handleSignUpKeyPress}
        />
        
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          onKeyPress={handleSignUpKeyPress}
        />
          <div className="validPWReq" style={{display: curPassword.length>0 ? "block" : "none"}}>
          <p style={{ display: "flex", alignItems: "center", justifyContent: "left", gap: "8px", color: curPassword.length >= 8 ? "green" : "#9d9d9d"}}>
            <img className="pwIcons" src={curPassword.length >= 8 ? "/validPW.png" : "/invalidPW.png"} style={{filter:curPassword.length >= 8 ? "brightness(0) saturate(100%) invert(27%) sepia(95%) saturate(1861%) hue-rotate(87deg) brightness(94%) contrast(102%)" : "brightness(0) saturate(100%) invert(69%) sepia(0%) saturate(0%) hue-rotate(182deg) brightness(92%) contrast(91%)"}} />
            Password must be at least 8 Characters
          </p>          
          <p style={{ display: "flex", alignItems: "center", justifyContent: "left", gap: "8px",color: PWrequirements.number ? "green" : "#9d9d9d" }}>
            <img className="pwIcons" src={PWrequirements.number ? "/validPW.png" : "/invalidPW.png"} style={{filter:PWrequirements.number ? "brightness(0) saturate(100%) invert(27%) sepia(95%) saturate(1861%) hue-rotate(87deg) brightness(94%) contrast(102%)" : "brightness(0) saturate(100%) invert(69%) sepia(0%) saturate(0%) hue-rotate(182deg) brightness(92%) contrast(91%)"}} />
            Use a Number
          </p>     
          <p style={{ display: "flex", alignItems: "center", justifyContent: "left", gap: "8px",color: PWrequirements.uppercase ? "green" : "#9d9d9d" }}>
            <img className="pwIcons" src={PWrequirements.uppercase ? "/validPW.png" : "/invalidPW.png"}style={{filter:PWrequirements.uppercase ?"brightness(0) saturate(100%) invert(27%) sepia(95%) saturate(1861%) hue-rotate(87deg) brightness(94%) contrast(102%)" : "brightness(0) saturate(100%) invert(69%) sepia(0%) saturate(0%) hue-rotate(182deg) brightness(92%) contrast(91%)"}} />
            Use an Uppercase Letter
          </p>            
          <p style={{ display: "flex", alignItems: "center", justifyContent: "left", gap: "8px",color: PWrequirements.lowercase ? "green" : "#9d9d9d" }}>
            <img className="pwIcons" src={PWrequirements.lowercase ? "/validPW.png" : "/invalidPW.png"} style={{filter:PWrequirements.lowercase ?"brightness(0) saturate(100%) invert(27%) sepia(95%) saturate(1861%) hue-rotate(87deg) brightness(94%) contrast(102%)" : "brightness(0) saturate(100%) invert(69%) sepia(0%) saturate(0%) hue-rotate(182deg) brightness(92%) contrast(91%)"}}/>
            Use a Lowercase Letter
          </p>            
          <p style={{ display: "flex", alignItems: "center", justifyContent: "left", gap: "8px",color: PWrequirements.special ? "green" : "#9d9d9d" }}>
            <img className="pwIcons" src={PWrequirements.special ? "/validPW.png" : "/invalidPW.png"}style={{filter:PWrequirements.special ? "brightness(0) saturate(100%) invert(27%) sepia(95%) saturate(1861%) hue-rotate(87deg) brightness(94%) contrast(102%)" : "brightness(0) saturate(100%) invert(69%) sepia(0%) saturate(0%) hue-rotate(182deg) brightness(92%) contrast(91%)"}} />
            Use a Symbol
          </p>  
        </div>
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => {
            const value = e.target.value;
          
            setPassword(value);
            validatePassword(e.target.value);
            setFormData(prev => ({ ...prev, password: value }));
          }}
          onKeyPress={handleSignUpKeyPress}
        />
        <p
          className="error"
          style={{
            display:
              formData.password &&
              formData.confirmPassword &&
              formData.password !== formData.confirmPassword
                ? "block"
                : "none"
          }}
        >
          Passwords do not match
        </p>
        <input
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          onKeyPress={handleSignUpKeyPress}
        />
        
        <button className="primary-button" onClick={handleSignUp} disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign up'}
        </button>
        <p className='bySigningUp'>
            By signing up, you agree to our{' '}
            <span 
              className='bySigningUpSpan' 
              onClick={() => navigate('/TermsOfService')}
              style={{ cursor: 'pointer' }}
            >
              Terms of service
            </span>
            {' '}and{' '}
            <span 
              className='bySigningUpSpan'
              onClick={() => navigate('/PrivacyPolicy')}
              style={{ cursor: 'pointer' }}
            >
              Privacy Policy.
            </span>
          </p>        
          
        <div className="auth-footer-text">
          Have an account?{' '}
          <button onClick={() => navigate('/signin')}>Sign In</button>
        </div>
        
      </div>
    </div>
  );
}