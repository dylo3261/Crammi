import React, { useState, useEffect, useRef,useMemo } from "react";
import { fetchAuthSession, fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import "./Exam.css";
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
        
        // Auto-wrap LaTeX commands that aren't already in $ delimiters
        if (!textContent.includes('$') && (textContent.includes('\\text') || textContent.includes('\\,'))) {
            textContent = '$' + textContent + '$';
        }
        
        // If no $ delimiters, just render as plain text
        if (!textContent.includes('$')) {
            container.textContent = textContent;
            return;
        }
        
        // Parse and render LaTeX
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

function ExamInterface({ examData, timeLimit, onExamEnd,userName,userEmail,userPFP,handleSignOut,onNavigateDashboard,onUpgradePlan,onSupport, showIgnoredButton,isIgnoredRequest}) {    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60);
    const [isPaused, setIsPaused] = useState(false);
    const [shuffledAnswers, setShuffledAnswers] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
    const [filterMode, setFilterMode] = useState('all');

    // Shuffle answers once for each question on mount
    useEffect(() => {
        const shuffled = {};
        examData.forEach((question, index) => {
            shuffled[index] = [question.correct_answer, ...question.wrong_answers]
                .sort(() => Math.random() - 0.5);
        });
        setShuffledAnswers(shuffled);
    }, [examData]);

    useEffect(() => {
        if (isPaused || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPaused, timeRemaining]);

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const currentQuestion = examData[currentQuestionIndex];
    const allAnswers = shuffledAnswers[currentQuestionIndex] || [];

    const handleAnswerSelect = (answer) => {
        setSelectedAnswers(prev => {
            // If clicking the same answer, deselect it
            if (prev[currentQuestionIndex] === answer) {
                const newAnswers = { ...prev };
                delete newAnswers[currentQuestionIndex];
                return newAnswers;
            }
            // Otherwise, select the new answer
            return {
                ...prev,
                [currentQuestionIndex]: answer
            };
        });
    };

    const toggleFlag = (index) => {
        setFlaggedQuestions(prev => {
            const newFlags = new Set(prev);
            if (newFlags.has(index)) {
                newFlags.delete(index);
            } else {
                newFlags.add(index);
            }
            return newFlags;
        });
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < examData.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            if (onExamEnd) {
                onExamEnd(selectedAnswers);
            }
        }
    };

    const handleQuestionNavigation = (index) => {
        setCurrentQuestionIndex(index);
        setIsSidebarOpen(false);
    };

    const getQuestionStatus = (index) => {
        if (index === currentQuestionIndex) return 'current';
        if (selectedAnswers[index] !== undefined) return 'answered';
        return 'unanswered';
    };

    // Strip LaTeX for preview (just show plain text)
    const stripLatex = (text) => {
        return text.replace(/\$\$?([^\$]+?)\$\$?/g, '$1').substring(0, 100);
    };

    return (
        <div className="examInterfaceContainer">
            <div className={`examSidebar ${isSidebarOpen ? 'open' : ''}`}>
                
                <div className="examFilterSection">
                    <select
                        className="examFilterSelect"
                        value={filterMode}
                        onChange={(e) => setFilterMode(e.target.value)}
                    >
                        <option value="all">All questions</option>
                        <option value="flagged">Flagged</option>
                        <option value="answered">Answered</option>
                        <option value="unanswered">Unanswered</option>
                    </select>
                </div>

                <div className="examQuestionsList">
                    {examData.map((q, index) => {
                        const status = getQuestionStatus(index);
                        const isAnswered = selectedAnswers[index] !== undefined;
                        const isFlagged = flaggedQuestions.has(index);
                        
                        // Apply filter
                        if (filterMode === 'flagged' && !isFlagged) return null;
                        if (filterMode === 'answered' && !isAnswered) return null;
                        if (filterMode === 'unanswered' && isAnswered) return null;
                        
                        return (
                            <div
                                key={index}
                                className={`examQuestionItem ${status}`}
                            >
                                <div 
                                    onClick={() => handleQuestionNavigation(index)}
                                    style={{ display: 'flex', alignItems: 'flex-start', flex: 1, cursor: 'pointer' }}
                                >
                                    <div className={`examQuestionCheckbox ${isAnswered ? 'answered' : ''}`}>
                                        {isAnswered && (
                                            <div className="examQuestionCheckboxInner" />
                                        )}
                                    </div>
                                    <div className="examQuestionContent">
                                        <div className="examQuestionTitle">
                                            Question {index + 1}
                                        </div>
                                        <div className="examQuestionPreview">
                                            {stripLatex(q.question)}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFlag(index);
                                    }}
                                    className={`examQuestionFlag ${isFlagged ? 'flagged' : ''}`}
                                    title={isFlagged ? "Remove flag" : "Flag question"}
                                >
                                    <img className='examBookmarkIcon'src={isFlagged? '/bookmarkIconOne.png':'/bookmarkIconTwo.png'}/>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="examMainContent">
                <div className="examTopBar">
                    <div className="examTopBarLeft">
                        <div className="examMobileHamburgerInline">
                            <ViewHamburger 
                                userName={userName}
                                userEmail={userEmail}
                                userPFP={userPFP}
                                handleSignOut={handleSignOut}
                                onNavigateDashboard={onNavigateDashboard}
                                onUpgradePlan={onUpgradePlan}
                                onSupport={onSupport}
                                showIgnoredButton={showIgnoredButton}
                                isIgnoredRequest={isIgnoredRequest}
                            />
                        </div>
                    <div className="examQuestionCounter">
                        {currentQuestionIndex + 1}/{examData.length}
                    </div>
                    </div>
                    <div className="examTopBarControls">
                        <div className="examTimerDisplay">
                            <span className="examTimerIcon">⏱️</span>
                            <span className={`examTimerText ${timeRemaining < 300 ? 'warning' : ''}`}>
                                {formatTime(timeRemaining)}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className="examPauseButton"
                        >
                            {isPaused ? '▶' : '⏸'}
                        </button>
                        <button
                            onClick={() => onExamEnd(selectedAnswers)}
                            className="examFinishButton"
                        >
                            Finish test
                        </button>
                    </div>
                </div>

                <div className="examProgressBar">
                    
                    <div 
                        className="examProgressBarFill"
                        style={{width: `${((currentQuestionIndex + 1) / examData.length) * 100}%`}}
                    />
                </div>

                <div className="examQuestionSection">
                    <div className="examQuestionContainer">
                        <div className="examQuestionLabel">
                            <span className="examQuestionIcon">📄</span>
                            <span>Question {currentQuestionIndex + 1}:</span>
                        </div>

                        <h2 className="examQuestionText">
                        
                            <LatexText text={currentQuestion.question} />
                        </h2>

                        <div className="examAnswersList">
                            {allAnswers.map((answer, index) => {
                                const isSelected = selectedAnswers[currentQuestionIndex] === answer;
                                
                                return (
                                    <div
                                        key={index}
                                        onClick={() => handleAnswerSelect(answer)}
                                        className={`examAnswerOption ${isSelected ? 'selected' : ''}`}
                                    >
                                        <div className="examAnswerRadio">
                                            {isSelected && (
                                                <div className="examAnswerRadioInner" />
                                            )}
                                        </div>
                                        <span className="examAnswerText">
                                            <LatexText text={answer} />
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="examBottomNav">
                    <button
                        onClick={handleNextQuestion}
                        className="examNextButton"
                    >
                        Next question
                        <span className="examNextButtonArrow">→</span>
                    </button>
                </div>
            </div>

            <button 
                className="examMobileToggle"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                <span>📋</span>
                <span>Questions ({Object.keys(selectedAnswers).length}/{examData.length})</span>
            </button>
        </div>
    );
}



function ExamScorePage({ examResults, examData, setIsScorePage, timeLimit }) {
  const stats = useMemo(() => {
    const totalQuestions = examData.length;
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;

    examData.forEach((question, index) => {
      const userAnswer = examResults[index.toString()];
      
      if (userAnswer === undefined) {
        skipped++;
      } else if (userAnswer === question.correct_answer) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const scorePercentage = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

    return { totalQuestions, correct, incorrect, skipped, scorePercentage };
  }, [examResults, examData]);

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
    <div className="exam-score-page">
      <div className="score-container">
        {/* Header */}
        <div className="exam-score-header">
          <div className="header-content">
            <div className={`award-icon ${getScoreClass(stats.scorePercentage)}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="7"/>
                <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/>
              </svg>
            </div>
            <h1 className="examScorePageTitle">Exam Results</h1>
            <p className="examSubtitle">{getScoreMessage(stats.scorePercentage)}</p>
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
            <div className="stat-card stat-total">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="20" x2="12" y2="10"/>
                  <line x1="18" y1="20" x2="18" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="16"/>
                </svg>
              </div>
              <div className="stat-value">{stats.totalQuestions}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="stat-card stat-correct">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div className="stat-value">{stats.correct}</div>
              <div className="stat-label">Correct</div>
            </div>
            <div className="stat-card stat-incorrect">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div className="stat-value">{stats.incorrect}</div>
              <div className="stat-label">Incorrect</div>
            </div>
            <div className="stat-card stat-skipped">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <div className="stat-value">{stats.skipped}</div>
              <div className="stat-label">Skipped</div>
            </div>
          </div>

          {/* Time Limit Info */}
          <div className="time-limit">
            <div className="time-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <span>Time Limit: {timeLimit} minutes</span>
          </div>

          {/* Action Button */}
          <button
            onClick={() => setIsScorePage(false)}
            className="return-button"
          >
            Finish
          </button>
        </div>

        {/* Detailed Results */}
        <div className="question-review">
          <h2 className="review-title">Question Review</h2>
          <div className="questions-list">
            {examData.map((question, index) => {
              const userAnswer = examResults[index.toString()];
              const isCorrect = userAnswer === question.correct_answer;
              const isSkipped = userAnswer === undefined;

              return (
                <div
                  key={index}
                  className={`question-item ${
                    isSkipped
                      ? 'question-skipped'
                      : isCorrect
                      ? 'question-correct'
                      : 'question-incorrect'
                  }`}
                >
                  <div className="question-content">
                    <div className="question-icon">
                      {isSkipped ? (
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
                        Question {index + 1}
                      </div>
                                              <div className="question-text">
                          <LatexText text={question.question} />
                        </div>
                      
                      {isSkipped ? (
                        <div className="answer-skipped">Not answered</div>
                      ) : (
                        <>
                          <div className="answer-row">
                            <span className="answer-label">Your answer: </span>
                            <span className={`answer-value ${isCorrect ? 'answer-correct' : 'answer-incorrect'}`}>
                              {<LatexText text={userAnswer}/>}
                            </span>
                          </div>
                          {!isCorrect && (
                            <div className="answer-row">
                              <span className="answer-label">Correct answer: </span>
                              <span className="answer-value answer-correct">
                                {<LatexText text={question.correct_answer}/>}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Exam() {
    const { batchID } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [batchJSON, setBatchJSON] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [batchName, setBatchName] = useState(location.state?.batchName || 'Unknown Batch');
    const [isIgnoredRequest, setIsIgnoredRequest] = useState('');
    const [timeLimit, setTimeLimit] = useState(60);
    const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);
    const [customTime, setCustomTime] = useState('60');
    const timeLimitRef = useRef(null);
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

    const [isExamStarted, setIsExamStarted] = useState(false);
    const [isScorePage, setIsScorePage] = useState(false);
    const [examResults, setExamResults] = useState(null);

    const userProfile = location.state?.userProfile;


    const handleStartExam = () => {
        setIsExamStarted(true);
    };

    const handleExamEnd = (answers) => {
        setExamResults(answers);
        // console.log('Exam finished with answers:', answers);
        setIsExamStarted(false);
        setIsScorePage(true);
    };

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
        function handleClick(event) {
            if (timeLimitRef.current && 
                !timeLimitRef.current.contains(event.target)) {
                setIsTimeMenuOpen(false);
            }
        }
        if (isTimeMenuOpen) {
            addEventListener("mousedown", handleClick);
        }
        return () => {
            removeEventListener("mousedown", handleClick);
        };
    }, [isTimeMenuOpen]);

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
                            type: 'Exams'
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
                console.error('Error fetching exam data:', err);
                setError(err.message);
                setIsLoading(false);
            }
        };

        if (batchID) {
            fetchJSON();
        }
    }, [batchID]);

    const formatTime = (minutes) => {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:00`;
        }
        return `${mins}:00`;
    };

    const handleTimePreset = (minutes) => {
        setTimeLimit(minutes);
        setCustomTime(minutes.toString());
        setIsTimeMenuOpen(false);
    };

    const handleCustomTimeSubmit = () => {
        const time = parseInt(customTime);
        if (!isNaN(time) && time > 0 && time <= 300) {
            setTimeLimit(time);
            setIsTimeMenuOpen(false);
        }
    };

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

    return (
        <>  
            
            {!isExamStarted && !isScorePage ?  (
                <>
                <div className='DashboardHeader'>
                      <div className="mobileHamburger">
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
                                    alt='quiz icon'
                                />
                            </button>
                            
                            <button 
                                className='collapsedSideButton'
                                title="Upgrade Plan"
                                onClick={()=>navigate('/Upgrade', { state: { userProfile: userProfile } })}
                                style={{display: userProfile.accountTier==='pro'? 'none' : 'flex'}}
                            >
                                <img 
                                    className='collapsedSidebarIcon' 
                                    src='/starIcon.png' 
                                    alt='flashcards icon'
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
                                        alt='ignored instructions icon'
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
                                        alt='profile picture'
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
                                            <button className='PFPButtonPopup' onClick={() => navigate('/Settings')}>
                                                <img 
                                                    className='userPFPPopup' 
                                                    src={userPFP} 
                                                    alt='profile picture'
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
                                            <button className='bottomDashboardSideButtons' style={{display: userProfile.accountTier==='pro'? 'none' : 'flex'}} onClick={()=>navigate('/Upgrade', { state: { userProfile: userProfile } })}>
                                                <img className='sidebarIcon' src='/starIcon.png' alt='Support icon'/>
                                                <span>Upgrade Plan</span>
                                            </button>
                                        </div>
                                        <button className='bottomDashboardSideButtons'>
                                            <img className='sidebarIcon' src='/supportIcon.png' alt='Support icon'/>
                                            <span>Support</span>
                                        </button>
                                        <button className='bottomDashboardSideButtons' onClick={handleSignOut}>
                                            <img className='sidebarIcon' src='/signOutIcon.png' alt='Logout icon'/>
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

                    <div className="examViewContainer">
                        {isLoading ? (
                                <LoadingAnimation />
                    ) : (
                        <div className="examViewContent">
                            <h1 className="examViewTitle" onClick={handleTitleClick} style={{ cursor: 'pointer' }}>
                                {isEditingTitle ? (
                                    <input
                                        ref={titleInputRef}
                                        type="text"
                                        className="examViewTitleInput"
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
                                <p className="examViewQuestionCount">
                                    {batchJSON.length} {batchJSON.length === 1 ? 'question' : 'questions'}
                                </p>
                            )}
                            
                            <div className="examViewTimeLimitSection">
                                <span>Time Limit:</span>
                                <div className="examViewTimeLimitWrapper" ref={timeLimitRef}>
                                    <button
                                        className="examViewTimeLimitButton"
                                        onClick={() => setIsTimeMenuOpen(!isTimeMenuOpen)}
                                    >
                                        {formatTime(timeLimit)}
                                    </button>
                                    
                                    {isTimeMenuOpen && (
                                        <div className="examViewTimeMenu">
                                            <div className="examViewTimeMenuList">
                                                {[15, 30, 45, 60, 90, 120].map(minutes => (
                                                    <button
                                                        key={minutes}
                                                        onClick={() => handleTimePreset(minutes)}
                                                        className={`examViewTimePreset ${timeLimit === minutes ? 'examViewTimePresetActive' : ''}`}
                                                    >
                                                        {formatTime(minutes)}
                                                    </button>
                                                ))}
                                                
                                                <div className="examViewCustomTimeSection">
                                                    <div className="examViewCustomTimeInput">
                                                        <input
                                                            type="number"
                                                            value={customTime}
                                                            onChange={(e) => setCustomTime(e.target.value)}
                                                            placeholder="Minutes"
                                                            min="1"
                                                            max="300"
                                                            className="examViewCustomTimeField"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleCustomTimeSubmit();
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            onClick={handleCustomTimeSubmit}
                                                            className="examViewCustomTimeSet"
                                                        >
                                                            Set
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <button className="examViewStartButton" onClick={handleStartExam}>
                                Start Exam
                            </button>
                        </div>
                    )}
                    </div>
                
                </>
            ) : isExamStarted? (
                <>
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
                                    alt='quiz icon'
                                />
                            </button>
                            
                            <button 
                                className='collapsedSideButton'
                                title="Upgrade Plan"
                                onClick={()=>navigate('/Upgrade', { state: { userProfile: userProfile } })}
                                style={{display: userProfile.accountTier==='pro'? 'none' : 'flex'}}
                            >
                                <img 
                                    className='collapsedSidebarIcon' 
                                    src='/starIcon.png' 
                                    alt='flashcards icon'
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
                                        alt='ignored instructions icon'
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
                                        alt='profile picture'
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
                                    <div className='logoutPopupPFP'>
                                        <div className='PFPWrapper'>
                                            <button className='PFPButtonPopup' onClick={() => navigate('/Settings')}>
                                                <img 
                                                    className='userPFPPopup' 
                                                    src={userPFP} 
                                                    alt='profile picture'
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
                                            <button className='bottomDashboardSideButtons'style={{display: userProfile.accountTier==='pro'? 'none' : 'flex'}} onClick={()=>navigate('/Upgrade', { state: { userProfile: userProfile } })}>
                                                <img className='sidebarIcon' src='/starIcon.png' alt='Support icon'/>
                                                <span>Upgrade Plan</span>
                                            </button>
                                        </div>
                                        <button className='bottomDashboardSideButtons'>
                                            <img className='sidebarIcon' src='/supportIcon.png' alt='Support icon'/>
                                            <span>Support</span>
                                        </button>
                                        <button className='bottomDashboardSideButtons' onClick={handleSignOut}>
                                            <img className='sidebarIcon' src='/signOutIcon.png' alt='Logout icon'/>
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

                    <ExamInterface 
                    examData={batchJSON}
                    timeLimit={timeLimit}
                    onExamEnd={handleExamEnd}
                    userName={userName}
                    userEmail={userEmail}
                    userPFP={userPFP}
                    handleSignOut={handleSignOut}
                    onNavigateDashboard={() => navigate('/Dashboard')}
                    onUpgradePlan={() => {/* Add upgrade logic */}}
                    onSupport={() => {/* Add support logic */}}
                    showIgnoredButton={!!isIgnoredRequest}
                    isIgnoredRequest={isIgnoredRequest}
                    />
                </>
            ): isScorePage? (
                <>
                
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
                                    alt='quiz icon'
                                />
                            </button>
                            
                            <button 
                                className='collapsedSideButton'
                                onClick={()=>navigate('/Upgrade', { state: { userProfile: userProfile } })}
                                title="Upgrade Plan"
                            >
                                <img 
                                    className='collapsedSidebarIcon' 
                                    src='/starIcon.png' 
                                    alt='flashcards icon'
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
                                        alt='ignored instructions icon'
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
                                        alt='profile picture'
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
                                    <div className='logoutPopupPFP'>
                                        <div className='PFPWrapper'>
                                            <button className='PFPButtonPopup'onClick={() => navigate('/Settings')}>
                                                <img 
                                                    className='userPFPPopup' 
                                                    src={userPFP} 
                                                    alt='profile picture'
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
                                            <button className='bottomDashboardSideButtons' onClick={()=>navigate('/Upgrade', { state: { userProfile: userProfile } })}>
                                                <img className='sidebarIcon' src='/starIcon.png' alt='Support icon'/>
                                                <span>Upgrade Plan</span>
                                            </button>
                                        </div>
                                        <button className='bottomDashboardSideButtons'>
                                            <img className='sidebarIcon' src='/supportIcon.png' alt='Support icon'/>
                                            <span>Support</span>
                                        </button>
                                        <button className='bottomDashboardSideButtons' onClick={handleSignOut}>
                                            <img className='sidebarIcon' src='/signOutIcon.png' alt='Logout icon'/>
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
                    <div className='DashboardHeader'>
                      <div className="mobileHamburger">
                        <ViewHamburger 
                            userName={userName}
                            userEmail={userEmail}
                            userPFP={userPFP}
                            handleSignOut={handleSignOut}
                            onNavigateDashboard={() => navigate('/Dashboard')}
                            onUpgradePlan={() => {/* Add upgrade logic */}}
                            onSupport={() => {/* Add support logic */}}
                            showIgnoredButton={!!isIgnoredRequest}
                            isIgnoredRequest={isIgnoredRequest}
                        />
                      </div>
                      <img className='dashboardLogoMobile'src='/crammiLogo.png'/>
            
                    </div>
                    <ExamScorePage 
                       examData={batchJSON}
                       examResults={examResults}
                       setIsScorePage={setIsScorePage}
                       batchName={batchName}
                       timeLimit={timeLimit}
                    />

                </>
            ):null}
        </>
    );
}