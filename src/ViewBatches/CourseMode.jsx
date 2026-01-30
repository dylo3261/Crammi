import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchAuthSession, fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { useParams,Link,useNavigate , useLocation} from 'react-router-dom';
import './CourseMode.css';
import LoadingAnimation from "../Dashboard/LoadingScreen";
import ViewHamburger from "./ViewHamburger";
import LimitReached from "../Dashboard/limitReached";

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

// Memoized LaTeX Rendering Component
const LatexText = React.memo(({ text }) => {
    const containerRef = useRef(null);
    const [isReady, setIsReady] = useState(katexLoaded);
    const lastTextRef = useRef(null);

    useEffect(() => {
        loadKaTeX().then(() => setIsReady(true));
    }, []);

    useEffect(() => {
        if (!containerRef.current || !text || !isReady || lastTextRef.current === text) {
            return;
        }

        lastTextRef.current = text;
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
});
export default function CourseMode() {
  const { batchID } = useParams();
  const [batchJSON, setBatchJSON] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [expandedDefinitions, setExpandedDefinitions] = useState({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileUnitsOpen, setIsMobileUnitsOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPFP, setUserPFP] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isLogoutPopup, setLogoutPopup] = useState(false);
  const [isQuizInputOpen, setIsQuizInputOpen] = useState(false);
  const [isFlashcardInputOpen, setIsFlashcardInputOpen] = useState(false);
  const [quizInput, setQuizInput] = useState('');
  const [flashcardInput, setFlashcardInput] = useState('');
  const [selectedQuizUnits, setSelectedQuizUnits] = useState([]);
  const [selectedFlashcardUnits, setSelectedFlashcardUnits] = useState([]);
  const logoutPopupRef = useRef(null);
  const [isQuizProcessing, setIsQuizProcessing] = useState(false);
  const [isFlashcardProcessing, setIsFlashcardProcessing] = useState(false);
  const [isFinalExamInputOpen, setIsFinalExamInputOpen] = useState(false);
const [finalExamInput, setFinalExamInput] = useState('');
  const pollIntervalRef = useRef(null);
const pollCountRef = useRef(0);
const MAX_POLLS = 18;
const [isLimitReached, setIsLimitReached] = useState(false);
const [limitReachedMessage, setLimitReachedMessage] = useState('');
const [newQuizBatchID, setNewQuizBatchID] = useState(null);
const [newFlashcardBatchID, setNewFlashcardBatchID] = useState(null);
const currentQuizIDRef = useRef(null);
const currentFlashcardIDRef = useRef(null);
const [selectedFinalExamUnits, setSelectedFinalExamUnits] = useState([]);
const [isQuizComplete, setIsQuizComplete] = useState(false);
const [isFlashcardComplete, setIsFlashcardComplete] = useState(false);
const [quizUnitMap, setQuizUnitMap] = useState({}); // { unitIndex: { batchID, isComplete, isProcessing } }
const [isMaxPolls, setIsMaxPolls]= useState(false);
  const [flashcardUnitMap, setFlashcardUnitMap] = useState({}); // { unitIndex: { batchID, isComplete, isProcessing } }
  const [isExamProcessing, setIsExamProcessing] = useState(false);
  const [isExamComplete, setIsExamComplete] = useState(false);
  const [newExamBatchID, setNewExamBatchID] = useState(null);
  const currentExamIDRef = useRef(null);
  const [examUnitMap, setExamUnitMap] = useState({}); // { 'final-exam': { batchID, isComplete, isProcessing } }
  const profileButtonRef = useRef(null);
  const mobileUnitsRef = useRef(null);
  const navigate=useNavigate();
  const location=useLocation();

  const userProfile = location.state?.userProfile || { accountTier: 'free' };

  const handleUpload = async (cramType, units, uploadInstructions) => {
    try {
        // Set processing state based on cram type
        if (cramType === 'Quizzes') {
            setIsQuizProcessing(true);
        } else if (cramType === 'Flashcards') {
            setIsFlashcardProcessing(true);
        } else if (cramType === 'Exams') {  
            setIsExamProcessing(true);
        }
        
        // Get fresh token
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        
        if (!token) {
            console.error('No authentication token available');
            return;
        }

        const existingPayload = {
            batch_ID: batchID,
            requestedCram: cramType,
            special_instructions: uploadInstructions,
            originalRequestedCram: 'courses',
            units: units
        };
        
        const response = await fetch('https://ul9ffsljla.execute-api.us-west-2.amazonaws.com/prod/existing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`  
            },
            body: JSON.stringify(existingPayload)
        });

        console.log(`[${cramType}] Upload response status:`, response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`[${cramType}] Upload failed:`, errorData);
            setIsLimitReached(true);
            setLimitReachedMessage(errorData.error);
            if (cramType === 'Quizzes') {
                setIsQuizProcessing(false);
            } else if (cramType === 'Flashcards') {
                setIsFlashcardProcessing(false);
            } else if (cramType === 'Exams') {  
                setIsExamProcessing(false);
            }
            return;
        }
        
        const responseData = await response.json();
        const newBatchID = responseData.newBatchID;
        
        console.log(`[${cramType}] Upload successful, new batchID:`, newBatchID);
        console.log(`[${cramType}] Response data:`, responseData);

        const unitNumbers = units.sort((a, b) => a - b); // Sort the unit numbers
        const batchName = unitNumbers.length === 1 
            ? `Unit ${unitNumbers[0]} - ${table_of_contents.course_title}`
            : `Units ${unitNumbers.join(', ')} - ${table_of_contents.course_title}`;
        
        // Store the new batch ID based on type WITH the unit it belongs to
        if (cramType === 'Quizzes') {
            setNewQuizBatchID(newBatchID);
            setQuizUnitMap(prev => ({
                ...prev,
                [selectedUnit]: { 
                    batchID: newBatchID, 
                    isComplete: false, 
                    isProcessing: true,
                    batchName: batchName,  // ← Store the batch name
                    units: unitNumbers     // ← Store which units
                }
            }));
            console.log('[Quiz] Set newQuizBatchID:', newBatchID);
        } else if (cramType === 'Flashcards') {
            setNewFlashcardBatchID(newBatchID);
            setFlashcardUnitMap(prev => ({
                ...prev,
                [selectedUnit]: { 
                    batchID: newBatchID, 
                    isComplete: false, 
                    isProcessing: true,
                    batchName: batchName,  
                    units: unitNumbers     
                }
            }));
        } else if (cramType === 'Exams') {  
            setNewExamBatchID(newBatchID);
            setExamUnitMap(prev => ({
                ...prev,
                'final-exam': { 
                    batchID: newBatchID, 
                    isComplete: false, 
                    isProcessing: true,
                    batchName: `Final Exam - ${table_of_contents.course_title}`,
                    units: unitNumbers
                }
            }));
            console.log('[Exam] Set newExamBatchID:', newBatchID);
        }
        
        // IMPORTANT: Dispatch event with the batchID so polling can use it immediately
        console.log(`[${cramType}] Dispatching batchUploaded event with batchID:`, newBatchID);
        window.dispatchEvent(new CustomEvent('batchUploaded', { 
            detail: { batchID: newBatchID, type: cramType } 
        }));

    } catch (error) {
        console.error(`[${cramType}] Upload error:`, error);
        if (cramType === 'Quizzes') {
            setIsQuizProcessing(false);
        } else if (cramType === 'Flashcards') {
            setIsFlashcardProcessing(false);
        } else if (cramType === 'Exams') {  
            setIsExamProcessing(false);
        }
    }
};
  
const checkBatchStatusWithID = useCallback(async (quizID, flashcardID, examID) => {
    console.log('=== Polling batch status ===');
    console.log('Poll count:', pollCountRef.current);
    console.log('Checking for IDs:', {
        quizID,
        flashcardID,
        examID
    });
    
    try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        
        const response = await fetch(
            'https://9e89rfm90l.execute-api.us-west-2.amazonaws.com/poll',
            {
                headers: { 
                    'Authorization': `Bearer ${token}` 
                }
            }
        );
        
        if (!response.ok) {
            console.error('Poll response not ok:', response.status);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const batches = data.batches || [];
        
        console.log('Received batches:', batches);
        console.log('Total batches:', batches.length);
        //check if our specific exam is complete
        if (examID) {
            const examBatch = batches.find(b => b.batchID === examID);
            console.log('[Exam] Looking for batchID:', examID);
            console.log('[Exam] Found batch:', examBatch);
            
            if (examBatch && examBatch.status === 'COMPLETE') {
                console.log('[Exam] ✓ Exam is COMPLETE!');
                setIsExamProcessing(false);
                setIsExamComplete(true);
                setNewExamBatchID(examID);
                
                // Update the map
                setExamUnitMap(prev => ({
                    ...prev,
                    'final-exam': { 
                        ...prev['final-exam'], 
                        isComplete: true, 
                        isProcessing: false 
                    }
                }));
                
                // Clear the ref so we stop checking this batch
                currentExamIDRef.current = null;
            } else if (examBatch) {
                console.log('[Exam] Status:', examBatch.status);
            } else {
                console.warn('[Exam] ⚠️ Batch not found in response');
            }
        }
        // Check if our specific quiz is complete
        if (quizID) {
            const quizBatch = batches.find(b => b.batchID === quizID);
            console.log('[Quiz] Looking for batchID:', quizID);
            console.log('[Quiz] Found batch:', quizBatch);
            
            if (quizBatch && quizBatch.status === 'COMPLETE') {
                console.log('[Quiz] ✓ Quiz is COMPLETE!');
                setIsQuizProcessing(false);
                setIsQuizComplete(true);
                setNewQuizBatchID(quizID);
                
                // Update the map
                setQuizUnitMap(prev => {
                    const newMap = { ...prev };
                    for (let unit in newMap) {
                        if (newMap[unit].batchID === quizID) {
                            newMap[unit] = { ...newMap[unit], isComplete: true, isProcessing: false };
                        }
                    }
                    return newMap;
                });
                
                // Clear the ref so we stop checking this batch
                currentQuizIDRef.current = null;
            } else if (quizBatch) {
                console.log('[Quiz] Status:', quizBatch.status);
            } else {
                console.warn('[Quiz] ⚠️ Batch not found in response');
            }
        }
        
        // Check if our specific flashcard is complete
        if (flashcardID) {
            const flashcardBatch = batches.find(b => b.batchID === flashcardID);
            console.log('[Flashcard] Looking for batchID:', flashcardID);
            console.log('[Flashcard] Found batch:', flashcardBatch);
            
            if (flashcardBatch && flashcardBatch.status === 'COMPLETE') {
                console.log('[Flashcard] ✓ Flashcard is COMPLETE!');
                setIsFlashcardProcessing(false);
                setIsFlashcardComplete(true);
                setNewFlashcardBatchID(flashcardID);
                
                // Update the map
                setFlashcardUnitMap(prev => {
                    const newMap = { ...prev };
                    for (let unit in newMap) {
                        if (newMap[unit].batchID === flashcardID) {
                            newMap[unit] = { ...newMap[unit], isComplete: true, isProcessing: false };
                        }
                    }
                    return newMap;
                });
                
                // Clear the ref so we stop checking this batch
                currentFlashcardIDRef.current = null;
            } else if (flashcardBatch) {
                console.log('[Flashcard] Status:', flashcardBatch.status);
            } else {
                console.warn('[Flashcard] ⚠️ Batch not found in response');
            }
        }
        
        // Check if quiz or flashcard is still processing (any pending)
        const hasProcessingQuiz = batches.some(b => 
            b.type === 'Quizzes' && b.status === 'PENDING'
        );
        const hasProcessingFlashcard = batches.some(b => 
            b.type === 'Flashcards' && b.status === 'PENDING'
        );
        
        console.log('Processing status:', {
            hasProcessingQuiz,
            hasProcessingFlashcard
        });
        
        // Stop polling only if both refs are null (both completed or neither started)
        if (!currentQuizIDRef.current && !currentFlashcardIDRef.current && !currentExamIDRef.current) {
            console.log('No more batches to check, stopping poll');
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
                pollCountRef.current = 0;
            }
        }
        
    } catch (err) {
        console.error('Error checking batch status:', err);
    }
    console.log('=== End poll ===\n');
}, []); 
  
useEffect(() => {
    const handleBatchUploaded = (event) => {
        console.log('🚀 batchUploaded event received', event.detail);
        
        const { batchID, type } = event.detail;
        
        // Store the batch ID in refs so it persists
        if (type === 'Quizzes') {
            currentQuizIDRef.current = batchID;
            console.log('[Quiz] Storing batchID for polling:', batchID);
        } else if (type === 'Flashcards') {
            currentFlashcardIDRef.current = batchID;
            console.log('[Flashcard] Storing batchID for polling:', batchID);
        } else if (type === 'Exams') {  
            currentExamIDRef.current = batchID;
            console.log('[Exam] Storing batchID for polling:', batchID);
        }
        
        // Only start a NEW interval if one isn't already running
        if (!pollIntervalRef.current) {
            setIsMaxPolls(false);
            console.log('Starting new polling interval');
            pollCountRef.current = 0;
            checkBatchStatusWithID(currentQuizIDRef.current, currentFlashcardIDRef.current, currentExamIDRef.current);
            
            pollIntervalRef.current = setInterval(() => {
                pollCountRef.current++;
                console.log(`\n🔄 Poll interval triggered (${pollCountRef.current}/${MAX_POLLS})`);
                
                if (pollCountRef.current >= MAX_POLLS) {
                    console.warn('⚠️ Max polls reached, stopping');
                    setIsMaxPolls(true);
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                    pollCountRef.current = 0;
                    setIsQuizProcessing(false);
                    setIsFlashcardProcessing(false);
                    setIsExamProcessing(false);
                    return;
                }
                
                checkBatchStatusWithID(currentQuizIDRef.current, currentFlashcardIDRef.current, currentExamIDRef.current); 
            }, 10000);
        } else {
            // Interval already running, just do an immediate check with the updated IDs
            console.log('Polling already active, checking with updated IDs');
            checkBatchStatusWithID(currentQuizIDRef.current, currentFlashcardIDRef.current, currentExamIDRef.current);
        }
    };

    window.addEventListener('batchUploaded', handleBatchUploaded);
    console.log('✓ batchUploaded event listener added');
    
    return () => {
        console.log('Cleaning up batchUploaded event listener');
        window.removeEventListener('batchUploaded', handleBatchUploaded);
        if (pollIntervalRef.current) {
            console.log('Clearing poll interval on cleanup');
            clearInterval(pollIntervalRef.current);
        }
    };
}, [checkBatchStatusWithID]);


    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);
    // Fetch user data once on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const attributes = await fetchUserAttributes();
        setUserName(attributes.name || attributes.email);
        setUserEmail(attributes.email || attributes.name);
        setUserPFP(attributes.picture || "/crammipink.png");
      } catch (error) {
        console.error('Error fetching user attributes:', error);
      }
    };
    fetchUserData();

  }, []);
  
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
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [isLogoutPopup]);

  const handleSignOut = useCallback(async () => {
    try {
      sessionStorage.removeItem('oauth_source');
      sessionStorage.removeItem('oauth_completed');
      await signOut({ global: true });
      setTimeout(() => navigate('/'), 0);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, [navigate]);

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
              type: 'courses'
            })
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const items = data.items || data;
        
        setBatchJSON(items);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    if (batchID) {
      fetchJSON();
    }
  }, [batchID]);

  const toggleDefinition = (unitIndex, defIndex) => {
    const key = `${unitIndex}-${defIndex}`;
    setExpandedDefinitions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleUnitSelect = (index) => {
    setSelectedUnit(index);
    setIsMobileUnitsOpen(false);
    // Reset input states when changing units
    setIsQuizInputOpen(false);
    setIsFlashcardInputOpen(false);
    setIsFinalExamInputOpen(false);  
    setQuizInput('');
    setFlashcardInput('');
    setFinalExamInput('')
    setSelectedQuizUnits([]);
    setSelectedFinalExamUnits([]);
    setSelectedFlashcardUnits([]);
  };

  const handleCloseMobileUnits = () => {
    const panel = mobileUnitsRef.current;
    
    if (panel) {
      panel.classList.add('closing');
      setTimeout(() => {
        setIsMobileUnitsOpen(false);
      }, 300);
    }
  };

  const toggleQuizInput = () => {
    setIsQuizInputOpen(!isQuizInputOpen);
    if (isFlashcardInputOpen) {
      setIsFlashcardInputOpen(false);
    }
  };
  const toggleFinalExamInput = () => {
    // If opening, pre-select all units
    if (!isFinalExamInputOpen) {
      const allUnitIndices = table_of_contents.units.map((_, idx) => idx);
      setSelectedFinalExamUnits(allUnitIndices);
    }
    
    setIsFinalExamInputOpen(!isFinalExamInputOpen);
    // Close other inputs if open
    if (isQuizInputOpen) {
      setIsQuizInputOpen(false);
    }
    if (isFlashcardInputOpen) {
      setIsFlashcardInputOpen(false);
    }
  };
  const toggleFlashcardInput = () => {
    setIsFlashcardInputOpen(!isFlashcardInputOpen);
    if (isQuizInputOpen) {
      setIsQuizInputOpen(false);
    }
  };

  const toggleQuizUnitSelection = (unitIndex) => {
    setSelectedQuizUnits(prev => 
      prev.includes(unitIndex) 
        ? prev.filter(idx => idx !== unitIndex)
        : [...prev, unitIndex]
    );
  };
  const toggleFinalExamUnitSelection = (unitIndex) => {
    setSelectedFinalExamUnits(prev => 
      prev.includes(unitIndex) 
        ? prev.filter(idx => idx !== unitIndex)
        : [...prev, unitIndex]
    );
  };
  const toggleFlashcardUnitSelection = (unitIndex) => {
    setSelectedFlashcardUnits(prev => 
      prev.includes(unitIndex) 
        ? prev.filter(idx => idx !== unitIndex)
        : [...prev, unitIndex]
    );
  };

  if (isLoading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return (
      <div className="course-mode-container">
        <div className="course-error-card">
          <div className="course-error-icon">⚠️</div>
          <h3>Error Loading Course</h3>
          <p>{error} - Try refreshing the page or contact support.</p>
        </div>
      </div>
    );
  }

  if (!batchJSON || !batchJSON.table_of_contents) {
    return (
      <div className="course-mode-container">
        <div className="course-empty-card">
          <div className="course-empty-icon">📚</div>
          <h3>No Course Data Found</h3>
          <p>Unable to load course information for this batch.</p>
        </div>
      </div>
    );
  }

  const { table_of_contents, unit_summaries } = batchJSON;

  return (
    <div className="course-mode-container">
        {isLimitReached && (
            <div className="isLimitReached">
                <LimitReached 
                    isLimitReached={isLimitReached}
                    setIsLimitReached={setIsLimitReached}
                    limitReachedMessage={limitReachedMessage}
                    userProfile={userProfile}
                />            
            </div>
        )}
          <div className='flashcardDashboardHeader'>
                    <div className="flashcardMobileHamburger">
                      <ViewHamburger 
                        userName={userName}
                        userEmail={userEmail}
                        userPFP={userPFP}
                        handleSignOut={handleSignOut}
                        onNavigateDashboard={() => navigate('/dashboard')}
                        onUpgradePlan={() => {navigate('/upgrade', { state: { userProfile: userProfile } })}}
                        onSupport={() => {navigate('/support')}}
                        showIgnoredButton={false}
                        isIgnoredRequest={false}
                      />
                    </div>
                    <img className='dashboardLogoMobile' src='/crammiLogo.png' alt="logo"/>
                  </div>
      {/* Collapsed Sidebar - Left Navigation */}
      <div className='collapsedSidebar'>
        <div className='collapsedSidebarButtons'>
          <button 
            className='homeButton'
            title="Dashboard"
            onClick={() => navigate('/dashboard')}
          >
            <img 
              className='homeButtonIcon' 
              src='/homeIcon.png' 
              alt='home icon'
            />
          </button>
          
          <Link 
            to="/upgrade"
            state={{ userProfile: userProfile }}
            className='collapsedSideButton'
            title="Upgrade Plan"
            style={{display: userProfile.accountTier==='pro'? 'none' : 'flex'}}
          >
            <img 
              className='collapsedSidebarIcon' 
              src='/starIcon.png' 
              alt='upgrade icon'
            />
          </Link>
          
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
                  <Link to="/settings" className='PFPButtonPopup'>
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
                  </Link>
                </div>
              </div>
          
              <div className='logoutPopupContent'>
                <div className='popupUpgradePlan'>
                  <Link 
                    to="/upgrade" 
                    state={{ userProfile: userProfile }}
                    className='bottomDashboardSideButtons' 
                    style={{display: userProfile.accountTier==='pro'? 'none' : 'flex'}}
                  >
                    <img className='sidebarIcon' src='/starIcon.png' alt='Upgrade icon'/>
                    <span>Upgrade Plan</span>
                  </Link>
                </div>
                <Link to="/support" className='bottomDashboardSideButtons'>
                  <img className='sidebarIcon' src='/supportIcon.png' alt='Support icon'/>
                  <span>Support</span>
                </Link>
                <button className='bottomDashboardSideButtons' onClick={handleSignOut}>
                  <img className='sidebarIcon' src='/signOutIcon.png' alt='Logout icon'/>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

       
      </div>

      {/* Mobile Units Floating Button */}
      <button 
        className="course-mobile-units-button"
        onClick={() => setIsMobileUnitsOpen(true)}
        aria-label="View units"
      >
        📋
      </button>

      {/* Mobile Units Overlay */}
      {isMobileUnitsOpen && (
        <div className="course-mobile-overlay" onClick={handleCloseMobileUnits}>
        <div 
            className="course-mobile-units-panel" 
            ref={mobileUnitsRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="course-mobile-units-header">
              <h2>📋 Course Units</h2>
              <button 
                className="course-mobile-close-btn"
                onClick={handleCloseMobileUnits}
                aria-label="Close units"
                >
                ✕
                </button>
            </div>
            
            <div className="course-mobile-units-list">
              {table_of_contents.units.map((unit, index) => (
                <button
                  key={index}
                  className={`course-unit-item ${selectedUnit === index ? 'course-active' : ''}`}
                  onClick={() => handleUnitSelect(index)}
                >
                  <div className="course-unit-number">Unit {unit.unit_number}</div>
                  <div className="course-unit-title">{unit.unit_title}</div>
                  <div className="course-topic-count">{unit.topics.length} topics</div>
                </button>
              ))}
              
              {/* Final Exam Button */}
              <button
                className={`course-unit-item course-final-exam-item ${selectedUnit === 'final-exam' ? 'course-active' : ''}`}
                onClick={() => handleUnitSelect('final-exam')}
              >
                <div className="course-unit-number">Final</div>
                <div className="course-unit-title">📝 Final Exam</div>
                <div className="course-topic-count">Test your knowledge</div>
              </button>
            </div>
          </div>
        </div>
      )}
        
      {/* Main Content Grid */}
      <div className={`course-content ${isSidebarCollapsed ? 'course-sidebar-collapsed' : ''}`}>
       
        {/* Expand button when collapsed */}
        {isSidebarCollapsed && (
          <button 
            className="course-sidebar-expand-btn"
            onClick={() => setIsSidebarCollapsed(false)}
            aria-label="Expand sidebar"
          >
            ▶
          </button>
        )}
       
        {/* Sidebar - Table of Contents */}
        <div className={`course-sidebar ${isSidebarCollapsed ? 'course-collapsed' : ''}`}>
          <div className="course-sidebar-header">
            <div className="course-sidebar-header-content">
              <div className="course-sidebar-title-section">
                <h2>📋 Course Units</h2>
                <span className="course-unit-count">{table_of_contents.units.length} Units</span>
              </div>
              <button 
                className="course-sidebar-toggle-btn"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                aria-label="Collapse sidebar"
              >
                ◀
              </button>
            </div>
          </div>
          
          <div className="course-units-list">
            {table_of_contents.units.map((unit, index) => (
              <button
                key={index}
                className={`course-unit-item ${selectedUnit === index ? 'course-active' : ''}`}
                onClick={() => handleUnitSelect(index)}
              >
                <div className="course-unit-number">Unit {unit.unit_number}</div>
                <div className="course-unit-title">{unit.unit_title}</div>
                <div className="course-topic-count">{unit.topics.length} topics</div>
              </button>
            ))}
            
            {/* Final Exam Button */}
            <button
              className={`course-unit-item course-final-exam-item ${selectedUnit === 'final-exam' ? 'course-active' : ''}`}
              onClick={() => handleUnitSelect('final-exam')}
            >
              <div className="course-unit-number">Final</div>
              <div className="course-unit-title">📝 Final Exam</div>
              <div className="course-topic-count">Test your knowledge</div>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="course-main">
          {selectedUnit === null ? (
            <>
              {/* Course Header in Welcome */}
              <div className="course-header-inline">
                <div className="course-welcome-hero">
                  <div className="course-hero-emoji">📚</div>
                  <h1 className="course-title">{table_of_contents.course_title}</h1>
                  <p className="course-description">{table_of_contents.course_description}</p>
                  
                  <button 
                    className="course-start-button"
                    onClick={() => {
                      handleUnitSelect(0);
                      setIsSidebarCollapsed(false);
                    }}
                  >
                    <span className="course-start-text">Start Learning</span>
                    <span className="course-start-arrow">→</span>
                  </button>
                </div>
                
                
              </div>

              <div className="course-welcome-section">
                <h2>Course Overview</h2>
                <p>This comprehensive course is organized into {table_of_contents.units.length} units covering essential topics. Track your progress and master each concept at your own pace.</p>
                
                <div className="course-quick-stats">
                  <div className="course-stat-card">
                    <div className="course-stat-number">{table_of_contents.units.length}</div>
                    <div className="course-stat-label">Total Units</div>
                  </div>
                  <div className="course-stat-card">
                    <div className="course-stat-number">
                      {table_of_contents.units.reduce((acc, unit) => acc + unit.topics.length, 0)}
                    </div>
                    <div className="course-stat-label">Total Topics</div>
                  </div>
                  <div className="course-stat-card">
                    <div className="course-stat-number">
                      {unit_summaries.reduce((acc, unit) => acc + unit.key_definitions.length, 0)}
                    </div>
                    <div className="course-stat-label">Key Definitions</div>
                  </div>
                </div>
              </div>
            </>
          ) : selectedUnit === 'final-exam' ? (
            <>
            
            {/* Final Exam Hero Section */}
            <div className="course-final-exam-hero">
                <div className="course-final-exam-icon">🎓</div>
                <h1 className="course-final-exam-title">Final Exam</h1>
                <p className="course-final-exam-description">
                    Ready to test your mastery of {table_of_contents.course_title}? This comprehensive exam covers all {table_of_contents.units.length} units and will assess your understanding of key concepts, definitions, and topics.
                </p>
                
                <div className="course-final-exam-stats">
                    <div className="course-exam-stat">
                        <div className="course-exam-stat-number">{table_of_contents.units.length}</div>
                        <div className="course-exam-stat-label">Units Covered</div>
                    </div>
                    <div className="course-exam-stat">
                        <div className="course-exam-stat-number">
                            {unit_summaries.reduce((acc, unit) => acc + unit.key_definitions.length, 0)}
                        </div>
                        <div className="course-exam-stat-label">Total Concepts</div>
                    </div>
                </div>

                {/* Show different button based on exam status */}
                {examUnitMap['final-exam']?.isComplete && examUnitMap['final-exam']?.batchID ? (
                    <Link
                        to={`/exam/${examUnitMap['final-exam'].batchID}?batchName=${encodeURIComponent(examUnitMap['final-exam'].batchName)}&tier=${userProfile.accountTier}`}
                        state={{ 
                            batchName: examUnitMap['final-exam'].batchName, 
                            userProfile 
                        }}
                        className="course-final-exam-button complete"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span className="course-exam-button-text">✓ View Your Final Exam</span>
                    </Link>
                ) : (
                    <button 
                        className={`course-final-exam-button ${examUnitMap['final-exam']?.isProcessing ? 'processing' : ''}`}
                        onClick={toggleFinalExamInput}
                        disabled={examUnitMap['final-exam']?.isProcessing}
                    >
                       <span className="course-exam-button-text">
                            {examUnitMap['final-exam']?.isProcessing 
                                ? (isMaxPolls ? 'Processing is taking longer than usual, check back later in your dashboard' : 'Generating Final Exam...')
                                : 'Start a Final Exam'}
                        </span>
                        <span className="course-exam-button-arrow">→</span>
                    </button>
                )}

                <p className="course-exam-disclaimer">
                    💡 Make sure you've reviewed all units before starting. You can return to any unit using the sidebar.
                </p>

                {/* Final Exam Input Slider */}
                <div className={`course-input-slider ${isFinalExamInputOpen ? 'course-input-open' : ''}`}>
                    <textarea
                        className="course-input-textarea"
                        placeholder="Enter your final exam preferences or special instructions here..."
                        value={finalExamInput}
                        onChange={(e) => {
                            if (e.target.value.length <= 300) {
                                setFinalExamInput(e.target.value);
                            }
                        }}
                        maxLength={300}
                        rows={3}
                    />
                    <div className="course-input-char-count">
                        {finalExamInput.length}/300
                    </div>

                    {/* Unit Selection for Final Exam */}
                    <div className="course-unit-selection-section">
                        <label className="course-unit-selection-label">
                            Select units to include in final exam:
                        </label>
                        <div className="course-unit-selection-grid">
                            {table_of_contents.units.map((unit, index) => (
                                <label key={index} className="course-unit-checkbox-wrapper">
                                    <input
                                        type="checkbox"
                                        checked={selectedFinalExamUnits.includes(index)}
                                        onChange={() => toggleFinalExamUnitSelection(index)}
                                        className="course-unit-checkbox"
                                    />
                                    <span className="course-unit-checkbox-label">
                                        Unit {unit.unit_number}: {unit.unit_title}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    <div className="course-input-actions">
                        <button 
                            className="course-input-submit-btn"
                            onClick={() => {
                                const selectedUnits = selectedFinalExamUnits.map(idx => idx + 1);
                                const instructions = finalExamInput;
                                
                                handleUpload('Exams', selectedUnits, instructions);
                                
                                setIsFinalExamInputOpen(false);
                                setFinalExamInput('');
                                setSelectedFinalExamUnits([]);
                            }}
                            disabled={selectedFinalExamUnits.length === 0}
                        >
                            Generate Final Exam
                        </button>
                    </div>
                </div>
            </div>
            </>
          ) : (
            <>
          
              {/* Unit Header */}
              <div className="course-unit-header">
                
                <div className="course-unit-badge">Unit {table_of_contents.units[selectedUnit].unit_number}</div>
                <h2 className="course-unit-main-title">{table_of_contents.units[selectedUnit].unit_title}</h2>
              </div>

              {/* Overview Section */}
              {unit_summaries[selectedUnit] && (
                <div className="course-overview-section">
                  <h3 className="course-section-heading">📖 Overview</h3>
                  <p className="course-overview-text">
                    <LatexText text={unit_summaries[selectedUnit].overview} />
                  </p>
                </div>
              )}

              {/* Quiz Me Button with Input */}
              <div className="course-quiz-button-wrapper">
                {quizUnitMap[selectedUnit]?.isComplete && quizUnitMap[selectedUnit]?.batchID ? (
                  <Link
                  to={`/quiz/${quizUnitMap[selectedUnit].batchID}?batchName=${encodeURIComponent(quizUnitMap[selectedUnit].batchName)}&tier=${userProfile.accountTier}`}
                  state={{ 
                      batchName: quizUnitMap[selectedUnit].batchName, 
                      userProfile 
                  }}
                  className="course-quiz-button complete"
                   target="_blank"
                    rel="noopener noreferrer"
              >
                  <span className="course-quiz-icon">✓</span>
                  <span>View Your Quiz</span>
              </Link>
                ) : (
                    <button 
                        className={`course-quiz-button ${quizUnitMap[selectedUnit]?.isProcessing ? 'processing' : ''}`}
                        onClick={toggleQuizInput}
                        disabled={quizUnitMap[selectedUnit]?.isProcessing}
                    >
                        <span className="course-quiz-icon">🎯</span>
                        <span>
                        {quizUnitMap[selectedUnit]?.isProcessing 
                            ? (isMaxPolls ? 'Processing is taking longer than usual, check back later in your dashboard' : 'Generating Quiz...')
                            : 'Test Your Knowledge - Take a Quiz'}
                    </span>                    
                    </button>
                    
                )}
            </div>
            <div className='course-note-div' style={{display: isQuizInputOpen?'flex' : 'none'}}>
            <p className='course-note'>NOTE: Previously created quizzes appear in your dashboard quiz section.</p>

            </div>
              {/* Sliding Quiz Input */}
              <div className={`course-input-slider ${isQuizInputOpen ? 'course-input-open' : ''}`}>
                <textarea
                  className="course-input-textarea"
                  placeholder="Enter your quiz preferences or special instructions here..."
                  value={quizInput}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) {
                      setQuizInput(e.target.value);
                    }
                  }}
                  maxLength={300}
                  rows={3}
                />
                <div className="course-input-char-count">
                  {quizInput.length}/300
                </div>
                
                {/* Unit Selection */}
                <div className="course-unit-selection-section">
                  <label className="course-unit-selection-label">
                    Include additional units (optional):
                  </label>
                  <div className="course-unit-selection-grid">
                    {table_of_contents.units.map((unit, index) => {
                      // Don't show the current unit
                      if (index === selectedUnit) return null;
                      
                      return (
                        <label key={index} className="course-unit-checkbox-wrapper">
                          <input
                            type="checkbox"
                            checked={selectedQuizUnits.includes(index)}
                            onChange={() => toggleQuizUnitSelection(index)}
                            className="course-unit-checkbox"
                          />
                          <span className="course-unit-checkbox-label">
                            Unit {unit.unit_number}: {unit.unit_title}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="course-input-actions">
                <button 
                className="course-input-submit-btn"
                onClick={() => {
                    // Your logic to get the data
                    const currentUnit = selectedUnit +1;
                    const allQuizUnits = [currentUnit, ...selectedQuizUnits.map(idx => idx + 1)];
                    const instructions = quizInput;
                    
                    handleUpload('Quizzes',allQuizUnits,instructions)
                  
                    
                    // Close popup and clear everything
                    setIsQuizInputOpen(false);
                    setQuizInput('');
                    setSelectedQuizUnits([]);
                }}
                >
                Generate Quiz
                </button>
                </div>
              </div>
                
              {/* Topics Section */}
              <div className="course-topics-section">
                <h3 className="course-section-heading">📚 Topics Covered</h3>
                <div className="course-topics-grid">
                  {table_of_contents.units[selectedUnit].topics.map((topic, idx) => (
                    <div key={idx} className="course-topic-card">
                      <div className="course-topic-icon">•</div>
                      <div className="course-topic-text">
                        <LatexText text={topic} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            {/* Flashcards Button with Input */}
            {unit_summaries[selectedUnit] && unit_summaries[selectedUnit].key_definitions.length > 0 && (
                <>
                   <div className="course-flashcards-button-wrapper">
                    {flashcardUnitMap[selectedUnit]?.isComplete && flashcardUnitMap[selectedUnit]?.batchID ? (
                        <Link
                        to={`/flashcards/${flashcardUnitMap[selectedUnit].batchID}?batchName=${encodeURIComponent(flashcardUnitMap[selectedUnit].batchName)}&tier=${userProfile.accountTier}`}
                        state={{ 
                            batchName: flashcardUnitMap[selectedUnit].batchName, 
                            userProfile 
                        }}
                        className="course-flashcards-button complete"
                         target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span className="course-flashcards-icon">✓</span>
                        <span>View Your Flashcards</span>
                    </Link>
                    ) : (
                        <button 
                            className={`course-flashcards-button ${flashcardUnitMap[selectedUnit]?.isProcessing ? 'processing' : ''}`}
                            onClick={toggleFlashcardInput}
                            disabled={flashcardUnitMap[selectedUnit]?.isProcessing}
                        >
                            <span className="course-flashcards-icon">🗃️</span>
                            <span>
                                {flashcardUnitMap[selectedUnit]?.isProcessing 
                                    ? (isMaxPolls ? 'Processing is taking longer than usual, check back later in your dashboard' : 'Generating Flashcards...')
                                    : 'Study Key Terms with Flashcards'}
                            </span>
                            </button>
                    )}
                </div>
                <div className='course-note-div' style={{display: isFlashcardInputOpen?'flex' : 'none'}}>
            <p className='course-note'>NOTE: Previously created flashcards appear in your dashboard flashcards section.</p>

            </div>
                  {/* Sliding Flashcard Input */}
                  <div className={`course-input-slider ${isFlashcardInputOpen ? 'course-input-open' : ''}`}>
                    <textarea
                      className="course-input-textarea"
                      placeholder="Enter your flashcard preferences or special instructions here..."
                      value={flashcardInput}
                      onChange={(e) => {
                        if (e.target.value.length <= 300) {
                          setFlashcardInput(e.target.value);
                        }
                      }}
                      maxLength={300}
                      rows={3}
                    />
                    <div className="course-input-char-count">
                      {flashcardInput.length}/300
                    </div>
                    
                    {/* Unit Selection */}
                    <div className="course-unit-selection-section">
                      <label className="course-unit-selection-label">
                        Include additional units (optional):
                      </label>
                      <div className="course-unit-selection-grid">
                        {table_of_contents.units.map((unit, index) => {
                          // Don't show the current unit
                          if (index === selectedUnit) return null;
                          
                          return (
                            <label key={index} className="course-unit-checkbox-wrapper">
                              <input
                                type="checkbox"
                                checked={selectedFlashcardUnits.includes(index)}
                                onChange={() => toggleFlashcardUnitSelection(index)}
                                className="course-unit-checkbox"
                              />
                              <span className="course-unit-checkbox-label">
                                Unit {unit.unit_number}: {unit.unit_title}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="course-input-actions">
                    <button 
                    className="course-input-submit-btn"
                    onClick={() => {
                        // Your logic to get the data
                        const currentUnit = selectedUnit+1;
                        const allFlashcardUnits = [currentUnit, ...selectedFlashcardUnits.map(idx => idx + 1)];
                        const instructions = flashcardInput;
                        handleUpload('Flashcards',allFlashcardUnits,instructions)

                  
                        
                        // Close popup and clear everything
                        setIsFlashcardInputOpen(false);
                        setFlashcardInput('');
                        setSelectedFlashcardUnits([]);
                    }}
                    >
                    Generate Flashcards
                    </button>
                    </div>
                  </div>
                </>
              )}

              {/* Key Definitions Section */}
              {unit_summaries[selectedUnit] && unit_summaries[selectedUnit].key_definitions.length > 0 && (
                <div className="course-definitions-section">
                  <h3 className="course-section-heading">🔑 Key Definitions</h3>
                  <div className="course-definitions-list">
                    {unit_summaries[selectedUnit].key_definitions.map((def, idx) => {
                      const isExpanded = expandedDefinitions[`${selectedUnit}-${idx}`];
                      return (
                        <div key={idx} className="course-definition-card">
                          <button
                            className="course-definition-header"
                            onClick={() => toggleDefinition(selectedUnit, idx)}
                          >
                            <div className="course-definition-term">
                              <LatexText text={def.term} />
                            </div>
                            <div className={`course-expand-icon ${isExpanded ? 'course-expanded' : ''}`}>
                              ▼
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="course-definition-content">
                              <p><LatexText text={def.definition} /></p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Unit Navigation */}
              <div className="course-unit-navigation">
                <button
                  className="course-nav-button course-prev-button"
                  onClick={() => handleUnitSelect(selectedUnit - 1)}
                  disabled={selectedUnit === 0}
                >
                  <span className="course-nav-arrow">←</span>
                  <span className="course-nav-text">Previous Unit</span>
                </button>
                <button
                  className={`course-nav-button course-next-button ${
                    selectedUnit === table_of_contents.units.length - 1 ? 'course-final-exam-nav' : ''
                  }`}
                  onClick={() => handleUnitSelect(
                    selectedUnit === table_of_contents.units.length - 1 
                      ? 'final-exam' 
                      : selectedUnit + 1
                  )}
                  disabled={false}
                >
                  <span className="course-nav-text">
                    {selectedUnit === table_of_contents.units.length - 1 
                      ? 'Take Final Exam' 
                      : 'Next Unit'}
                  </span>
                  <span className="course-nav-arrow">→</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}