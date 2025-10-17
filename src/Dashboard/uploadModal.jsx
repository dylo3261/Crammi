import React, { useState, useRef } from "react";
import "./uploadModal.css";

export default function UploadModal({ isOpen, close }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [warningKey, setWarningKey] = useState(0);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragOver(false); };

  const showDuplicateWarning = (name) => {
    setDuplicateWarning("");
    setTimeout(() => {
      setDuplicateWarning(`Duplicate file ignored: ${name}`);
      setWarningKey(prev => prev + 1);
    }, 10);
  };

  const processFiles = (files) => {
    const existingNames = new Set(selectedFiles.map(f => f.name));
    const newFiles = [];
    const maxFiles = 10;

    for (let file of files) {
      if (selectedFiles.length + newFiles.length >= maxFiles) {
        alert("You can only upload up to 10 files total.");
        // clearFiles();
        return;
      }

      if (!existingNames.has(file.name)) {
        if (file.type.startsWith("image/") || file.type === "application/pdf") {
          newFiles.push(file);
        } else {
          alert("Only PDF or image files are allowed.");
        }
      } else {
        showDuplicateWarning(file.name);
      }
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e) => {
    processFiles(Array.from(e.target.files));
  };

  const openFileDialog = () => fileInputRef.current.click();
  const clearFiles = () => {
    setSelectedFiles([]);
    setDuplicateWarning("");
  };

  const remainingFiles = 10 - selectedFiles.length;

  return (
    <div className="uploadModalOverlay" style={{ display: isOpen ? "flex" : "none" }}>
      <div className="uploadModalContent">
        <div className="uploadFileHeader">
          <h1 className="uploadFileText">Upload Files</h1>
          <h3 className="filesRemaining">
            Files Remaining: <span className="filesRemainingNumber">{remainingFiles}</span>
          </h3>
        </div>

        <div
          className={`uploadDropZone ${dragOver ? "dragOver" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <img
            className="uploadModalIcon"
            src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2017/png/iconmonstr-upload-21.png&r=0&g=0&b=0"
            alt="Upload Icon"
          />

          {selectedFiles.length > 0 ? (
            <ul className="fileList">
              {selectedFiles.map((file, index) => <li key={index}>{file.name}</li>)}
            </ul>
          ) : (
            <p>Drag & Drop your files here or click to select</p>
          )}

          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>

        {duplicateWarning && (
          <p key={warningKey} className="duplicateWarning">{duplicateWarning}</p>
        )}

        <div className="uploadButton">
          <button
            className="closeUploadModal"
            onClick={() => { close(); clearFiles(); }}
          >
            {selectedFiles.length > 0 ? "Cancel" : "Close"}
          </button>
          {selectedFiles.length > 0 && (
            <button className="closeUploadModal">Upload</button>
          )}
        </div>
      </div>
    </div>
  );
}
