import React, { useState, useEffect, useRef } from "react";
import "./uploadModal.css";

export default function UploadExistingModal({isOpen, close, activeTab, batches}){
    const modalRef = useRef(null);
    const [uploadInstructions, setUploadInstructions] = useState("");
    const [selectedBatch, setSelectedBatch] = useState(null);
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

    const toggleBatchSelection = (batchID) => {
        setSelectedBatch(prev => prev === batchID ? null : batchID);
    };

    const handleUpload = async () => {
        if (!selectedBatch) return;

        console.log('Selected batch:', selectedBatch);
        console.log('Upload instructions:', uploadInstructions);
        
        // TODO: Add your API call here to link/copy this batch

        setUploadInstructions("");
        setSelectedBatch(null);
        close();
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
                                    onClick={() => toggleBatchSelection(batch.batchID)}
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
                            onClick={handleUpload}
                        >
                            Upload
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}