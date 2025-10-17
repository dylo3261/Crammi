import React, { useState, useRef } from "react";
import "./uploadModal.css";

export default function UploadModal({ isOpen, close }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const fileInputRef = useRef(null);

  const maxImages = 10;

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const showError = (msg) => {
    setErrorMessage("");
    setTimeout(() => {
      setErrorMessage(msg);
      setErrorKey((prev) => prev + 1);
    }, 10);
  };

  const processFiles = (files) => {
    setErrorMessage(""); // clear previous errors

    setSelectedFiles((prevFiles) => {
      const newFiles = [];

      // Determine existing types
      const hasPDF = prevFiles.some((f) => f.type === "application/pdf");
      const hasImages = prevFiles.some((f) => f.type.startsWith("image/"));
      let newImagesCount = 0;
      let batchHasPDF = files.some((f) => f.type === "application/pdf");
      let batchHasImages = files.some((f) => f.type.startsWith("image/"));

      // Reject entire batch if mixing PDF and images
      if ((batchHasPDF && batchHasImages) || (hasPDF && batchHasImages) || (hasImages && batchHasPDF)) {
        showError("Cannot mix PDFs with images. No files were added.");
        return prevFiles;
      }

      for (let file of files) {
        // Only allow PDF or image
        if (!(file.type.startsWith("image/") || file.type === "application/pdf")) {
          showError("Only PDF or image files are allowed.");
          return prevFiles;
        }

        // Only one PDF allowed
        if (file.type === "application/pdf" && hasPDF) {
          showError("Only one PDF can be uploaded.");
          return prevFiles;
        }

        // Check max images
        if (file.type.startsWith("image/")) {
          newImagesCount++;
          if (prevFiles.filter((f) => f.type.startsWith("image/")).length + newImagesCount > maxImages) {
            showError("You can only upload up to 10 images.");
            return prevFiles;
          }
        }

        newFiles.push(file);
      }

      return [...prevFiles, ...newFiles];
    });
  };

  const handleFileSelect = (e) => {
    processFiles(Array.from(e.target.files));
    e.target.value = null; // reset input so same files can be re-added
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const openFileDialog = () => fileInputRef.current.click();

  const clearFiles = () => {
    setSelectedFiles([]);
    setErrorMessage("");
  };

  const removeFile = (name) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((f) => f.name !== name));
  };

  const remainingFiles =
    maxImages - selectedFiles.filter((f) => f.type.startsWith("image/")).length;

  return (
    <div
      className="uploadModalOverlay"
      style={{ display: isOpen ? "flex" : "none" }}
    >
      <div className="uploadModalContent">
        <div className="uploadFileHeader">
          <h1 className="uploadFileText">Upload Files</h1>
          <h3 className="filesRemaining">
            {selectedFiles.some((f) => f.type.startsWith("image/")) && (
              <>
                Files Remaining:{" "}
                <span className="filesRemainingNumber">{remainingFiles}</span>
              </>
            )}
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
          <p className='uploadBoxDescription'>Drag and drop or click to upload</p>

          {selectedFiles.length > 0 ? (
            <ul className="fileList">
              {selectedFiles.map((file, index) => (
                <li key={index}>
                  {file.name}
                  <span
                    className="removeFile"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.name);
                    }}
                  >
                    ×
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p></p>
          )}

          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>

        {errorMessage && (
          <p key={errorKey} className="duplicateWarning">
            {errorMessage}
          </p>
        )}

        <div className="uploadButton">
          <button
            className="closeUploadModal"
            onClick={() => {
              close();
              clearFiles();
            }}
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
