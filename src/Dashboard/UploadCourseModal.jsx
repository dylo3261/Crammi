import React, { useState, useEffect, useRef } from "react";
import "./UploadCourseModal.css";
import CourseModeDenied from "./courseModeDenied";
import { useNavigate } from 'react-router-dom';
import { fetchAuthSession } from "aws-amplify/auth";
import StudyLoader from "./StudyLoader";


export default function UploadCourseModal({ isOpen, close, userProfile,setIsLimitReached,setLimitReachedMessage }) {
  const MAX_PAGES = 1500;
  const MAX_BATCH_SIZE = 100 * 1024 * 1024; // 100MB
  const MAX_SINGLE_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const MAX_PAGES_PER_FILE = 1000;

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [remainingPages, setRemainingPages] = useState(MAX_PAGES);
  const [totalBatchSize, setTotalBatchSize] = useState(0);
  const [processingFile, setProcessingFile] = useState(null);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const fileInputRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const pdfjsLib = useRef(null);
  const navigate = useNavigate();


  const handleUploadS3 = async (selectedFiles, uploads) => {
    const uploadResults = [];
    const fileKeys = Object.keys(uploads);
    for (let i = 0; i < fileKeys.length; i++) {
      const curFileKey = fileKeys[i];
      const curUploadInfo = uploads[curFileKey];
      const file = selectedFiles[i];
      try {
        const formData = new FormData();
        
        Object.keys(curUploadInfo.fields).forEach(key => {
          formData.append(key, curUploadInfo.fields[key]);
        });

        formData.append('Content-Type', file.type);
        formData.append('file', file);

        const response = await fetch(curUploadInfo.url, {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const uploadedFileUrl = `${curUploadInfo.url}${curUploadInfo.fields.key}`;
          console.log(`${curFileKey} uploaded successfully: ${uploadedFileUrl}`);
          
          uploadResults.push({
            fileKey: curFileKey,
            fileName: file.name,
            success: true,
            url: uploadedFileUrl,
          });
        } else {
          const errorText = await response.text();
          console.error(`${curFileKey} upload failed:`, errorText);
          
          uploadResults.push({
            fileKey: curFileKey, 
            fileName: file.name,
            success: false,
            error: errorText,
          });
        }
      } catch (error) {
        console.error(`Error uploading ${curFileKey}:`, error);
        uploadResults.push({
          fileKey: curFileKey, 
          fileName: file.name,
          success: false,
          error: error.message,
        });
      }
    }
    setIsUploadingPhotos(false);
    return uploadResults;
  }

  const handleUploadSign = async (selectedFiles) => {
    if (selectedFiles.length > 0) {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        
        if (!token) {
          console.error('No authentication token available');
          return;
        }
        
        const signPayload = {
          files: selectedFiles.map(file => ({
            name: file.name,
            size: file.size,
          })),
        };
        
    
        
        const response = await fetch('https://ul9ffsljla.execute-api.us-west-2.amazonaws.com/prod/pdf-sign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`  
          },
          body: JSON.stringify(signPayload)
        });
        
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Upload failed:', errorData);
          setIsUploadingPhotos(false);
          setIsLimitReached(true);
          setLimitReachedMessage(errorData.error);
          return;
        }
        
        const data = await response.json();
        
        const { batchID, uploads } = data;
        

        window.dispatchEvent(new Event('batchUploaded'));

        const results = await handleUploadS3(selectedFiles, uploads);
        const allSucceeded = results.every(r => r.success);
        
        if (allSucceeded) {
          console.log('All files uploaded successfully!');          
        } else {
          console.error('Some uploads failed:', results.filter(r => !r.success));
        }
        triggerWorkerLambda(batchID, token);
        
        return results;
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  }

  const triggerWorkerLambda = async (batchID, token) => {
    const batchInfo = {
      batch_ID: batchID,
    }
    

    const response = await fetch('https://ul9ffsljla.execute-api.us-west-2.amazonaws.com/prod/get-pdf-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`  
      },
      body: JSON.stringify(batchInfo)
    });

        
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Worker Lambda Trigger Failed:', errorData);
      return;
    }
  }



  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load PDF.js library
  useEffect(() => {
    const loadPdfJs = async () => {
      if (!pdfjsLib.current) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        
        script.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          pdfjsLib.current = window.pdfjsLib;
        };
        
        document.head.appendChild(script);
      }
    };

    loadPdfJs();
  }, []);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setRemainingPages(MAX_PAGES);
      setTotalBatchSize(0);
      setSelectedFiles([]);
      setWarningMessage("");
      setProcessingFile(null);
    }
  }, [isOpen]);

  const formatFileSize = (size) => {
    if (size < 1024) return size;
    else if (size < 1024 * 1024) return (size / 1024).toFixed(1);
    else return (size / (1024 * 1024)).toFixed(1);
  };

  const formatFileSizeDecoration = (size) => {
    if (size < 1024) return " B";
    else if (size < 1024 * 1024) return " KB";
    else return " MB";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Extract page count from PDF using PDF.js
  const extractPageCount = async (file) => {
    if (!pdfjsLib.current) {
      // Fallback estimation if PDF.js not loaded
      return Math.ceil(file.size / 102400);
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.current.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const pageCount = pdf.numPages;
      
      // Clean up
      await pdf.destroy();
      
      return pageCount;
    } catch (error) {
      console.error('Error extracting page count:', error);
      // Fallback estimation
      return Math.ceil(file.size / 102400);
    }
  };

  const processFiles = async (files) => {
    // Check if files are PDFs
    const unsupported = files.some(f => f.type !== "application/pdf");
    if (unsupported) {
      setWarningMessage("Please upload PDF files only.");
      return;
    }

    // Check individual file size (50MB max)
    const oversizedFile = files.find(f => f.size > MAX_SINGLE_FILE_SIZE);
    if (oversizedFile) {
      setWarningMessage(`File "${oversizedFile.name}" exceeds 50MB limit. Each PDF must be under 50MB.`);
      return;
    }

    // Check total batch size (100MB max)
    const newBatchSize = totalBatchSize + files.reduce((sum, f) => sum + f.size, 0);
    if (newBatchSize > MAX_BATCH_SIZE) {
      setWarningMessage(`Total batch size would exceed 100MB limit. Current: ${(totalBatchSize / (1024 * 1024)).toFixed(1)}MB, Available: ${((MAX_BATCH_SIZE - totalBatchSize) / (1024 * 1024)).toFixed(1)}MB`);
      return;
    }

    // Extract page counts and validate
    const filesWithPages = [];
    let totalNewPages = 0;

    for (const file of files) {
      setProcessingFile(file.name);
      const pageCount = await extractPageCount(file);
      
      // Check individual file page limit (1000 pages max)
      if (pageCount > MAX_PAGES_PER_FILE) {
        setWarningMessage(`File "${file.name}" has ${pageCount} pages, exceeding the 1000 page limit per PDF.`);
        setProcessingFile(null);
        return;
      }

      filesWithPages.push({ file, pageCount });
      totalNewPages += pageCount;
    }

    setProcessingFile(null);

    // Check total page limit (1500 pages max)
    if (totalNewPages > remainingPages) {
      setWarningMessage(`Adding these files would exceed the 1500 page limit. Pages to add: ${totalNewPages}, Remaining: ${remainingPages}`);
      return;
    }

    // All validations passed - add the files
    setSelectedFiles(prev => [...prev, ...filesWithPages]);
    setRemainingPages(prev => prev - totalNewPages);
    setTotalBatchSize(newBatchSize);
    setWarningMessage("");
  };

  const handleFileSelect = (e) => {
    processFiles(Array.from(e.target.files));
    e.target.value = null;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const openFileDialog = () => fileInputRef.current?.click();

  const removeFile = (index) => {
    const removed = selectedFiles[index];
    setRemainingPages(prev => prev + removed.pageCount);
    setTotalBatchSize(prev => prev - removed.file.size);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    const totalPages = selectedFiles.reduce((sum, item) => sum + item.pageCount, 0);
    const totalSize = selectedFiles.reduce((sum, item) => sum + item.file.size, 0);
    setRemainingPages(prev => prev + totalPages);
    setTotalBatchSize(prev => prev - totalSize);
    setSelectedFiles([]);
  };

  const handleClose = async () => {
    setWarningMessage("");
    setRemainingPages(MAX_PAGES);
    setTotalBatchSize(0);
    setSelectedFiles([]);
    setProcessingFile(null);
    close();
  };

  const handleUploadClick = async () => {
    if (selectedFiles.length > 0 && userProfile.accountTier === 'pro') {
      // Show loading screen and close modal immediately
      setIsUploadingPhotos(true);
      handleClose();
      
      // Fire and forget the upload
      handleUploadSign(selectedFiles.map(item => item.file))
        .catch((error) => {
          console.error("Upload failed:", error);
          setIsUploadingPhotos(false); // Hide loading on error
        });
    }
  };
  
  return (
    <>
    <div className='uploadModalOverlay' style={{display: isUploadingPhotos ? 'flex' : 'none'}}>
          <StudyLoader/>
        </div>
         {/* Show denied popup directly if not pro, skip the upload modal entirely */}
    {isOpen && userProfile.accountTier !== 'pro' ? (
      <CourseModeDenied
        isOpen={true}
        onClose={close}
        onUpgrade={() => {
          close();
          navigate('/upgrade');
        }}
      />
    ) : (
    <div
      className="course-modal-overlay"
      style={{ display: isOpen ? "flex" : "none" }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
    
      <div className="course-modal-content">
        <div className="course-premium-badge">PRO</div>
        
        <div className="course-file-header">
          <h1 className="course-file-text">
            Upload PDFs
          </h1>
     
          <h4 className="course-files-remaining">
            <span><span className="course-asterisk">★</span> Pages Remaining: {remainingPages} / {MAX_PAGES}</span>
          </h4>
          
          </div>

        {processingFile && (
          <p className="course-warning-process" style={{ display: "block", color: "#666" }}>
            Processing "{processingFile}"...
          </p>
        )}

        <div className="course-add-another-file" style={{ display: selectedFiles.length > 0 ? "flex" : "none" }}>
          <p>
            Add PDFs via Drag & Drop or{" "}
            <span>
              <button className="course-add-file-button" onClick={openFileDialog}>
                Browse Files
              </button>
            </span>
          </p>
        </div>

        <p className="course-warning" style={{ display: warningMessage ? "block" : "none" }}>
          {warningMessage}
        </p>

        <div className="course-file-list-header" style={{ display: selectedFiles.length > 0 ? "flex" : "none" }}>
          <span className="course-file-name-header">Name</span>
          <span className="course-file-size-header">Pages</span>
          <span className="course-file-size-header">Size</span>
          <span></span>
        </div>

        <div className="course-bottom-header" style={{ display: selectedFiles.length > 0 ? "flex" : "none" }}></div>
        
        <div
          className={`course-upload-drop-zone ${dragOver ? "course-drag-over" : ""}`}
          style={{ display: selectedFiles.length === 0 ? "flex" : "none" }}
          onClick={openFileDialog}
        >
          <img
            className="course-upload-modal-icon"
            src="/uploadIcon.png"
            alt="Upload Icon"
          />
          <p className="uploadBoxDescription">Drag & drop or click to upload</p>
          <p className="course-file-type-specify">
            PDF files only • Max 50MB per file • Max 1000 pages per file
            <br />
            Total: 1500 pages • 100MB batch limit
          </p>
        </div>
        
        <input
          type="file"
          multiple
          accept="application/pdf,.pdf"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      
        {selectedFiles.length > 0 && (
          <ul className="course-file-list">
            {selectedFiles.map((item, i) => (
              <li key={i}>
                <span className="course-file-name">{item.file.name}</span>
                <span className="course-chosen-file-size">
                  {item.pageCount} pages
                </span>
                <span className="course-chosen-file-size">
                  {formatFileSize(item.file.size)}
                  <span className="course-colorize-file-size">{formatFileSizeDecoration(item.file.size)}</span>
                </span>
                <span
                  className="course-remove-file"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                >
                  ×
                </span>
              </li>
            ))}
          </ul>
        )}


        <div className="course-upload-button">
          <button
            className="course-close-upload-modal"
            onClick={handleClose}
          >
            {selectedFiles.length > 0 ? "Cancel" : "Close"}
          </button>

          {selectedFiles.length > 0 && (
            <button 
              className="course-close-upload-modal" 
              onClick={handleUploadClick}
            >
              Upload
            </button>
          )}
        </div>
      </div>
      
    </div>
    )}
    </>
  );
}