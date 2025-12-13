import React, { useState,useRef } from 'react';
import { signIn, signInWithRedirect, resetPassword, confirmResetPassword} from 'aws-amplify/auth';

import { useNavigate } from 'react-router-dom';
import './Auth.css';

export default function ForgotPassword(){
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
   const [isStep1, setIsStep1]= useState(true);
   const [code, setCode] = useState(['', '', '', '', '', '']);
   const navigate = useNavigate();
 
   const [curPassword, setcurPassword] = useState("");
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

   //////////////////////////////////////////////
   async function handleResetPassword(username) {
     setError('');
     setLoading(true);

     try {
       const output = await resetPassword({ username });
       handleResetPasswordNextSteps(output);
     } catch (error) {
       setError(error.message || 'Failed to send verification code');
       console.log(error);
     } finally {
       setLoading(false);
     }
   }
   
   function handleResetPasswordNextSteps(output) {
     const { nextStep } = output;
     switch (nextStep.resetPasswordStep) {
       case 'CONFIRM_RESET_PASSWORD_WITH_CODE':
         const codeDeliveryDetails = nextStep.codeDeliveryDetails;
         console.log(
           `Confirmation code was sent to ${codeDeliveryDetails.deliveryMedium}`
         );
         setIsStep1(false);
         break;
       case 'DONE':
         console.log('Successfully reset password.');
         navigate('/signin');
         break;
     }
   }
   ///////////////
   async function handleConfirmResetPassword() {
     setError('');

     // Validation checks
     const codeString = code.join('');
     if (codeString.length !== 6) {
       setError('Please enter the complete 6-digit code');
       return;
     }

     if (password !== confirmPassword) {
       setError('Passwords do not match');
       return;
     }

     if (!PWrequirements.length || !PWrequirements.number || !PWrequirements.uppercase || 
         !PWrequirements.lowercase || !PWrequirements.special) {
       setError('Password must meet all requirements');
       return;
     }

     setLoading(true);

     try {
       await confirmResetPassword({ 
         username: email, 
         confirmationCode: codeString, 
         newPassword: password 
       });
       navigate('/signin');
     } catch (error) {
       setError(error.message || 'Failed to reset password');
       console.log(error);
     } finally {
       setLoading(false);
     }
   }
  ///////////////
  
  const inputsRef = useRef([]); //code input auto advance logic

  const handleChange = (e, index) => {
    const value = e.target.value;
  
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
  
    // Move to next input only if a value was entered
    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      // Only move back if current input is already empty
      inputsRef.current[index - 1].focus();
    }
  };




   // Handle Enter key press
   const handleKeyPress = (e) => {
     if (e.key === 'Enter' && !loading && isStep1) {
        handleResetPassword(email)
        }
   };
 
   return (
     <div className="auth-wrapper">
       <div className="auth-container">
         <div className="auth-header">
           <h2>Password Reset</h2>
         </div>
         <div className="stepOneReset" style={{display: isStep1? "block" : "none"}}>


        
         <p className='passwordResetText'>Enter your email, and we'll send you a code to proceed with resetting your password.</p>
         
         {error && <div className="error">{error}</div>}

        <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
        />

         
         <button className="primary-button" onClick={() => handleResetPassword(email)} disabled={loading}>
            {loading ? 'Sending...' : 'Send Code'}
         </button>

         </div>

         <div className="stepTwoReset" style={{display: isStep1?"none" : "block"}}>
         <p className='passwordResetText'>We've sent a code to your email. Please enter it below, then set your new password.</p>

         {error && <div className="error">{error}</div>}

         <div className="codeInputContainer">
            {[...Array(6)].map((_, i) => (
            <input
                key={i}
                type="text"
                maxLength={1}
                className="codeInput"
                value={code[i]}
                ref={(el) => (inputsRef.current[i] = el)}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
            />
            ))}
        </div>

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
          placeholder="New Password"
          value={password}
          onChange={(e) => {
            const value = e.target.value;
            setcurPassword(value);
            validatePassword(e.target.value);
            setPassword(value);
          }}
        />
        <p className="error" style={{display: password&&confirmPassword&&password!==confirmPassword? "block": "none"}}>Passwords do not match</p>
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button className="primary-button" onClick={handleConfirmResetPassword} disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
         </button>         
         </div>
 
         <div className="auth-footer-text">
           Go back to{' '}
           <button onClick={() => navigate('/signin')}>Sign In</button>
         </div>
       </div>
     </div>
   );
}