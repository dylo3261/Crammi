import React, { useState, useEffect, useRef } from "react";
import { fetchAuthSession } from 'aws-amplify/auth';
import { useParams } from 'react-router-dom';
import "./Flashcards.css";

export default function Flashcards() {
  const { batchID } = useParams();
  const [batchJSON, setBatchJSON] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef(null);

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
              type: 'Flashcards'
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
        console.error('Error fetching flashcard data:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };
    
    if (batchID) {
      fetchJSON();
    }
  }, [batchID]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!batchJSON || batchJSON.length === 0) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0 && !isNavigating) {
          setIsNavigating(true);
          setIsFlipped(false); // Reset flip immediately
          setSlideDirection('slide-right');
          
          setTimeout(() => {
            setCurrentIndex(prev => Math.max(prev - 1, 0));
            setSlideDirection('');
          }, 200);
          
          setTimeout(() => {
            setIsNavigating(false);
          }, 150);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < batchJSON.length - 1 && !isNavigating) {
          setIsNavigating(true);
          setIsFlipped(false); // Reset flip immediately
          setSlideDirection('slide-left');
          
          setTimeout(() => {
            setCurrentIndex(prev => Math.min(prev + 1, batchJSON.length - 1));
            setSlideDirection('');
          }, 200);
          
          setTimeout(() => {
            setIsNavigating(false);
          }, 150);
        }
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [batchJSON, currentIndex, isNavigating]);

  const goToNext = () => {
    if (currentIndex >= batchJSON.length - 1 || isNavigating) return;
    
    setIsNavigating(true);
    setIsFlipped(false); // Reset flip immediately
    setSlideDirection('slide-left');
    
    setTimeout(() => {
      setCurrentIndex(prev => Math.min(prev + 1, batchJSON.length - 1));
      setSlideDirection('');
    }, 200);
    
    setTimeout(() => {
      setIsNavigating(false);
    }, 150);
  };

  const goToPrevious = () => {
    if (currentIndex <= 0 || isNavigating) return;
    
    setIsNavigating(true);
    setIsFlipped(false); // Reset flip immediately
    setSlideDirection('slide-right');
    
    setTimeout(() => {
      setCurrentIndex(prev => Math.max(prev - 1, 0));
      setSlideDirection('');
    }, 200);
    
    setTimeout(() => {
      setIsNavigating(false);
    }, 150);
  };

  const handleCardClick = () => {
    setIsFlipped(prev => !prev);
  };

  if (isLoading) {
    return (
      <div className="flashcard-container loading">
        <div className="message">Loading flashcards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flashcard-container error">
        <div className="message">Error: {error}</div>
      </div>
    );
  }

  if (!batchJSON || batchJSON.length === 0) {
    return (
      <div className="flashcard-container empty">
        <div className="message">No flashcard data found</div>
      </div>
    );
  }

  const currentCard = batchJSON[currentIndex];

  return (
    <div className="flashcard-container">
      {/* Header */}
      <div className="flashcard-header">
        <h1 className="title">Flashcards - Batch {batchID}</h1>
         {/* Progress Bar */}
      <div className="progress-bar-container">
        <div 
          className="progress-bar"
          style={{
            width: `${((currentIndex + 1) / batchJSON.length) * 100}%`
          }}
        />
      </div>
        <p className="card-counter">
          Card {currentIndex + 1} of {batchJSON.length}
        </p>
        <p className="instructions">
          Click card or press Space/↑/↓ to flip • ← → to navigate
        </p>
      </div>

      {/* Flashcard */}
      <div className="card-wrapper">
        <div 
          className={`card ${isFlipped ? 'flipped' : ''} ${slideDirection}`}
          onClick={handleCardClick}
        >
          <div className="card-face card-front">
            <div className="card-label">QUESTION</div>
            <div className="card-content">{currentCard.front}</div>
          </div>
          <div className="card-face card-back">
            <div className="card-label">ANSWER</div>
            <div className="card-content">{currentCard.back}</div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="navigation-controls">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="nav-button"
        >
          <span className="arrow">←</span>
          <span>Previous</span>
        </button>

        <div className="dot-indicators">
          {batchJSON.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (isNavigating) return;
                
                setIsNavigating(true);
                setIsFlipped(false); // Reset flip immediately
                const direction = idx > currentIndex ? 'slide-left' : 'slide-right';
                setSlideDirection(direction);
                
                setTimeout(() => {
                  setCurrentIndex(idx);
                  setSlideDirection('');
                }, 200);
                
                setTimeout(() => {
                  setIsNavigating(false);
                }, 150);
              }}
              className={`dot ${idx === currentIndex ? 'active' : ''}`}
              aria-label={`Go to card ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goToNext}
          disabled={currentIndex === batchJSON.length - 1}
          className="nav-button"
        >
          <span>Next</span>
          <span className="arrow">→</span>
        </button>
      </div>

    </div>
  );
}