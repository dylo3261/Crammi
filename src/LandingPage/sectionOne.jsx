import React from "react";
import "./sectionOne.css";
import googleLogo from "../../public/GoogleLogo.png";
import { useAuth } from "react-oidc-context";

export default function SectionOne() {
  const auth = useAuth(); 
  // const handleEmailSignUp = () => {
  //   auth.signinRedirect({
  //     extraQueryParams: {
  //       signup: "true"
  //     }
  //   });
  // };
  const handleEmailSignUp = () => {
    console.log('Sign up clicked');
    console.log('Auth state:', auth);
    console.log('Is loading?', auth.isLoading);
    console.log('Is authenticated?', auth.isAuthenticated);
    
    auth.signinRedirect({
      extraQueryParams: {
        signup: "true"
      }
    }).catch(error => {
      console.error('Sign in redirect error:', error);
    });
  };

  // Sign up with Google directly
  const handleGoogleSignUp = () => {
    auth.signinRedirect({
      extraQueryParams: {
        identity_provider: "Google",
        signup: "true"
      }
    });
  };
  return (
    <section className="section-one">
      <div className="box">
        <h1 className="title">
          Say Goodbye to Slow Learning. Effortless study starts here.
        </h1>
        <h2 className="description">
          From handwritten notes to PDFs and prompts, Crammi makes study
          materials instantly ready as quizzes, flashcards, and exams.
        </h2>

        <div className="buttonGroup">
          <button className="signUpButton" onClick={handleEmailSignUp}>
            <span className="useCrammi">Sign Up,</span> It's Free <span className="arrow">→</span>
          </button>
          <button className="googleSignUp" onClick={handleGoogleSignUp}>
            <img src={googleLogo} alt="Google logo" />
            Sign Up with Google
          </button>
        </div>
      </div>

      <div className="box">
        Box 2
      </div>
    </section>
  );
}