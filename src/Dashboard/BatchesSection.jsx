import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchAuthSession } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import "./BatchesSection.css";



export default function BatchesSection({ activeTab }){
    const [batches, setBatches] = useState([])
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [notification, setNotification] = useState(null);
    const [editingBatchId, setEditingBatchId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const menuRef = useRef(null);
    const pollIntervalRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const handleCardClick = (batchID, status, batchName) => {
        // Only navigate if batch is complete
        if (status === 'COMPLETE') {
            if(activeTab==='Exams'){
                navigate(`/Exam/${batchID}`,{state: {batchName} });
            }
            else if(activeTab==='Quizzes'){
                navigate(`/Quiz/${batchID}`,{state: {batchName} });
            }
            else if(activeTab==='Flashcards'){
                navigate(`/Flashcards/${batchID}`,{state: {batchName} });
            }
            // navigate(`/Flashcards/${batchID}?name=${encodeURIComponent(batchName)}`);

        }
    };

    
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type, exiting: false });
    
        // start exit animation
        setTimeout(() => {
            setNotification(prev => prev ? { ...prev, exiting: true } : null);
        }, 2500);
    
        // remove after animation finishes
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };
    

    const fetchBatches = useCallback(async () => {
        console.log('🔄 Polling batches...', new Date().toLocaleTimeString());
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
          console.log('✅ Poll complete:', data.batches?.length, 'batches');
          setBatches(data.batches || []);
          setIsLoading(false);
        } catch (err) {
          console.error('❌ Error fetching batches:', err);
          setError(err.message);
          setIsLoading(false);
        }
    }, []);

    const startPolling = useCallback(() => {
        console.log('🚀 Manually starting polling');
        fetchBatches();
        
        if (!pollIntervalRef.current) {
            pollIntervalRef.current = setInterval(() => {
                fetchBatches();
            }, 10000);
        }
    }, [fetchBatches]);

    const deleteBatch = async (batchID,batchName) => {
        // Optimistically remove from UI immediately
        const batchToDelete = batches.find(b => b.batchID === batchID);
        setBatches(prevBatches => prevBatches.filter(batch => batch.batchID !== batchID));
        setOpenMenuId(null);

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
                        batch_cram: activeTab
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
                // Restore the batch if deletion failed
                setBatches(prevBatches => [...prevBatches, batchToDelete]);
            }
            
            return result;
        } catch (err) {
            console.error('Error deleting batch:', err);
            showNotification('Failed to delete batch', 'error');
            // Restore the batch if deletion failed
            setBatches(prevBatches => [...prevBatches, batchToDelete]);
        }
    };

    const handleMenuClick = (batchID, event) => {
        event.stopPropagation();
        setOpenMenuId(prevId => prevId === batchID ? null : batchID);
    };

    const handleDelete = async (batchID, event, batchName) => {
        event.stopPropagation();
        await deleteBatch(batchID,batchName);
    };

    const handleRename = (batchID, currentName, event) => {
        event.stopPropagation();
        setEditingBatchId(batchID);
        setEditingName(currentName);
        setOpenMenuId(null);
    };

    const handleRenameSubmit = async (batchID) => {
        if (!editingName.trim()) {
            showNotification('Batch name cannot be empty', 'error');
            setEditingBatchId(null);
            return;
        }

        // Store old name for rollback if needed
        const oldBatch = batches.find(b => b.batchID === batchID);
        const oldName = oldBatch?.batchName;

        // Optimistically update the UI immediately
        setBatches(prevBatches => 
            prevBatches.map(batch => 
                batch.batchID === batchID 
                    ? { ...batch, batchName: editingName }
                    : batch
            )
        );

        // Clear editing state
        setEditingBatchId(null);
        setEditingName('');

        // Here's where you'll hook up your API call
        console.log('Saving new name:', editingName, 'for batch:', batchID);
        
        // TODO: Add your API call here
        // Example:
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
                    <><span className="notification-name">{activeTab}</span> renamed successfully</>,
                    'success'
                );
            } else {
                // Rollback on failure
                showNotification(
                    <>Failed to rename <span className="notification-name">{activeTab}</span></>,
                    'error'
                );
                setBatches(prevBatches => 
                    prevBatches.map(batch => 
                        batch.batchID === batchID 
                            ? { ...batch, batchName: oldName }
                            : batch
                    )
                );
            }
        } catch (err) {
            console.error('Error renaming batch:', err);
            showNotification(
                <>Failed to rename <span className="notification-name">{activeTab}</span></>,
                'error'
            );
            // Rollback on error
            setBatches(prevBatches => 
                prevBatches.map(batch => 
                    batch.batchID === batchID 
                        ? { ...batch, batchName: oldName }
                        : batch
                )
            );
        }
    };

    const handleRenameCancel = () => {
        setEditingBatchId(null);
        setEditingName('');
    };

    const handleRenameKeyDown = (e, batchID) => {
        if (e.key === 'Enter') {
            handleRenameSubmit(batchID);
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
            console.log('🚀 Upload detected, starting polling');
            startPolling();
        };

        window.addEventListener('batchUploaded', handleBatchUploaded);
        
        return () => {
            window.removeEventListener('batchUploaded', handleBatchUploaded);
        };
    }, [startPolling]);

    useEffect(() => {
        const hasPending = batches.some(batch => batch.status === 'PENDING');
        
        if (hasPending && !pollIntervalRef.current) {
            console.log('▶️ Starting polling - pending batches detected');
            pollIntervalRef.current = setInterval(() => {
                fetchBatches();
            }, 10000);
        } else if (!hasPending && pollIntervalRef.current) {
            console.log('⏹️ Stopping polling - no pending batches');
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [batches, fetchBatches]);

    const filteredBatches = batches.filter(batch => {
        if (activeTab === 'Exams') return batch.type === 'Exams';
        if (activeTab === 'Quizzes') return batch.type === 'Quizzes';
        if (activeTab === 'Flashcards') return batch.type === 'Flashcards';
        return false;
    });

    const sortedBatches = [...filteredBatches].sort((a, b) => {
        // First, sort by status - PENDING comes first
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        
        // Then sort by newest first (most recent timeCreated)
        return new Date(b.timeCreated) - new Date(a.timeCreated);
    });

    const getStatusDisplay = (batch) => {
        switch(batch.status) {
            case 'PENDING':
                return '⏳ Processing...';
            case 'FAILED':
                return `❌ Failed: ${batch.failureReason}`;
            case 'COMPLETE':
                return 'Created recently';
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

    return(
        <>
        <div className="mainSection">
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
                    sortedBatches.map((batch) => (
                        <div key={batch.batchID} className={`batch-card ${batch.status === 'PENDING' ? 'processing' : ''}`} onClick={()=>handleCardClick(batch.batchID,batch.status,batch.batchName)}>
                            <div className="batch-header">
                                <span className="batch-type-badge">{activeTab}</span>
                                <div className="batch-menu-container">
                                    <button 
                                        className="batch-menu" 
                                        onClick={(e) => handleMenuClick(batch.batchID, e)}
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
                                                onClick={(e) => handleDelete(batch.batchID, e, batch.batchName)}
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
                                        onBlur={() => handleRenameSubmit(batch.batchID)}
                                        onKeyDown={(e) => handleRenameKeyDown(e, batch.batchID)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    batch.batchName
                                )}
                            </h3>
                            <p className="batch-description">{batch.description}</p>
                            <p className="batch-timestamp" style={{
                                color: batch.status === 'FAILED' ? '#d32f2f' : 
                                       batch.status === 'PENDING' ? '#f57c00' : '#5f6368'
                            }}>
                                {getStatusDisplay(batch)}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
        
        {/* Notification Toast */}
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