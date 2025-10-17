import React, { useState, useRef } from "react";
import "./uploadModal.css";

export default function UploadModal({ isOpen, close }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  return (
    <div
      className="uploadModalOverlay"
      style={{ display: isOpen ? "flex" : "none" }}
    >
      <div className="uploadModalContent">
        <h1 className='uploadFileText'>Upload File</h1>

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
          <p>
            {selectedFile
              ? selectedFile.name
              : "Drag & Drop your file here or click to select"}
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>

        <button className="closeUploadModal" onClick={close}>
          Close
        </button>
      </div>
    </div>
  );
}
