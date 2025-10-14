import React from "react";
import "./sectionOne.css";
import googleLogo from "../public/GoogleLogo.png"; // put your Google logo in src folder

export default function SectionOne() {
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

        {/* Buttons container */}
        <div className="buttonGroup">
        <button className="signUpButton">
        <span className="useCrammi">Sign Up,</span> It's Free <span className="arrow">→</span>
        </button>
          <button className="googleSignUp">
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
