import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchAuthSession } from 'aws-amplify/auth';
import "./BatchesSection.css";

export default function BatchesSection({ activeTab }){
    const [batches, setBatches] = useState([])
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);
    const pollIntervalRef = useRef(null);
    
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
        // Fetch immediately
        fetchBatches();
        
        // Start polling if not already active
        if (!pollIntervalRef.current) {
            pollIntervalRef.current = setInterval(() => {
                fetchBatches();
            }, 5000);
        }
    }, [fetchBatches]);

    const deleteBatch = async (batchID) => {
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
                // Remove the deleted batch from state
                setBatches(prevBatches => prevBatches.filter(batch => batch.batchID !== batchID));
                setOpenMenuId(null); // Close the menu
            } else {
                console.error('Delete failed:', result);
            }
            
            return result;
        } catch (err) {
            console.error('Error deleting batch:', err);
        }
    };

    const handleMenuClick = (batchID, event) => {
        event.stopPropagation();
        setOpenMenuId(openMenuId === batchID ? null : batchID);
    };

    const handleDelete = async (batchID, event) => {
        event.stopPropagation();
        await deleteBatch(batchID);
    };

    const handleRename = (batchID, event) => {
        event.stopPropagation();
        // TODO: Implement rename functionality
        console.log('Rename clicked for:', batchID);
        setOpenMenuId(null);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
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

    // Initial fetch on mount
    useEffect(() => {
        fetchBatches();
    }, [fetchBatches]);

    // Listen for custom event from upload
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

    // Polling logic - start/stop based on pending batches
    useEffect(() => {
        const hasPending = batches.some(batch => batch.status === 'PENDING');
        
        if (hasPending && !pollIntervalRef.current) {
            console.log('▶️ Starting polling - pending batches detected');
            // Start polling if there are pending batches and polling isn't active
            pollIntervalRef.current = setInterval(() => {
                fetchBatches();
            }, 5000); // 5 seconds
        } else if (!hasPending && pollIntervalRef.current) {
            console.log('⏹️ Stopping polling - no pending batches');
            // Stop polling if no pending batches
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        
        // Cleanup on unmount
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [batches, fetchBatches]);

    // Filter batches based on activeTab
    const filteredBatches = batches.filter(batch => {
        if (activeTab === 'Exams') return batch.type === 'Exams';
        if (activeTab === 'Quizzes') return batch.type === 'Quizzes';
        if (activeTab === 'Flashcards') return batch.type === 'Flashcards';
        return false;
    });

    // Sort batches: PENDING first, then by timeCreated (newest to oldest)
    const sortedBatches = [...filteredBatches].sort((a, b) => {
        const statusOrder = { 'PENDING': 0, 'COMPLETE': 1, 'FAILED': 2 };
        
        // First sort by status
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;
        
        // Then sort by timeCreated (newest first)
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

    // Skeleton loader component
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
                    // Show 7 skeleton cards while loading
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
                        <div key={batch.batchID} className={`batch-card ${batch.status === 'PENDING' ? 'processing' : ''}`}>
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
                                                onClick={(e) => handleRename(batch.batchID, e)}
                                            >
                                                Rename
                                            </button>
                                            <button 
                                                className="dropdown-item delete"
                                                onClick={(e) => handleDelete(batch.batchID, e)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <h3 className="batch-title">{batch.batchName}</h3>
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
        </>
    )
}