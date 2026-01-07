import React, { useState, useEffect, useRef } from "react";
import { fetchAuthSession } from 'aws-amplify/auth';
import "./uploadModal.css";

export default function UploadExistingModal({isOpen, close, activeTab, batches}){
    const modalRef = useRef(null);
    const [uploadInstructions, setUploadInstructions] = useState("");
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedBatchType,setSelectedBatchType]= useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortByType, setSortByType] = useState(false);

    // Filter for COMPLETE batches only, excluding current activeTab
    let availableBatches = batches.filter(
        batch => batch.status === 'COMPLETE' 
    );

    // Apply search filter
    if (searchQuery) {
        availableBatches = availableBatches.filter(batch =>
            batch.batchName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    // Apply sorting
    if (sortByType) {
        const typeOrder = { 'Exams': 1, 'Quizzes': 2, 'Flashcards': 3 };
        availableBatches = [...availableBatches].sort((a, b) => 
            (typeOrder[a.type] || 999) - (typeOrder[b.type] || 999)
        );
    }
   
    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedBatch(null);
            setUploadInstructions("");
            setSearchQuery("");
            setSortByType(false);
        }
    }, [isOpen]);

    const toggleBatchSelection = (batchID,batchType) => {
        setSelectedBatch(prev => prev === batchID ? null : batchID);
        setSelectedBatchType(prev => prev === batchID ? null : batchType);
    };

    const handleUpload = async () => {
        if (!selectedBatch) return;
        try {
                // Get fresh token
                const session = await fetchAuthSession();
                const token = session.tokens?.idToken?.toString();
                
                if (!token) {
                  console.error('No authentication token available');
                  return;
                }
                

            console.log('Selected batch:', selectedBatch);
            console.log('Upload instructions:', uploadInstructions);

            const existingPayload = {
                batch_ID: selectedBatch,
                requestedCram: activeTab,
                special_instructions: uploadInstructions,
                originalRequestedCram: selectedBatchType
            };
            const response = await fetch('https://ul9ffsljla.execute-api.us-west-2.amazonaws.com/prod/existing', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`  
                },
                body: JSON.stringify(existingPayload)
              });
            window.dispatchEvent(new Event('batchUploaded')); //start polling

              
            console.log('Response status:', response.status);
            if (!response.ok) {
            const errorData = await response.json();
            console.error('Upload failed:', errorData);
            return;
            }
    
        
        }catch (error) {
            console.error('Upload error:', error);
          }
    };

    // Close on Escape key
    useEffect(() => {
        function handleEscape(event) {
            if (event.key === "Escape") {
                close();
            }
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, close]);

    if (!isOpen) return null;

    return (
        <>
        <div className="uploadModalOverlay">
            <div className="uploadModalContent" ref={modalRef}>
                {/* Header */}
                <div className="uploadFileHeader">
                    <h1 className="uploadFileText">Upload Existing</h1>
                    <h4 className="filesRemaining">
                        <span><span className="asterik">*</span> Select {activeTab.toLowerCase()} from your library</span>
                    </h4>
                </div>

                {/* Search Bar */}
                <div className="existingSearchContainer">
                    <img
                        src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2018/png/iconmonstr-search-thin.png&r=0&g=0&b=0"
                        alt="search icon"
                        className="existingSearchIcon"
                    />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="existingSearchInput"
                    />
                </div>

                {/* File List Header */}
                <div className="fileListHeader">
                    <span className="fileNameHeader">Name</span>
                    <span 
                        className="existingFileSizeHeader sortable" 
                        onClick={() => setSortByType(!sortByType)}
                    >
                        Type {sortByType ? '▼' : '▲'}
                    </span>
                    <span className="removeHeader"></span>
                </div>
                <div className="bottomHeader"></div>

               {/* Batch Selection List */}
                <div className="existingFileSelection">
                    {availableBatches.length > 0 ? (
                        <ul className="existingFileList">
                            {availableBatches.map((batch) => (
                                <li 
                                    key={batch.batchID}
                                    onClick={() => toggleBatchSelection(batch.batchID, batch.type)}
                                    className={`batchItem ${selectedBatch === batch.batchID ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        checked={selectedBatch === batch.batchID}
                                        onChange={() => {}}
                                        className="batchRadio"
                                    />
                                    <div className="batchInfo">
                                        <span className="fileName">{batch.batchName}</span>
                                        <span className="batchDescription">{batch.description || ''}</span>
                                    </div>
                                    <span className="chosenFileSize">
                                        <span className="colorizeFileSize">{batch.type}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="emptyState">
                            {searchQuery ? 'Nothing matches your search' : 'Nothing available to select'}
                        </div>
                    )}
                </div>

                <div className="bottomHeader"></div>

                {/* Special Instructions - Always at bottom */}
                <div className="specialInstructionsCharacters">
                    <textarea
                        className="existingSpecialInstructions"
                        placeholder="Special Instructions..."
                        value={uploadInstructions}
                        onChange={(e) => setUploadInstructions(e.target.value)}
                        rows={2}
                        maxLength={200}
                    />
                    <p className="numChars" style={{
                        display: uploadInstructions.length > 0 && selectedBatch ? "block" : "none"
                    }}>
                        <span style={{color: uploadInstructions.length === 200 ? "red" : "#555"}}>
                            Characters: {uploadInstructions.length} / 200
                        </span>
                    </p>
                </div>

                {/* Buttons */}
                <div className="uploadButton">
                    <button
                        className="closeUploadModal"
                        onClick={() => {
                            setUploadInstructions("");
                            setSelectedBatch(null);
                            setSearchQuery("");
                            setSortByType(false);
                            close();
                        }}
                    >
                        {selectedBatch ? "Cancel" : "Close"}
                    </button>

                    {selectedBatch && (
                        <button 
                            className="closeUploadModal"
                            onClick={()=>{
                                handleUpload();
                                setUploadInstructions("");
                                setSelectedBatch(null);
                                close();
                            }}
                        >
                            Upload
                        </button>
                    )}
                </div>
            </div>
        </div>
        </>
    );
}