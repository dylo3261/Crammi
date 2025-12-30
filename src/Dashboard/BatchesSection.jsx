// BatchesSection.jsx
import React, { useState, useEffect } from "react";
import { fetchAuthSession } from 'aws-amplify/auth';
import './BatchesSection.css';

const BatchCard = ({ batch, onStartStudy }) => {
  const getTypeIcon = (type) => {
    const icons = {
      'Flashcards': '📝',
      'Quizzes': '❓',
      'Exams': '📋'
    };
    return icons[type] || '📄';
  };

  const getTypeColor = (type) => {
    const colors = {
      'Flashcards': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'Quizzes': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'Exams': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    };
    return colors[type] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };

  if (batch.status === 'PENDING' || batch.status === 'PROCESSING') {
    return (
      <div className="batch-card processing">
        <div 
          className="card-thumbnail loading-shimmer"
          style={{ background: getTypeColor(batch.type) }}
        >
          <div className="spinner"></div>
        </div>
        <div className="card-info">
          <h3>{batch.type}</h3>
          <p className="status">Processing...</p>
        </div>
      </div>
    );
  }

  if (batch.status === 'FAILED') {
    return (
      <div className="batch-card failed">
        <div className="card-thumbnail error">
          <span className="error-icon">⚠️</span>
        </div>
        <div className="card-info">
          <h3>{batch.type}</h3>
          <p className="error-message">{batch.failureReason || 'Processing failed'}</p>
          <button className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  // COMPLETE status
  return (
    <div className="batch-card complete" onClick={() => onStartStudy(batch.batchID)}>
      <div 
        className="card-thumbnail"
        style={{ background: getTypeColor(batch.type) }}
      >
        <span className="type-icon">{getTypeIcon(batch.type)}</span>
      </div>
      <div className="card-info">
        <h3>{batch.type}</h3>
        <p className="description">{batch.description || 'Ready to study'}</p>
        <button className="start-button">Start Studying →</button>
      </div>
    </div>
  );
};

export default function BatchesSection() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    // Poll every 5 seconds if there are pending batches
    const hasPending = batches.some(
      b => b.status === 'PENDING' || b.status === 'PROCESSING'
    );

    if (!hasPending) return;

    const interval = setInterval(fetchBatches, 5000);
    return () => clearInterval(interval);
  }, [batches]);

  const fetchBatches = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const response = await fetch(
        'https://gwq0u2sdai.execute-api.us-west-2.amazonaws.com/prod/batches',
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch batches');

      const data = await response.json();
      setBatches(data.batches || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleStartStudy = (batchID) => {
    // Navigate to study page
    window.location.href = `/study/${batchID}`;
  };

  if (loading) {
    return (
      <div className="batches-loading">
        <div className="spinner"></div>
        <p>Loading your study materials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="batches-error">
        <p>Error loading batches: {error}</p>
        <button onClick={fetchBatches}>Retry</button>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="batches-empty">
        <img 
          src="https://uxwing.com/wp-content/themes/uxwing/download/file-and-folder-type/empty-file-icon.png" 
          alt="No batches" 
        />
        <h3>No study materials yet</h3>
        <p>Upload some files to get started!</p>
      </div>
    );
  }

  return (
    <div className="batches-grid">
      {batches.map(batch => (
        <BatchCard 
          key={batch.batchID} 
          batch={batch} 
          onStartStudy={handleStartStudy}
        />
      ))}
    </div>
  );
}