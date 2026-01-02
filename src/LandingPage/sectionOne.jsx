import React from "react";
import "./sectionOne.css";
import googleLogo from "../../public/GoogleLogo.png";
import { signInWithRedirect } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';

export default function SectionOne() {
  const navigate = useNavigate();
  
  const handleEmailSignUp = () => {
    navigate('/signup');
  };
  const handleEmailSignIn=()=>{
    navigate('/signin')
  }

  const handleGoogleSignUp = async () => {
    try {
      await signInWithRedirect({
        provider: 'Google'
      });
    } catch (error) {
      console.error('Google sign up error:', error);
    }
  };

  return (
    <section className="section-one">
      <div className="box">
        <h1 className="sectionOneTitle">
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