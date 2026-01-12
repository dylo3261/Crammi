import React, { useState, useEffect, useRef, useMemo } from "react";
import { fetchAuthSession, fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import "./Quiz.css";
import ViewHamburger from "./ViewHamburger";
import LoadingAnimation from "../Dashboard/LoadingScreen";
// Load KaTeX once globally
let katexLoaded = false;
let katexLoadingPromise = null;

function loadKaTeX() {
    if (katexLoaded) {
        return Promise.resolve();
    }
    
    if (katexLoadingPromise) {
        return katexLoadingPromise;
    }
    
    katexLoadingPromise = new Promise((resolve) => {
        if (window.katex) {
            katexLoaded = true;
            resolve();
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        script.onload = () => {
            katexLoaded = true;
            resolve();
        };
        document.head.appendChild(script);
    });
    
    return katexLoadingPromise;
}

// Optimized LaTeX Rendering Component
function LatexText({ text }) {
    const containerRef = useRef(null);
    const [isReady, setIsReady] = useState(katexLoaded);

    useEffect(() => {
        loadKaTeX().then(() => setIsReady(true));
    }, []);

    useEffect(() => {
        if (!containerRef.current || !text || !isReady) return;

        const container = containerRef.current;
        container.innerHTML = '';
        
        let textContent = text;
        
        if (!textContent.includes('$') && (textContent.includes('\\text') || textContent.includes('\\,'))) {
            textContent = '$' + textContent + '$';
        }
        
        if (!textContent.includes('$')) {
            container.textContent = textContent;
            return;
        }
        
        let currentPos = 0;
        
        while (currentPos < textContent.length) {
            const dollarPos = textContent.indexOf('$', currentPos);
            
            if (dollarPos === -1) {
                const textNode = document.createTextNode(textContent.substring(currentPos));
                container.appendChild(textNode);
                break;
            }
            
            if (dollarPos > currentPos) {
                const textNode = document.createTextNode(textContent.substring(currentPos, dollarPos));
                container.appendChild(textNode);
            }
            
            const closingDollarPos = textContent.indexOf('$', dollarPos + 1);
            
            if (closingDollarPos === -1) {
                const textNode = document.createTextNode(textContent.substring(dollarPos));
                container.appendChild(textNode);
                break;
            }
            
            const latexContent = textContent.substring(dollarPos + 1, closingDollarPos);
            const span = document.createElement('span');
            
            try {
                window.katex.render(latexContent, span, {
                    displayMode: false,
                    throwOnError: false
                });
                container.appendChild(span);
            } catch (e) {
                const textNode = document.createTextNode('$' + latexContent + '$');
                container.appendChild(textNode);
            }
            
            currentPos = closingDollarPos + 1;
        }
    }, [text, isReady]);

    return <span ref={containerRef}>{!isReady ? text : ''}</span>;
}

function QuizInterface({ quizData, onQuizComplete }) {
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [correctQuestions, setCorrectQuestions] = useState({});
    const [attemptHistory, setAttemptHistory] = useState({});
    const [shuffledAnswers, setShuffledAnswers] = useState({});

    useEffect(() => {
        const shuffled = {};
        quizData.forEach((question, index) => {
            shuffled[index] = [
                { text: question.correct_answer.text, isCorrect: true, explanation: question.correct_answer.explanation },
                ...question.wrong_answers.map(ans => ({ text: ans.text, isCorrect: false, explanation: ans.explanation }))
            ].sort(() => Math.random() - 0.5);
        });
        setShuffledAnswers(shuffled);
    }, [quizData]);

    const handleAnswerSelect = (questionIndex, answer) => {
        if (!correctQuestions[questionIndex]) {
            setSelectedAnswers(prev => ({
                ...prev,
                [questionIndex]: answer
            }));
        }
    };

    const handleCheckAnswer = (questionIndex) => {
        const selectedAnswer = selectedAnswers[questionIndex];
        if (!selectedAnswer) return;

        const answerText = selectedAnswer.text;
        
        // Track this attempt
        setAttemptHistory(prev => ({
            ...prev,
            [questionIndex]: [
                ...(prev[questionIndex] || []),
                {
                    answer: answerText,
                    isCorrect: selectedAnswer.isCorrect,
                    explanation: selectedAnswer.explanation
                }
            ]
        }));

        // If correct, mark as complete
        if (selectedAnswer.isCorrect) {
            setCorrectQuestions(prev => ({
                ...prev,
                [questionIndex]: true
            }));
        }
    };

    const getAnswerClassName = (questionIndex, answer) => {
        let className = 'quizAnswerOption';
        const selectedAnswer = selectedAnswers[questionIndex];
        const isCorrect = correctQuestions[questionIndex];
        const attempts = attemptHistory[questionIndex] || [];
        
        if (selectedAnswer === answer) {
            className += ' selected';
        }
        
        // Check if this answer was attempted before
        const wasAttempted = attempts.some(att => att.answer === answer.text);
        
        if (isCorrect && answer.isCorrect) {
            className += ' correct';
        } else if (wasAttempted && !answer.isCorrect) {
            className += ' incorrect';
        }
        
        return className;
    };

    const calculateResults = () => {
        const detailedResults = quizData.map((question, index) => {
            const attempts = attemptHistory[index] || [];
            const isCorrect = correctQuestions[index] || false;
            const firstTry = isCorrect && attempts.length === 1;
            
            return {
                question: question.question,
                correctAnswer: question.correct_answer.text,
                isCorrect: isCorrect,
                firstTry: firstTry,
                attempts: attempts,
                attemptCount: attempts.length
            };
        });

        const correctCount = Object.keys(correctQuestions).length;
        const attemptedCount = Object.keys(attemptHistory).length;
        const firstTryCount = detailedResults.filter(r => r.firstTry).length;

        return {
            correct: correctCount,
            total: quizData.length,
            attempted: attemptedCount,
            firstTryCorrect: firstTryCount,
            percentage: attemptedCount > 0 ? Math.round((correctCount / quizData.length) * 100) : 0,
            detailedResults: detailedResults
        };
    };

    const handleFinishQuiz = () => {
        const results = calculateResults();
        onQuizComplete(results);
    };

    return (
        <div className="quizInterfaceContainer">
            <div className="quizMainContent">
                <div className="quizTopBar">
                    <div className="quizQuestionCounter">
                        {quizData.length} {quizData.length === 1 ? 'Question' : 'Questions'}
                    </div>
                </div>

                <div className="quizQuestionsScrollContainer">
                    {quizData.map((question, questionIndex) => {
                        const allAnswers = shuffledAnswers[questionIndex] || [];
                        const selectedAnswer = selectedAnswers[questionIndex];
                        const isCorrect = correctQuestions[questionIndex];
                        const attempts = attemptHistory[questionIndex] || [];

                        return (
                            <div key={questionIndex} className="quizQuestionBlock">
                                <div className="quizQuestionLabel">
                                    <span className="quizQuestionIcon">📄</span>
                                    <span>Question {questionIndex + 1}:</span>
                                </div>

                                <h2 className="quizQuestionText">
                                    <LatexText text={question.question} />
                                </h2>

                                <div className="quizAnswersList">
                                    {allAnswers.map((answer, answerIndex) => {
                                        const className = getAnswerClassName(questionIndex, answer);
                                        const wasAttempted = attempts.some(att => att.answer === answer.text);
                                        const attemptData = attempts.find(att => att.answer === answer.text);
                                        const showExplanation = wasAttempted && attemptData;
                                        
                                        return (
                                            <div key={answerIndex}>
                                                <div
                                                    onClick={() => handleAnswerSelect(questionIndex, answer)}
                                                    className={className}
                                                >
                                                    <div className="quizAnswerRadio">
                                                        {selectedAnswer === answer && (
                                                            <div className="quizAnswerRadioInner" />
                                                        )}
                                                    </div>
                                                    <span className="quizAnswerText">
                                                        <LatexText text={answer.text} />
                                                    </span>
                                                    {isCorrect && answer.isCorrect && (
                                                        <span className="quizCorrectBadge">✓ Correct</span>
                                                    )}
                                                    {wasAttempted && !answer.isCorrect && (
                                                        <span className="quizIncorrectBadge">✗ Try again</span>
                                                    )}
                                                </div>
                                                {showExplanation && (
                                                    <div className="quizExplanation">
                                                        <div className="quizExplanationIcon">💡</div>
                                                        <div className="quizExplanationText">
                                                            <LatexText text={attemptData.explanation} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="quizQuestionButtonContainer">
                                    <button
                                        onClick={() => handleCheckAnswer(questionIndex)}
                                        disabled={!selectedAnswer || isCorrect}
                                        className="quizCheckAnswerButton"
                                    >
                                        {isCorrect ? 'Correct ✓' : 'Check answer'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="quizFinishContainer">
                    <button
                        onClick={handleFinishQuiz}
                        className="quizFinishButton"
                    >
                        Finish Quiz
                    </button>
                </div>
            </div>
        </div>
    );
}

function QuizScorePage({ results, onReturnToStart, batchName }) {
    const stats = useMemo(() => {
      const totalQuestions = results.total;
      const correct = results.correct;
      const firstTryCorrect = results.firstTryCorrect;
      const attempted = results.attempted;
      const scorePercentage = results.percentage;
  
      // Separate questions into categories
      const whatYouKnow = results.detailedResults.filter(q => q.firstTry);
      const whatToReview = results.detailedResults.filter(q => !q.firstTry);
  
      return { 
        totalQuestions, 
        correct, 
        firstTryCorrect, 
        attempted,
        scorePercentage,
        whatYouKnow,
        whatToReview
      };
    }, [results]);
  
    const getScoreClass = (percentage) => {
      if (percentage >= 90) return 'score-excellent';
      if (percentage >= 70) return 'score-good';
      if (percentage >= 50) return 'score-fair';
      return 'score-poor';
    };
  
    const getScoreMessage = (percentage) => {
      if (percentage >= 90) return 'Outstanding! 🎉';
      if (percentage >= 70) return 'Great job! 👍';
      if (percentage >= 50) return 'Good effort! 💪';
      return 'Keep practicing! 📚';
    };
  
    return (
      <div className="quiz-score-page">
        <div className="score-container">
          {/* Header */}
          <div className="quiz-score-header">
            <div className="header-content">
              <div className={`award-icon ${getScoreClass(stats.scorePercentage)}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="7"/>
                  <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/>
                </svg>
              </div>
              <h1 className="quizScorePageTitle">{batchName}</h1>
              <p className="quizSubtitle">{getScoreMessage(stats.scorePercentage)}</p>
            </div>
  
            {/* Score Display */}
            <div className="score-display">
              <div className={`score-percentage ${getScoreClass(stats.scorePercentage)}`}>
                {stats.scorePercentage}%
              </div>
              <p className="score-text">
                {stats.correct} out of {stats.totalQuestions} correct
              </p>
            </div>
  
            {/* Statistics Grid */}
            <div className="stats-grid">
              <div className="quiz-stat-card stat-total">
                <div className="quiz-stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="20" x2="12" y2="10"/>
                    <line x1="18" y1="20" x2="18" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="16"/>
                  </svg>
                </div>
                <div className="quiz-stat-value">{stats.totalQuestions}</div>
                <div className="quiz-stat-label">Total</div>
              </div>
              <div className="quiz-stat-card stat-correct">
                <div className="quiz-stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="quiz-stat-value">{stats.correct}</div>
                <div className="quiz-stat-label">Correct</div>
              </div>
              <div className="quiz-stat-card stat-first-try">
                <div className="quiz-stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div className="quiz-stat-value">{stats.firstTryCorrect}</div>
                <div className="quiz-stat-label">First Try</div>
              </div>
              <div className="quiz-stat-card stat-attempts">
                <div className="quiz-stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                </div>
                <div className="quiz-stat-value">{stats.attempted}</div>
                <div className="quiz-stat-label">Attempted</div>
              </div>
            </div>
  
            {/* Action Button */}
            <button
              onClick={onReturnToStart}
              className="quiz-return-button"
            >
              Finish
            </button>
          </div>
  
          {/* What You Know Section */}
          {stats.whatYouKnow.length > 0 && (
            <div className="question-review">
              <h2 className="review-title">
                <span className="review-icon">✓</span>
                What You Know ({stats.whatYouKnow.length})
              </h2>
              <div className="questions-list">
                {stats.whatYouKnow.map((questionData, idx) => (
                  <div key={idx} className="question-item question-first-try">
                    <div className="question-content">
                      <div className="question-icon">
                        <svg className="icon-first-try" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      </div>
                      <div className="question-details">
                        <div className="question-number">
                          Question {results.detailedResults.indexOf(questionData) + 1}
                        </div>
                        <div className="question-text">
                          <LatexText text={questionData.question} />
                        </div>
                        <div className="first-try-badge">
                          ⭐ Correct on first try
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
  
          {/* What to Review Section */}
          {stats.whatToReview.length > 0 && (
            <div className="question-review">
              <h2 className="review-title">
                <span className="review-icon">📚</span>
                What You Should Review ({stats.whatToReview.length})
              </h2>
              <div className="questions-list">
                {stats.whatToReview.map((questionData, idx) => {
                  const isCorrect = questionData.isCorrect;
                  const wasAttempted = questionData.attemptCount > 0;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`question-item ${
                        !wasAttempted ? 'question-skipped' : 
                        isCorrect ? 'question-correct' : 
                        'question-incorrect'
                      }`}
                    >
                      <div className="question-content">
                        <div className="question-icon">
                          {!wasAttempted ? (
                            <svg className="icon-skipped" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                            </svg>
                          ) : isCorrect ? (
                            <svg className="icon-correct" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                              <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                          ) : (
                            <svg className="icon-incorrect" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="15" y1="9" x2="9" y2="15"/>
                              <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                          )}
                        </div>
                        <div className="question-details">
                          <div className="question-number">
                            Question {results.detailedResults.indexOf(questionData) + 1}
                          </div>
                          <div className="question-text">
                            <LatexText text={questionData.question} />
                          </div>
                          
                          {!wasAttempted ? (
                            <div className="answer-skipped">Not answered</div>
                          ) : (
                            <div className="attempt-count-badge">
                                {questionData.attemptCount} {questionData.attemptCount === 1 ? 'attempt' : 'attempts'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

export default function Quiz() {
    const { batchID } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [batchJSON, setBatchJSON] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [batchName, setBatchName] = useState(location.state?.batchName || 'Unknown Batch');
    const [isIgnoredRequest, setIsIgnoredRequest] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editingName, setEditingName] = useState('');
    const titleInputRef = useRef(null);

    const [userName, setUserName] = useState('');
    const [userPFP, setUserPFP] = useState(null);
    const [userEmail, setUserEmail] = useState('');
    const [isLogoutPopup, setLogoutPopup] = useState(false);
    const [isIgnoredPopup, setIsIgnoredPopup] = useState(false);
    const logoutPopupRef = useRef(null);
    const ignoredPopupRef = useRef(null);
    const ignoredButtonRef = useRef(null);
    const profileButtonRef = useRef(null);

    const [isQuizStarted, setIsQuizStarted] = useState(false);
    const [isQuizScorePage, setIsQuizScorePage] = useState(false);
    const [quizResults, setQuizResults] = useState(null);

    const userProfile = location.state?.userProfile;

    useEffect(() => {
        getUserName();
        getUserEmail();
        getUserPFP();
    }, []);

    async function getUserName() {
        try {
            const attributes = await fetchUserAttributes();
            setUserName(attributes.name || attributes.email);
        } catch (error) {
            console.error('Error fetching user attributes:', error);
        }
    }

    async function getUserEmail() {
        try {
            const attributes = await fetchUserAttributes();
            setUserEmail(attributes.email || attributes.name);
        } catch (error) {
            console.error('Error fetching user Email:', error);
        }
    }

    async function getUserPFP() {
        try {
            const attributes = await fetchUserAttributes();
            setUserPFP(attributes.picture || "/crammipink.png");
        } catch (error) {
            console.error('Error:', error);
        }
    }

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

    useEffect(() => {
        function handleClick(event) {
            if (logoutPopupRef.current && 
                !logoutPopupRef.current.contains(event.target) &&
                profileButtonRef.current &&
                !profileButtonRef.current.contains(event.target)) {
                setLogoutPopup(false);
            }
        }
        if (isLogoutPopup) {
            addEventListener("mousedown", handleClick);
        }
        return () => {
            removeEventListener("mousedown", handleClick);
        };
    }, [isLogoutPopup]);

    useEffect(() => {
        function escapeHandler(event) {
            if (event.key === "Escape") {
                setLogoutPopup(false);
                setIsIgnoredPopup(false);
            }
        }
        if (isLogoutPopup || isIgnoredPopup) {
            addEventListener("keydown", escapeHandler);
        }
        return () => {
            removeEventListener("keydown", escapeHandler);
        };
    }, [isLogoutPopup, isIgnoredPopup]);

    useEffect(() => {
        function handleClick(event) {
            if (ignoredPopupRef.current && 
                !ignoredPopupRef.current.contains(event.target) &&
                ignoredButtonRef.current &&
                !ignoredButtonRef.current.contains(event.target)) {
                setIsIgnoredPopup(false);
            }
        }
        if (isIgnoredPopup) {
            addEventListener("mousedown", handleClick);
        }
        return () => {
            removeEventListener("mousedown", handleClick);
        };
    }, [isIgnoredPopup]);

    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (titleInputRef.current && !titleInputRef.current.contains(event.target)) {
                handleTitleSubmit();
            }
        };

        if (isEditingTitle) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditingTitle, editingName, batchName, batchID]);

    useEffect(() => {
        const fetchJSON = async () => {
            try {
                setIsLoading(true);
                const session = await fetchAuthSession();
                const token = session.tokens?.idToken?.toString();
                
                const response = await fetch(
                    `https://9e89rfm90l.execute-api.us-west-2.amazonaws.com/getJSON`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            batchID: batchID,
                            type: 'Quizzes'
                        })
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                const items = data.items || data;
                const ignoredRequests = data.ignored_requests || '';
                
                setBatchJSON(items);
                
                if (location.state?.batchName) {
                    setBatchName(location.state.batchName);
                }
                
                if (ignoredRequests) {
                    setIsIgnoredRequest(ignoredRequests);
                }
                
                setIsLoading(false);
            } catch (err) {
                console.error('Error fetching quiz data:', err);
                setError(err.message);
                setIsLoading(false);
            }
        };

        if (batchID) {
            fetchJSON();
        }
    }, [batchID]);

    const handleTitleClick = () => {
        setIsEditingTitle(true);
        setEditingName(batchName);
    };

    const handleTitleSubmit = async () => {
        if (!editingName.trim()) {
            setIsEditingTitle(false);
            return;
        }

        if (editingName === batchName) {
            setIsEditingTitle(false);
            setEditingName('');
            return;
        }

        const oldName = batchName;
        
        setBatchName(editingName);
        setIsEditingTitle(false);
        setEditingName('');

        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();
            
            const response = await fetch('https://9e89rfm90l.execute-api.us-west-2.amazonaws.com/rename', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    batch_ID: batchID,
                    new_name: editingName
                })
            });
            
            if (!response.ok) {
                setBatchName(oldName);
            }
        } catch (err) {
            console.error('Error renaming batch:', err);
            setBatchName(oldName);
        }
    };

    const handleTitleCancel = () => {
        setIsEditingTitle(false);
        setEditingName('');
    };

    const handleTitleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleTitleSubmit();
        } else if (e.key === 'Escape') {
            handleTitleCancel();
        }
    };

    const handleStartQuiz = () => {
        setIsQuizStarted(true);
        setIsQuizScorePage(false);
        setQuizResults(null);
    };

    const handleQuizComplete = (results) => {
        setQuizResults(results);
        setIsQuizStarted(false);
        setIsQuizScorePage(true);
    };

    const handleReturnToStart = () => {
        setIsQuizScorePage(false);
        setIsQuizStarted(false);
        setQuizResults(null);
    };

    if (isLoading) {
        return (<LoadingAnimation/>);
        
    }

    if (error) {
        return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
    }

    if (!batchJSON) {
        return <div style={{ padding: '20px' }}>No quiz data found</div>;
    }

    return (
        <>  
        <div className='quizDashboardHeader'>
                <div className="quizMobileHamburger">
                <ViewHamburger 
                    userName={userName}
                    userEmail={userEmail}
                    userPFP={userPFP}
                    handleSignOut={handleSignOut}
                    onNavigateDashboard={() => navigate('/Dashboard')}
                    onUpgradePlan={() => {navigate('/Upgrade', { state: { userProfile: userProfile } })}}
                    onSupport={() => {/* Add support logic */}}
                    showIgnoredButton={!!isIgnoredRequest}
                    isIgnoredRequest={isIgnoredRequest}
                />
                </div>
                <img className='dashboardLogoMobile'src='/crammiLogo.png'/>
    
            </div>
            <div className='collapsedSidebar'>
                <div className='collapsedSidebarButtons'>
                    <button 
                        className='homeButton'
                        title="Dashboard"
                        onClick={() => navigate('/Dashboard')}
                    >
                        <img 
                            className='homeButtonIcon' 
                            src='/homeIcon.png' 
                            alt='home icon'
                        />
                    </button>
                    
                    <button 
                        className='collapsedSideButton'
                        title="Upgrade Plan"
                        style={{display: userProfile.accountTier==='pro'? 'none' : 'flex'}}
                        onClick={()=>navigate('/Upgrade', { state: { userProfile: userProfile } })}
                    >
                        <img 
                            className='collapsedSidebarIcon' 
                            src='/starIcon.png' 
                            alt='upgrade icon'
                        />
                    </button>
                    
                    {isIgnoredRequest && (
                        <button 
                            ref={ignoredButtonRef}
                            className='collapsedSideButton'
                            title="Ignored Special Instructions"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsIgnoredPopup(!isIgnoredPopup);
                            }}
                        >
                            <img 
                                className='collapsedSidebarIcon' 
                                src='/ignoredIcon.png' 
                                alt='warning icon'
                            />
                        </button>
                    )}
                </div>

                <div className='collapsedLogOutSection'>
                    <div className={isLogoutPopup ? 'activeCollapsedPFPWrapper' : 'collapsedPFPWrapper'}>
                        <button 
                            ref={profileButtonRef}
                            className='collapsedPFPButton' 
                            onClick={(e) => {
                                e.stopPropagation();
                                setLogoutPopup(!isLogoutPopup);
                            }}
                            title='Account'
                        >
                            <img 
                                className='collapsedUserPFP' 
                                src={userPFP} 
                                alt='profile'
                                onError={(e) => {
                                    e.target.src = "/crammipink.png";
                                }}
                            />
                        </button>
                    </div>
                </div>

                {isLogoutPopup && (
                    <div className="collapsedLogoutPopupContainer">
                        <div className="logoutPopup" ref={logoutPopupRef}>
                            <div className='viewLogoutPopupPFP'>
                                <div className='PFPWrapper'>
                                    <button className='PFPButtonPopup'>
                                        <img 
                                            className='userPFPPopup' 
                                            src={userPFP} 
                                            alt='profile'
                                            onError={(e) => {
                                                e.target.src = "/crammipink.png";
                                            }}
                                        />
                                        <div>
                                            <span className='userNameText'>{userName}</span>
                                            <p className='accountEmailDisplayPopup'>{userEmail}</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        
                            <div className='logoutPopupContent'>
                                <div className='popupUpgradePlan'>
                                    <button className='bottomDashboardSideButtons'style={{display: userProfile.accountTier==='pro'? 'none' : 'flex'}} onClick={()=>navigate('/Upgrade', { state: { userProfile: userProfile } })}
                                    >
                                        <img className='sidebarIcon' src='/starIcon.png' alt='upgrade'/>
                                        <span>Upgrade Plan</span>
                                    </button>
                                </div>
                                <button className='bottomDashboardSideButtons'>
                                    <img className='sidebarIcon' src='/supportIcon.png' alt='support'/>
                                    <span>Support</span>
                                </button>
                                <button className='bottomDashboardSideButtons' onClick={handleSignOut}>
                                    <img className='sidebarIcon' src='/signOutIcon.png' alt='logout'/>
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isIgnoredPopup && (
                    <div className="ignoredPopupContainer">
                        <div className="ignoredPopup" ref={ignoredPopupRef}>
                            <h3 style={{ marginBottom: '10px', fontSize: '16px', fontWeight: '600', color: '#333' }}>Ignored Special Instructions</h3>
                            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5', margin: 0 }}>
                                {isIgnoredRequest}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {!isQuizStarted && !isQuizScorePage ? (
                <div className="quizViewContainer">
                    <div className="quizViewContent">
                        <h1 className="quizViewTitle" onClick={handleTitleClick} style={{ cursor: 'pointer' }}>
                            {isEditingTitle ? (
                                <input
                                    ref={titleInputRef}
                                    type="text"
                                    className="quizViewTitleInput"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onKeyDown={handleTitleKeyDown}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                batchName
                            )}
                        </h1>
                        {batchJSON && (
                            <p className="quizViewQuestionCount">
                                {batchJSON.length} {batchJSON.length === 1 ? 'question' : 'questions'}
                            </p>
                        )}
                        
                        <button className="quizViewStartButton" onClick={handleStartQuiz}>
                            Start Quiz
                        </button>
                    </div>
                </div>
            ) : isQuizStarted && !isQuizScorePage ? (
                <QuizInterface 
                    quizData={batchJSON}
                    onQuizComplete={handleQuizComplete}
                />
            ) : (
                <QuizScorePage 
                    results={quizResults}
                    onReturnToStart={handleReturnToStart}
                    batchName={batchName}
                />
            )}
        </>
    );
}