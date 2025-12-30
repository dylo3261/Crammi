import React, { useState, useEffect, useRef } from "react";
import { fetchAuthSession } from 'aws-amplify/auth';
import "./BatchesSection.css";

export default function BatchesSection({ activeTab }){
    const [batches, setBatches] = useState([])
    const [error, setError] = useState(null);
    
    const fetchBatches = async () => {
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
          setBatches(data.batches || []);
        } catch (err) {
          console.error('Error fetching batches:', err);
          setError(err.message);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchBatches();
        
        // Set up polling interval
        const intervalId = setInterval(() => {
            // Only poll if there are pending batches
            const hasPending = batches.some(batch => batch.status === 'PENDING');
            if (hasPending) {
                fetchBatches();
            }
        }, 10000); // 10 seconds
        
        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
    }, [batches]);

    // Filter batches based on activeTab
    const filteredBatches = batches.filter(batch => {
        if (activeTab === 'Exams') return batch.type === 'Exams';
        if (activeTab === 'Quizzes') return batch.type === 'Quizzes';
        if (activeTab === 'Flashcards') return batch.type === 'Flashcards';
        return false;
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

    return(
        <>
        <div className="mainSection">
            <div className="batches-grid">
                {filteredBatches.map((batch) => (
                    <div key={batch.batchID} className="batch-card">
                        <div className="batch-header">
                            <span className="batch-type-badge">{activeTab}</span>
                            <button className="batch-menu">⋯</button>
                        </div>
                        <h3 className="batch-title">Untitled {activeTab==='Quizzes'? activeTab.slice(0,-3):activeTab.slice(0, -1)}</h3>
                        <p className="batch-description">{batch.description}</p>
                        <p className="batch-timestamp" style={{
                            color: batch.status === 'FAILED' ? '#d32f2f' : 
                                   batch.status === 'PENDING' ? '#f57c00' : '#5f6368'
                        }}>
                            {getStatusDisplay(batch)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
        </>
    )
}