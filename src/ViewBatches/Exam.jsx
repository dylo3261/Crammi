import React, { useState, useEffect, useRef } from "react";
import { fetchAuthSession, fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import "./Exam.css";

// LaTeX Rendering Component
function LatexText({ text }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || !text) return;

        // Load KaTeX if not already loaded
        if (!window.katex) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
            script.onload = () => renderLatex();
            document.head.appendChild(script);
        } else {
            renderLatex();
        }

        function renderLatex() {
            if (!window.katex || !containerRef.current) return;

            const container = containerRef.current;
            
            // Clear container
            container.innerHTML = '';
            
            let textContent = text;
            
            // Auto-wrap LaTeX commands that aren't already in $ delimiters
            // Check if text contains LaTeX commands but no $ delimiters
            if (!textContent.includes('$') && (textContent.includes('\\text') || textContent.includes('\\,'))) {
                textContent = '$' + textContent + '$';
            }
            
            // If still no $ delimiters, just render as plain text
            if (!textContent.includes('$')) {
                container.textContent = textContent;
                return;
            }
            
            // Parse the text manually
            let currentPos = 0;
            
            while (currentPos < textContent.length) {
                const dollarPos = textContent.indexOf('$', currentPos);
                
                if (dollarPos === -1) {
                    // No more math, add remaining text
                    const textNode = document.createTextNode(textContent.substring(currentPos));
                    container.appendChild(textNode);
                    break;
                }
                
                // Add text before the $
                if (dollarPos > currentPos) {
                    const textNode = document.createTextNode(textContent.substring(currentPos, dollarPos));
                    container.appendChild(textNode);
                }
                
                // Find the closing $
                const closingDollarPos = textContent.indexOf('$', dollarPos + 1);
                
                if (closingDollarPos === -1) {
                    // No closing $, just add the rest as text
                    const textNode = document.createTextNode(textContent.substring(dollarPos));
                    container.appendChild(textNode);
                    break;
                }
                
                // Extract the LaTeX content
                const latexContent = textContent.substring(dollarPos + 1, closingDollarPos);
                
                // Create a span and render the LaTeX
                const span = document.createElement('span');
                try {
                    window.katex.render(latexContent, span, {
                        displayMode: false,
                        throwOnError: false
                    });
                    container.appendChild(span);
                } catch (e) {
                    console.error('LaTeX render error:', e);
                    console.error('Failed content:', latexContent);
                    // Fall back to showing the original text
                    const textNode = document.createTextNode('$' + latexContent + '$');
                    container.appendChild(textNode);
                }
                
                currentPos = closingDollarPos + 1;
            }
        }
    }, [text]);

    return <span ref={containerRef}></span>;
}

function ExamInterface({ examData, timeLimit, onExamEnd }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60);
    const [isPaused, setIsPaused] = useState(false);
    const [shuffledAnswers, setShuffledAnswers] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        setSelectedAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: answer
        }));
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
                <div className="examSidebarHeader">
                </div>

                <div className="examFilterSection">
                    <select
                        className="examFilterSelect"
                        value="all"
                        onChange={() => {}}
                    >
                        <option value="all">All questions</option>
                    </select>
                </div>

                <div className="examQuestionsList">
                    {examData.map((q, index) => {
                        const status = getQuestionStatus(index);
                        const isAnswered = selectedAnswers[index] !== undefined;
                        
                        return (
                            <div
                                key={index}
                                onClick={() => handleQuestionNavigation(index)}
                                className={`examQuestionItem ${status}`}
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
                        );
                    })}
                </div>
            </div>

            <div className="examMainContent">
                <div className="examTopBar">
                    <div className="examQuestionCounter">
                        {currentQuestionIndex + 1}/{examData.length}
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

    const handleStartExam = () => {
        setIsExamStarted(true);
    };

    const handleExamEnd = (answers) => {
        console.log('Exam finished with answers:', answers);
        setIsExamStarted(false);
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
            {!isExamStarted ? (
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
                                    alt='quiz icon'
                                />
                            </button>
                            
                            <button 
                                className='collapsedSideButton'
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
                                        src='https://uxwing.com/wp-content/themes/uxwing/download/signs-and-symbols/exclamation-icon.png' 
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
                                                    alt='profile picture'
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
                                                <img className='sidebarIcon' src='/starIcon.png' alt='Support icon'/>
                                                <span>Upgrade Plan</span>
                                            </button>
                                        </div>
                                        <button className='bottomDashboardSideButtons'>
                                            <img className='sidebarIcon' src='https://uxwing.com/wp-content/themes/uxwing/download/computers-mobile-hardware/headphone-headset-icon.png' alt='Support icon'/>
                                            <span>Support</span>
                                        </button>
                                        <button className='bottomDashboardSideButtons' onClick={handleSignOut}>
                                            <img className='sidebarIcon' src='https://uxwing.com/wp-content/themes/uxwing/download/web-app-development/log-in-icon.png' alt='Logout icon'/>
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
                    </div>
                </>
            ) : (
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
                                    alt='quiz icon'
                                />
                            </button>
                            
                            <button 
                                className='collapsedSideButton'
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
                                        src='https://uxwing.com/wp-content/themes/uxwing/download/signs-and-symbols/exclamation-icon.png' 
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
                                                    alt='profile picture'
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
                                                <img className='sidebarIcon' src='/starIcon.png' alt='Support icon'/>
                                                <span>Upgrade Plan</span>
                                            </button>
                                        </div>
                                        <button className='bottomDashboardSideButtons'>
                                            <img className='sidebarIcon' src='https://uxwing.com/wp-content/themes/uxwing/download/computers-mobile-hardware/headphone-headset-icon.png' alt='Support icon'/>
                                            <span>Support</span>
                                        </button>
                                        <button className='bottomDashboardSideButtons' onClick={handleSignOut}>
                                            <img className='sidebarIcon' src='https://uxwing.com/wp-content/themes/uxwing/download/web-app-development/log-in-icon.png' alt='Logout icon'/>
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
                    />
                </>
            )}
        </>
    );
}