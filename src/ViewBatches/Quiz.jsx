import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchAuthSession } from 'aws-amplify/auth';
import { useParams } from 'react-router-dom';
import "./Quiz.css"

export default function Quiz(){
    const { batchID } = useParams();
        const [batchJSON, setBatchJSON] = useState(null);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState(null);
    
        useEffect(() => {
            const fetchJSON = async () => {
                try {
                    setIsLoading(true);
                    
                    // Get auth token
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
                    setBatchJSON(data);
                    setIsLoading(false);
                    
                } catch (err) {
                    console.error('Error fetching Quiz data:', err);
                    setError(err.message);
                    setIsLoading(false);
                }
            };
            
            if (batchID) {
                fetchJSON();
            }
        }, [batchID]); 
    
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
            <div style={{ 
                padding: '20px',
                height: '100vh',  // ← Full viewport height
                overflow: 'auto'  // ← Enable scrolling on container
            }}>
                <h2>quiz for Batch: {batchID}</h2>
                <pre style={{
                    backgroundColor: '#f5f5f5',
                    padding: '20px',
                    borderRadius: '8px',
                    overflow: 'auto',  // ← Enable scrolling
                    textAlign: 'left',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    maxHeight: 'calc(100vh - 120px)',  // ← Limit height
                    whiteSpace: 'pre-wrap',  // ← Wrap long lines
                    wordBreak: 'break-word'  // ← Break long words
                }}>
                    {JSON.stringify(batchJSON, null, 2)}
                </pre>
            </div>
        )
    
}