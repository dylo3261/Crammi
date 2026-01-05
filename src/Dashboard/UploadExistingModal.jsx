import React, { useState, useEffect, useRef } from "react";
import "./uploadModal.css"; // Reuse the same CSS file

export default function UploadExistingModal({isOpen, close, activeTab}){
    const modalRef = useRef(null);
    const [uploadInstructions, setUploadInstructions] = useState("");

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
                        <span><span className="asterik">*</span> Select files from your library</span>
                    </h4>
                </div>

                {/* File List Header */}
                <div className="fileListHeader">
                    <span className="fileNameHeader">Name</span>
                    <span className="fileSizeHeader">Type</span>
                    <span className="removeHeader"></span>
                </div>
                <div className="bottomHeader"></div>
{/* 
                <div className="fileSelection">
                {batches.length > 0 && (
                    <ul className="fileList">
                        {selectedFiles.map((batch, i) => (
                        <li key={i}>
                            <span className="batchName">{file.name}</span>
                            <span className="chosenFileSize">
                            <span className="colorizeFileSize">{batch.type}</span>
                            </span>
                        </li>
                        ))}
                    </ul>
                    )}
                </div> */}

                <div className="bottomHeader"></div>

                {/* Upload Instructions */}
                <div className="specialInstructionsCharacters">
                    <textarea
                        className="specialInstructions"
                        placeholder="Upload Instructions..."
                        value={uploadInstructions}
                        onChange={(e) => setUploadInstructions(e.target.value)}
                        rows={2}
                        maxLength={200}
                        style={{ resize: "none" }}
                    />
                    {uploadInstructions.length > 0 && (
                        <p className="numChars">
                            <span style={{color: uploadInstructions.length === 200 ? "red" : "#555"}}>
                                Characters: {uploadInstructions.length} / 200
                            </span>
                        </p>
                    )}
                </div>

                {/* Buttons */}
                <div className="uploadButton">
                    <button
                        className="closeUploadModal"
                        onClick={() => {
                            setUploadInstructions("");
                            close();
                        }}
                    >
                        Cancel
                    </button>

                    <button 
                        className="closeUploadModal"
                        onClick={() => {
                            // Handle upload logic here
                            console.log("Upload instructions:", uploadInstructions);
                            setUploadInstructions("");
                            close();
                        }}
                    >
                        Upload
                    </button>
                </div>
            </div>
        </div>
    );
}