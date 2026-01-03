import React, { useState, useEffect, useRef } from "react";
import { fetchAuthSession, fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import "./Quiz.css";

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
    const [checkedQuestions, setCheckedQuestions] = useState({});
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
        if (!checkedQuestions[questionIndex]) {
            setSelectedAnswers(prev => ({
                ...prev,
                [questionIndex]: answer
            }));
        }
    };

    const handleCheckAnswer = (questionIndex) => {
        const selectedAnswer = selectedAnswers[questionIndex];
        if (selectedAnswer) {
            setCheckedQuestions(prev => ({
                ...prev,
                [questionIndex]: true
            }));
        }
    };

    const getAnswerClassName = (questionIndex, answer) => {
        let className = 'quizAnswerOption';
        const selectedAnswer = selectedAnswers[questionIndex];
        const hasChecked = checkedQuestions[questionIndex];
        
        if (selectedAnswer === answer) {
            className += ' selected';
        }
        
        if (hasChecked) {
            if (answer.isCorrect) {
                className += ' correct';
            } else if (selectedAnswer === answer && !answer.isCorrect) {
                className += ' incorrect';
            }
        }
        
        return className;
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
                        const hasChecked = checkedQuestions[questionIndex];

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
                                        const showExplanation = hasChecked && (
                                            answer.isCorrect || 
                                            (selectedAnswer === answer && !answer.isCorrect)
                                        );
                                        
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
                                                    {hasChecked && answer.isCorrect && (
                                                        <span className="quizCorrectBadge">✓ Correct</span>
                                                    )}
                                                    {hasChecked && selectedAnswer === answer && !answer.isCorrect && (
                                                        <span className="quizIncorrectBadge">✗ Try again</span>
                                                    )}
                                                </div>
                                                {showExplanation && (
                                                    <div className="quizExplanation">
                                                        <div className="quizExplanationIcon">💡</div>
                                                        <div className="quizExplanationText">
                                                            <LatexText text={answer.explanation} />
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
                                        disabled={!selectedAnswer || hasChecked}
                                        className="quizCheckAnswerButton"
                                    >
                                        {hasChecked ? 'Checked ✓' : 'Check answer'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="quizFinishContainer">
                    <button
                        onClick={onQuizComplete}
                        className="quizFinishButton"
                    >
                        Finish Quiz
                    </button>
                </div>
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
            setUserPFP(attributes.picture || "https://askthescientists.com/wp-content/uploads/2021/04/AdobeStock_240042551-scaled.jpeg");
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
    };

    const handleQuizComplete = (results) => {
        console.log('Quiz completed with results:', results);
        setIsQuizStarted(false);
    };

    if (isLoading) {
        return <div style={{ padding: '20px' }}>Loading quiz...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
    }

    if (!batchJSON) {
        return <div style={{ padding: '20px' }}>No quiz data found</div>;
    }

    return (
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
                            src='https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2012/png/iconmonstr-home-3.png&r=0&g=0&b=0' 
                            alt='home icon'
                        />
                    </button>
                    
                    <button 
                        className='collapsedSideButton'
                        title="Upgrade Plan"
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
                                src='https://uxwing.com/wp-content/themes/uxwing/download/signs-and-symbols/exclamation-icon.png' 
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
                                    e.target.src = "https://askthescientists.com/wp-content/uploads/2021/04/AdobeStock_240042551-scaled.jpeg";
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
                                    <button className='PFPButtonPopup'>
                                        <img 
                                            className='userPFPPopup' 
                                            src={userPFP} 
                                            alt='profile'
                                            onError={(e) => {
                                                e.target.src = "https://askthescientists.com/wp-content/uploads/2021/04/AdobeStock_240042551-scaled.jpeg";
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
                                    <button className='bottomDashboardSideButtons'>
                                        <img className='sidebarIcon' src='/starIcon.png' alt='upgrade'/>
                                        <span>Upgrade Plan</span>
                                    </button>
                                </div>
                                <button className='bottomDashboardSideButtons'>
                                    <img className='sidebarIcon' src='https://uxwing.com/wp-content/themes/uxwing/download/computers-mobile-hardware/headphone-headset-icon.png' alt='support'/>
                                    <span>Support</span>
                                </button>
                                <button className='bottomDashboardSideButtons' onClick={handleSignOut}>
                                    <img className='sidebarIcon' src='https://uxwing.com/wp-content/themes/uxwing/download/web-app-development/log-in-icon.png' alt='logout'/>
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

            {!isQuizStarted ? (
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
            ) : (
                <QuizInterface 
                    quizData={batchJSON}
                    onQuizComplete={handleQuizComplete}
                />
            )}
        </>
    );
}