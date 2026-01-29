import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchAuthSession } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import "./BatchesSection.css";
import LimitReached from "./limitReached";

export default function BatchesSection({ 
    activeTab, 
    batches = [], 
    setBatches, 
    searchQuery, 
    addToRecents, 
    recents, 
    setRecents,
    userEmail,
    isLimitReached,
    setIsLimitReached,
    limitReachedMessage,
    userProfile
}){
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [notification, setNotification] = useState(null);
    const [editingBatchId, setEditingBatchId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [stuckBatches, setStuckBatches] = useState(new Set());
    const menuRef = useRef(null);
    const pollIntervalRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const pollCountRef = useRef(0);
    const MAX_POLLS = 18;

    useEffect(() => {
    if (batches.length > 0) {
        batches.forEach(batch => {
            // If a previously stuck batch is now complete, remove from stuck set
            if (stuckBatches.has(batch.batchID) && 
                (batch.status === 'COMPLETE' || batch.status === 'FAILED')) {
                setStuckBatches(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(batch.batchID);
                    return newSet;
                });
            }
        });
    }
}, [batches, stuckBatches]);

    const handleCardClick = (batchID, status, batchName, batchType) => {
        if (status === 'COMPLETE') {
            // Track when batch was opened with user-specific key
            const key = userEmail ? `batch_${batchID}_lastOpened_${userEmail}` : `batch_${batchID}_lastOpened`;
            localStorage.setItem(key, new Date().toISOString());
            addToRecents({
                id: batchID,
                name: batchName,
                type: batchType
              });
            if(batchType === 'Exams'){
                navigate(`/exam/${batchID}`, { state: { batchName, userProfile } });
            }
            else if(batchType === 'Quizzes'){
                navigate(`/quiz/${batchID}`, { state: { batchName, userProfile } });
            }
            else if(batchType === 'Flashcards'){
                navigate(`/flashcards/${batchID}`, { state: { batchName, userProfile } });
            }
            else if(batchType === 'Course Mode'){
                navigate(`/course/${batchID}`, { state: { batchName, userProfile } });
            }
        }
    };

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const created = new Date(timestamp);
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `Recently`;
        if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
        if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
        
        // For older items, show the actual date
        return created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type, exiting: false });
        setTimeout(() => {
            setNotification(prev => prev ? { ...prev, exiting: true } : null);
        }, 2500);
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    const fetchBatches = useCallback(async () => {
        // console.log('🔄 Polling batches...', new Date().toLocaleTimeString());
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
            throw new Error(`HTTP error! status: ${response.status}`);
          }
      
          const data = await response.json();
        //   console.log('✅ Poll complete:', data.batches?.length, 'batches');
          setBatches(data.batches || []);
          setIsLoading(false);
        } catch (err) {
          console.error('❌ Error fetching batches:', err);
          setError(err.message);
          setIsLoading(false);
        }
    }, [setBatches]);

    const startPolling = useCallback(() => {
        // console.log('🚀 Manually starting polling');
        pollCountRef.current = 0;
        fetchBatches();
    }, [fetchBatches]);

    const deleteBatch = async (batchID, batchName, batchType) => {
        const batchToDelete = batches.find(b => b.batchID === batchID);
        setBatches(prevBatches => prevBatches.filter(batch => batch.batchID !== batchID));
        setOpenMenuId(null);
    
        // Clean up localStorage entry for this batch with user-specific key
        const key = userEmail ? `batch_${batchID}_lastOpened_${userEmail}` : `batch_${batchID}_lastOpened`;
        localStorage.removeItem(key);
    
        // Remove from recents
        const updatedRecents = recents.filter(recent => recent.id !== batchID);
        setRecents(updatedRecents);
        
        // Update recents in localStorage with user-specific key
        const recentsKey = userEmail ? `crammi_recents_${userEmail}` : 'crammi_recents';
        localStorage.setItem(recentsKey, JSON.stringify(updatedRecents));
    
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();
            
            const response = await fetch(
                'https://9e89rfm90l.execute-api.us-west-2.amazonaws.com/delete-batch',
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        batch_ID: batchID,
                        batch_cram: batchType
                    })
                }
            );
            
            const result = await response.json();
            
            if (response.ok) {
                showNotification(
                    <><span className="notification-name">"{batchName}"</span> deleted successfully</>,
                    'success'
                );
            } else {
                console.error('Delete failed:', result);
                showNotification('Failed to delete batch', 'error');
                setBatches(prevBatches => [...prevBatches, batchToDelete]);
                // Restore recents if delete failed
                setRecents(recents);
                localStorage.setItem(recentsKey, JSON.stringify(recents));
            }
            
            return result;
        } catch (err) {
            console.error('Error deleting batch:', err);
            showNotification('Failed to delete batch', 'error');
            setBatches(prevBatches => [...prevBatches, batchToDelete]);
            // Restore recents if delete failed
            setRecents(recents);
            const recentsKey = userEmail ? `crammi_recents_${userEmail}` : 'crammi_recents';
            localStorage.setItem(recentsKey, JSON.stringify(recents));
        }
    };

    const handleMenuClick = (batchID, event) => {
        event.stopPropagation();
        setOpenMenuId(prevId => prevId === batchID ? null : batchID);
    };

    const handleDelete = async (batchID, event, batchName, batchType) => {
        event.stopPropagation();
        await deleteBatch(batchID, batchName, batchType);
    };

    const handleRename = (batchID, currentName, event) => {
        event.stopPropagation();
        setEditingBatchId(batchID);
        setEditingName(currentName);
        setOpenMenuId(null);
    };

    const handleRenameSubmit = async (batchID, batchType) => {
        if (!editingName.trim()) {
            showNotification('Batch name cannot be empty', 'error');
            setEditingBatchId(null);
            return;
        }
    
        const oldBatch = batches.find(b => b.batchID === batchID);
        const oldName = oldBatch?.batchName;
    
        // Update batches state
        setBatches(prevBatches => 
            prevBatches.map(batch => 
                batch.batchID === batchID 
                    ? { ...batch, batchName: editingName }
                    : batch
            )
        );
    
        // Update recents state and localStorage
        const updatedRecents = recents.map(recent => 
            recent.id === batchID 
                ? { ...recent, name: editingName }
                : recent
        );
        setRecents(updatedRecents);
        
        // Save to localStorage with user-specific key
        const recentsKey = userEmail ? `crammi_recents_${userEmail}` : 'crammi_recents';
        localStorage.setItem(recentsKey, JSON.stringify(updatedRecents));
    
        setEditingBatchId(null);
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
            
            if (response.ok) {
                showNotification(
                    <><span className="notification-name">{batchType}</span> renamed successfully</>,
                    'success'
                );
            } else {
                showNotification(
                    <>Failed to rename <span className="notification-name">{batchType}</span></>,
                    'error'
                );
                // Rollback batches
                setBatches(prevBatches => 
                    prevBatches.map(batch => 
                        batch.batchID === batchID 
                            ? { ...batch, batchName: oldName }
                            : batch
                    )
                );
                // Rollback recents
                setRecents(recents);
                localStorage.setItem(recentsKey, JSON.stringify(recents));
            }
        } catch (err) {
            console.error('Error renaming batch:', err);
            showNotification(
                <>Failed to rename <span className="notification-name">{batchType}</span></>,
                'error'
            );
            // Rollback batches
            setBatches(prevBatches => 
                prevBatches.map(batch => 
                    batch.batchID === batchID 
                        ? { ...batch, batchName: oldName }
                        : batch
                )
            );
            // Rollback recents
            setRecents(recents);
            localStorage.setItem(recentsKey, JSON.stringify(recents));
        }
    };

    const handleRenameCancel = () => {
        setEditingBatchId(null);
        setEditingName('');
    };

    const handleRenameKeyDown = (e, batchID, batchType) => {
        if (e.key === 'Enter') {
            handleRenameSubmit(batchID, batchType);
        } else if (e.key === 'Escape') {
            handleRenameCancel();
        }
    };

    useEffect(() => {
        if (editingBatchId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingBatchId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && 
                !menuRef.current.contains(event.target) && 
                !event.target.closest('.batch-menu')) {
                setOpenMenuId(null);
            }
        };

        if (openMenuId) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    useEffect(() => {
        fetchBatches();
    }, [fetchBatches]);

    useEffect(() => {
        const handleBatchUploaded = () => {
            // console.log('🚀 Upload detected, starting polling');
            startPolling();
        };

        window.addEventListener('batchUploaded', handleBatchUploaded);
        
        return () => {
            window.removeEventListener('batchUploaded', handleBatchUploaded);
        };
    }, [startPolling]);

    useEffect(() => {
        const hasPending = batches.some(batch => batch.status === 'PENDING');
        const isPolling = pollIntervalRef.current !== null;
        
        // console.log('🔍 Polling check:', { 
        //     hasPending, 
        //     isPolling, 
        //     pollCount: pollCountRef.current,
        //     batchCount: batches.length 
        // });
        
        if (hasPending && !isPolling) {
            // console.log('▶️ Starting polling - pending batches detected');
            pollCountRef.current = 0;
            pollIntervalRef.current = setInterval(() => {
                pollCountRef.current++;
                // console.log(`📊 Poll count: ${pollCountRef.current}/${MAX_POLLS}`);
                
                if (pollCountRef.current >= MAX_POLLS) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                    pollCountRef.current = 0;
                    // console.log('⏹️ Stopping polling - max polls reached');
                    
                    // Mark any still-pending batches as "stuck"
                    const stillPending = batches
                        .filter(b => b.status === 'PENDING')
                        .map(b => b.batchID);
                    setStuckBatches(new Set(stillPending));
                    
                    return;
                }
                
                fetchBatches();
            }, 10000);
        } else if (!hasPending && isPolling) {
            // console.log('⏹️ Stopping polling - no pending batches');
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            pollCountRef.current = 0;
            setStuckBatches(new Set());
        }
    }, [batches, fetchBatches]);

    useEffect(() => {
        // Remove batches from stuck set if they're no longer pending
        setStuckBatches(prev => {
            const newSet = new Set(prev);
            let changed = false;
            
            prev.forEach(batchID => {
                const batch = batches.find(b => b.batchID === batchID);
                if (!batch || batch.status !== 'PENDING') {
                    newSet.delete(batchID);
                    changed = true;
                }
            });
            
            return changed ? newSet : prev;
        });
    }, [batches]);

    // Filter batches by type
    const filteredBatches = batches.filter(batch => {
        if (activeTab === 'Exams') return batch.type === 'Exams';
        if (activeTab === 'Quizzes') return batch.type === 'Quizzes';
        if (activeTab === 'Flashcards') return batch.type === 'Flashcards';
        if (activeTab === 'Course Mode') return batch.type === 'Course Mode';
        if (activeTab === 'Files') return batch;
        return false;
    });

    // Apply search filter
    const searchFilteredBatches = filteredBatches.filter(batch => {
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase();
        const batchName = (batch.batchName || '').toLowerCase();
        const description = (batch.description || '').toLowerCase();
        const type = (batch.type || '').toLowerCase();
        
        return batchName.includes(query) || 
               description.includes(query) || 
               type.includes(query);
    });

    const sortedBatches = [...searchFilteredBatches].sort((a, b) => {
        // PENDING batches first
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        
        // Then newest first
        return new Date(b.timeCreated) - new Date(a.timeCreated);
    });

    // Group batches by Today/Earlier
    const groupBatchesByDate = (batches) => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const today = [];
        const earlier = [];
        
        batches.forEach(batch => {


            // Check localStorage for last opened time with user-specific key
            const key = userEmail ? `batch_${batch.batchID}_lastOpened_${userEmail}` : `batch_${batch.batchID}_lastOpened`;
            const lastOpenedStr = localStorage.getItem(key);
            const lastOpenedDate = lastOpenedStr ? new Date(lastOpenedStr) : null;
            const createdDate = new Date(batch.timeCreated);
            
            // Batch goes in "Today" if it was opened today OR created today
            const isToday = (lastOpenedDate && lastOpenedDate >= todayStart) || 
                            createdDate >= todayStart;
            
            if (isToday) {
                today.push(batch);
            } else {
                earlier.push(batch);
            }
        });
        
        return { today, earlier };
    };

    const { today, earlier } = groupBatchesByDate(sortedBatches);

    const getStatusDisplay = (batch) => {
        switch(batch.status) {
            case 'PENDING':
                if(batch.type!== 'Course Mode'){
                if (stuckBatches.has(batch.batchID)) {
                    return '🕒 Taking longer than usual... Check back later';
                }
                return '⏳ Processing...';
            }else{
                return '⏳ Processing... Courses take longer to process (~10m).';
            }
            case 'FAILED':
                return `❌ Failed: ${batch.failureReason}`;
            case 'COMPLETE':
                return `Created ${getTimeAgo(batch.timeCreated)}`;
            default:
                return 'Unknown status';
        }
    };

    const SkeletonCard = () => (
        <div className="batch-card skeleton-card">
            <div className="batch-header">
                <span className="skeleton skeleton-badge"></span>
                <span className="skeleton skeleton-menu"></span>
            </div>
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-description"></div>
            <div className="skeleton skeleton-description short"></div>
            <div className="skeleton skeleton-timestamp"></div>
        </div>
    );

    const renderBatchCard = (batch) => (
        <div 
            key={batch.batchID} 
            className={`batch-card ${batch.status === 'PENDING' ? 'processing' : ''} ${batch.status === 'FAILED' ? 'failed' : ''} ${stuckBatches.has(batch.batchID) ? 'stuck' : ''}`} 
            onClick={() => handleCardClick(batch.batchID, batch.status, batch.batchName, batch.type)}
        >
            <div className="batch-header">
                <span className="batch-type-badge">{batch.type}</span>
                <div className="batch-menu-container">
                    
                    <button 
                        className="batch-menu" 
                        onClick={(e) => handleMenuClick(batch.batchID, e)}
                        style={{display: batch.status === "PENDING" ? 'none' : 'flex'}}
                    >
                        ⋯
                    </button>
                    {openMenuId === batch.batchID && (
                        <div className="batch-dropdown-menu" ref={menuRef}>
                            <button 
                                className="dropdown-item"
                                onClick={(e) => handleRename(batch.batchID, batch.batchName, e)}
                            >
                                Rename
                            </button>
                            <button 
                                className="dropdown-item delete"
                                onClick={(e) => handleDelete(batch.batchID, e, batch.batchName, batch.type)}
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <h3 className="batch-title">
                {editingBatchId === batch.batchID ? (
                    <input
                        ref={inputRef}
                        type="text"
                        className="batch-title-input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleRenameSubmit(batch.batchID, batch.type)}
                        onKeyDown={(e) => handleRenameKeyDown(e, batch.batchID, batch.type)}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    batch.batchName
                )}
            </h3>
            <p className="batch-description">{batch.description}</p>
            <p className="batch-timestamp" style={{
                color: batch.status === 'FAILED' ? '#d32f2f' : 
                       (batch.status === 'PENDING' && stuckBatches.has(batch.batchID)) ? '#ff9800' :
                       batch.status === 'PENDING' ? '#f57c00' : '#5f6368'
            }}>
                {getStatusDisplay(batch)}
            </p>
        </div>
    );

    return(
        <>
        <div className="mainSection">
            <div className="isLimitReached?" style={{display: isLimitReached? 'flex' : 'none'}}>
                <LimitReached 
                    isLimitReached={isLimitReached}
                    setIsLimitReached={setIsLimitReached}
                    limitReachedMessage={limitReachedMessage}
                    userProfile={userProfile}
                    activeTab={activeTab}
                    
                />            
                </div>
            <div className="suchEmptiness" style={{display: sortedBatches.length === 0 && !isLoading ? 'flex': 'none'}}>
                <div className="no-results">
                    Wow, Such Emptiness... 💤
                </div>
             </div>   
            <div className="batches-grid">
                {isLoading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : (
                    <>
                        {today.length > 0 && (
                            <>
                                <div className="section-header">Today</div>
                                {today.map(renderBatchCard)}
                            </>
                        )}
                        
                        {earlier.length > 0 && (
                            <>
                                <div className="section-header">Earlier</div>
                                {earlier.map(renderBatchCard)}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
        
        {notification && (
            <div
                className={`notification-toast 
                            ${notification.type} 
                            ${notification.exiting ? 'exit' : ''}`}
            >
                {notification.message}
            </div>
        )}
        </>
    )
}