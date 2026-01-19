import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import { fetchAuthSession } from 'aws-amplify/auth';
import LimitReached from "./limitReached";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
import "./uploadModal.css";
import StudyLoader from "./StudyLoader";

export default function UploadModal({ isOpen, close, activeTab, userProfile, setUserProfile, setIsLimitReached, setLimitReachedMessage}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [pickPages, setPickPages] = useState(false);
  const [isWarning, setWarning] = useState(false);
  const [isWarning2, setWarning2] = useState(false);
  const [isWarning3, setWarning3] = useState(false);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [allPdfPages, setAllPdfPages] = useState([]); // Store ALL pages
  const [selectedPages, setSelectedPages] = useState([]);
  const [numSelectedPages, setnNumSelectedPages] = useState(0);
  const [specialInstructions, setSpecialInstructions] = useState(""); 
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesPerView] = useState(10);

  // Calculate current page slice
  const totalPages = Math.ceil(allPdfPages.length / pagesPerView);
  const startIndex = (currentPage - 1) * pagesPerView;
  const endIndex = startIndex + pagesPerView;
  const currentPdfPages = allPdfPages.slice(startIndex, endIndex);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        close();
        clearPDF(); 
        setnNumSelectedPages(0);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, close]);

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

  const handleUploadSign = async (selectedFiles, activeTab) => {
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
          batchType: activeTab
        };
        
   
        
        const response = await fetch('https://ul9ffsljla.execute-api.us-west-2.amazonaws.com/prod/sign', {
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
        triggerWorkerLambda(batchID, activeTab, token);
        
        return results;
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  }

  const triggerWorkerLambda = async (batchID, activeTab, token) => {
    const batchInfo = {
      requestedCram: activeTab,
      batch_ID: batchID,
      special_instructions: specialInstructions
    }
   

    const response = await fetch('https://ul9ffsljla.execute-api.us-west-2.amazonaws.com/prod/get-json', {
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

  const maxNumFiles = userProfile?.accountTier === 'pro' ? 50 : userProfile?.accountTier === 'plus' ? 20 : 5;
  const maxFileSize = userProfile?.accountTier === 'pro' ? 125 * 1024 * 1024 : userProfile?.accountTier === 'plus' ? 50 * 1024 * 1024 : 20 * 1024 * 1024;

  const [fileSizeRemaining, changeFileSizeRemaining] = useState(maxFileSize);
  const [remainingFiles, setRemainingFiles] = useState(maxNumFiles);
  const fileInputRef = useRef(null);

  useEffect(() => { 
    if (isOpen && userProfile) {
      const maxFiles = userProfile.accountTier === 'pro' ? 50 : userProfile?.accountTier === 'plus' ? 20 : 5;
      const maxSize = userProfile.accountTier === 'pro' ? 125 * 1024 * 1024 : userProfile?.accountTier === 'plus' ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
      
      setRemainingFiles(maxFiles);
      changeFileSizeRemaining(maxSize);

      setSelectedFiles([]);
      clearPDF();
    }
  }, [isOpen, userProfile]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = -parseInt(document.body.style.top || '0', 10);
      document.body.style.position = '';
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    }
  
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
    };
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

  const renderPage = async (pageObj, displayIndex) => {
    if (pageObj.src) return;
  
    try {
      const page = await pageObj.pdf.getPage(pageObj.pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
    
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
    
      await page.render({
        canvasContext: canvas.getContext("2d"),
        viewport
      }).promise;
    
      setAllPdfPages(prev => {
        const updated = [...prev];
        const actualIndex = startIndex + displayIndex;
        updated[actualIndex] = { ...updated[actualIndex], src: canvas.toDataURL() };
        return updated;
      });
    } catch(error) {
      console.error(`Failed to render page ${pageObj.pageNumber}:`, error);
      alert(`Failed to render page ${pageObj.pageNumber} of ${pageObj.name}`);
      setAllPdfPages(prev => {
        const updated = [...prev];
        const actualIndex = startIndex + displayIndex;
        updated[actualIndex] = { ...updated[actualIndex], src: "error" };
        return updated;
      });
    }
  };

  const togglePage = (displayIndex) => {
    const actualIndex = startIndex + displayIndex;
    setSelectedPages((prev) =>
      prev.includes(actualIndex)
        ? prev.filter((i) => i !== actualIndex)
        : [...prev, actualIndex]
    );
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragOver(false); };

  const clearPDF = () => {
    const thumbs = document.querySelectorAll('.lazyThumb');
    thumbs.forEach(thumb => {
      if (thumb._observer) {
        thumb._observer.disconnect();
        delete thumb._observer;
      }
    });

    const uniquePdfs = new Set();
    allPdfPages.forEach(page => {
      if (page.pdf && !uniquePdfs.has(page.pdf)) {
        uniquePdfs.add(page.pdf);
        page.pdf.destroy();
      }
    });

    setAllPdfPages([]);
    setPdfFiles([]);
    setPickPages(false);
    setSelectedPages([]);
    setCurrentPage(1);
  };

  const processFiles = (files) => {
    const unsupported = files.some(
      f => !f.type.startsWith("image/") && f.type !== "application/pdf"
    );
  
    if (unsupported) {
      setWarning(true);
      return;
    }
    let curRemainingFiles = remainingFiles;

    const newSelectedFiles = files.filter((f) => f.type.startsWith("image/"));
    if (newSelectedFiles.length > 0 && curRemainingFiles - newSelectedFiles.length >= 0) {
      let PDFExceededFileSize = false;
      let curRemaining = fileSizeRemaining;
      let usedFileSize = 0;
      for (const f of newSelectedFiles) {
        curRemaining -= f.size;
        usedFileSize += f.size;
  
        if (curRemaining < 0) {
          PDFExceededFileSize = true;
          break;
        }
      }

      if (PDFExceededFileSize) {
        setSelectedFiles((prev) => prev);
        setRemainingFiles((prev) => prev);
        setWarning(false);
        setWarning2(true);
        setWarning3(false);
      } else {
        changeFileSizeRemaining(prev => prev - usedFileSize);
        setSelectedFiles((prev) => [...prev, ...newSelectedFiles]);
        setRemainingFiles((prev) => prev - newSelectedFiles.length);
        setWarning(false);
        setWarning2(false);
        setWarning3(false);
      }
    } else {
      setWarning(false);
      setWarning2(false);
      setWarning3(true);
    }
  
    const newPDFs = files.filter((f) => f.type === "application/pdf");
    if (newPDFs.length > 0) {
      clearPDF();
      setWarning(false);
      setWarning2(false);
      setWarning3(false);
      setPdfFiles(newPDFs);
      setPickPages(true);
    }
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

  const openFileDialog = () => fileInputRef.current.click();

  const clearFiles = () => {
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    changeFileSizeRemaining(prev => prev + totalSize);
    setRemainingFiles(prev => prev + selectedFiles.length);

    setSelectedFiles([]);
    clearPDF();
  };

  const removeFile = (index) => {
    const removedFile = selectedFiles[index];
    changeFileSizeRemaining(prev => prev + removedFile.size);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setSelectedPages([]);
    setRemainingFiles((prev) => prev + 1);
  };

  useEffect(() => {
    if (pdfFiles.length === 0) {
      setAllPdfPages([]);
      return;
    }

    const loadPDF = async () => {
      try {
        const placeholders = [];

        for (let pdfFile of pdfFiles) {
          const arrayBuffer = await pdfFile.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

          for (let i = 1; i <= pdf.numPages; i++) {
            placeholders.push({
              name: pdfFile.name,
              pageNumber: i,
              pdf,
              src: null
            });
          }
        }

        setAllPdfPages(placeholders);
        setCurrentPage(1);
      } catch(error) {
        console.error('Failed to load PDF:', error);
        alert('Failed to load PDF. The file may be corrupted.');
        setPdfFiles([]);
        setPickPages(false);
      }
    };

    loadPDF();
  }, [pdfFiles]);

  const addSelectedPagesToFiles = () => {
    const newFiles = selectedPages.map((index) => {
      const page = allPdfPages[index];
      const arr = page.src.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      return new File([u8arr], `${page.name}-page${page.pageNumber}.png`, { type: mime });
    });
    
    if (remainingFiles - newFiles.length >= 0) {
      let PDFExceededFileSize = false;
      let curRemaining = fileSizeRemaining;
      let usedFileSize = 0;
      for (const f of newFiles) {
        curRemaining -= f.size;
        usedFileSize += f.size;

        if (curRemaining < 0) {
          PDFExceededFileSize = true;
          break;
        }
      }

      if (PDFExceededFileSize) {
        setWarning2(true);
        setSelectedFiles(prev => prev);
        setRemainingFiles(prev => prev);
      } else {
        changeFileSizeRemaining(prev => prev - usedFileSize);
        setSelectedFiles((prev) => [...prev, ...newFiles]);
        setRemainingFiles((prev) => prev - newFiles.length);
      }
    } else {
      setWarning3(true);
    }
    clearPDF();
    setnNumSelectedPages(0);
  };

  return (
    <>
      <div
        className="uploadModalOverlay"
        style={{ display: isOpen ? "flex" : "none" }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="uploadModalContent">
          <div className="uploadFileHeader">
            <h1 className="uploadFileText">
              Upload Files
              <div className="tooltipWrapper">
                <img
                  className="infoIcon"
                  src="/infoIcon.png"
                  alt="info about remaining files"
                />
                <span className="tooltipBox">
                  *Your account plan limits the number of files <br /> you can upload in a single batch.
                </span>
              </div>
            </h1>
            
            <h4 className="filesRemaining">
              <span><span className="asterik"> * </span>Files Remaining: {remainingFiles}</span>
            </h4>
          </div>

          <div className="addAnotherFile" style={{ display: selectedFiles.length > 0 ? "flex" : "none" }}>
            <p>
              Add files via Drag & Drop or{" "}
              <span>
                <button className="addFileButton" onClick={openFileDialog}>
                  Browse Files
                </button>
              </span>
            </p>
          </div>

          <div className="specialInstructionsCharacters">
            <textarea
              style={{
                display: (selectedFiles.length > 0) && isMobile ? "flex" : "none",
                resize: "none",
              }}
              className="specialInstructions"
              placeholder="Special Instructions..."
              value={specialInstructions}
              onChange={(e) => {
                setSpecialInstructions(e.target.value);
              }}
              rows={2}
              maxLength={200}
            />
            <p className="numChars" style={{display: (specialInstructions.length > 0 && selectedFiles.length > 0) && isMobile ? "block" : "none"}}>
              <span style={{color: specialInstructions.length === 200 ? "red" : "#555"}}>Characters: {specialInstructions.length} / 200</span>
            </p>
          </div>
      
          <p className="warning" style={{ display: isWarning ? "block" : "none" }}>
            Please make sure to upload either photos or PDFs.
          </p> 
          <p className="warning" style={{ display: isWarning2 ? "block" : "none" }}>
            Batch file size limit exceeded. You can Upload up to {maxFileSize / (1024 * 1024)} MBs.
          </p> 
          <p className="warning" style={{ display: isWarning3 ? "block" : "none" }}>
            File upload limit reached. You can only upload up to {maxNumFiles} files.
          </p> 

          <div className="fileListHeader" style={{ display: selectedFiles.length > 0 ? "flex" : "none" }}>
            <span className="fileNameHeader">Name</span>
            <span className="fileSizeHeader">Size</span>
            <span className="removeHeader"></span>
          </div>
          <div className="bottomHeader" style={{ display: selectedFiles.length > 0 ? "flex" : "none" }}></div>

          <div
            className={`uploadDropZone ${dragOver ? "dragOver" : ""}`}
            style={{ display: selectedFiles.length === 0 ? "flex" : "none" }}
            onClick={openFileDialog}
          >
            <img
              className="uploadModalIcon"
              src="/uploadIcon.png"
              alt="Upload Icon"
            />
            <p className="uploadBoxDescription">Drag & drop or click to upload</p>
            <p className="fileTypeSpecify">PDF & Image file types</p>
          </div>
          
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        
          {selectedFiles.length > 0 && (
            <ul className="fileList">
              {selectedFiles.map((file, i) => (
                <li key={i}>
                  <span className="fileName">{file.name}</span>
                  <span className="chosenFileSize">
                    {formatFileSize(file.size)}
                    <span className="colorizeFileSize">{formatFileSizeDecoration(file.size)}</span>
                  </span>
                  <span
                    className="removeFile"
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

          <div className="bottomHeader" style={{ display: selectedFiles.length > 0 ? "flex" : "none" }}></div>
        
          <div className="specialInstructionsCharacters">
            <textarea
              style={{
                display: (selectedFiles.length > 0) && !isMobile ? "flex" : "none",
                resize: "none",
              }}
              className="specialInstructions"
              placeholder="Special Instructions..."
              value={specialInstructions}
              onChange={(e) => {
                setSpecialInstructions(e.target.value);
              }}
              rows={2}
              maxLength={200}
            />
            <p className="numChars" style={{display: (specialInstructions.length > 0 && selectedFiles.length > 0) && !isMobile ? "block" : "none"}}>
              <span style={{color: specialInstructions.length === 200 ? "red" : "#555"}}>Characters: {specialInstructions.length} / 200</span>
            </p>
          </div>

          <div className="uploadButton">
            <button
              className="closeUploadModal"
              onClick={() => {
                setWarning(false);
                setWarning2(false);
                setWarning3(false);
                changeFileSizeRemaining(maxFileSize); 
                setRemainingFiles(maxNumFiles);
                close();
                clearFiles();
                setSpecialInstructions("");
              }}
            >
              {selectedFiles.length > 0 ? "Cancel" : "Close"}
            </button>

            {selectedFiles.length > 0 && (
              <button className="closeUploadModal" onClick={() => {
                handleUploadSign(selectedFiles, activeTab);
                close();
                clearFiles();
                setIsUploadingPhotos(true);
                setSpecialInstructions("");
                setWarning(false);
                setWarning2(false);
                setWarning3(false);
                changeFileSizeRemaining(maxFileSize); 
                setRemainingFiles(maxNumFiles);
              }}>
                Upload
              </button>
            )}
          </div>
        </div>
      </div>

      <div className='uploadModalOverlay' style={{display: isUploadingPhotos ? 'flex' : 'none'}}>
        <StudyLoader/>
      </div>

      {/* PDF PAGE GRID MODAL WITH PAGINATION */}
      <div style={{ display: pickPages ? "flex" : "none" }} className="selectPDFPages">
        <div className="PDFOverallHeader">
          <h1 className="selectPageHeader">Select PDF Pages</h1>
          
          <h4 className="ok">
            <span className="asterik">* </span>Files Remaining: {remainingFiles}
          </h4>
          <h4>
            <span className="asterik">* </span>Files Selected: {numSelectedPages}
          </h4>
        </div>
    
        <div className="pdfGrid">
          {currentPdfPages.map((page, i) => {
            const actualIndex = startIndex + i;
            return (
              <div
                key={actualIndex}
                className={`pdfPageContainer ${selectedPages.includes(actualIndex) ? "selected" : ""}`}
                onClick={() => {
                  togglePage(i);
                  setnNumSelectedPages(prev =>
                    selectedPages.includes(actualIndex) ? prev - 1 : prev + 1
                  );
                }}
              >
                <div className="pdfPageLabel">
                  {page.name} - Page {page.pageNumber}
                </div>
                <div
                  className="lazyThumb"
                  data-index={actualIndex}
                  ref={(el) => {
                    if (!el) return;

                    const observer = new IntersectionObserver(
                      (entries) => {
                        entries.forEach(entry => {
                          if (entry.isIntersecting) {
                            renderPage(currentPdfPages[i], i);
                            observer.disconnect();
                          }
                        });
                      },
                      { rootMargin: "200px" }
                    );

                    observer.observe(el);
                    el._observer = observer;
                  }}
                >
                  {page.src === "error" ? (
                    <div className="pdfPlaceholder" style={{ color: "red" }}>
                      Failed to load
                    </div>
                  ) : page.src ? (
                    <img src={page.src} alt={`${page.name} - Page ${page.pageNumber}`} />
                  ) : (
                    <div className="pdfPlaceholder">Loading…</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Pagination Controls */}
        <div className="paginationControls">
          <button 
            className="paginationButton"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <span className="paginationInfo">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>
          
          <button 
            className="paginationButton"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>

        {/* Action Buttons */}
        <div className="selectButtonsContainer">
          <button className="selectButtons" onClick={() => { clearPDF(); setnNumSelectedPages(0); }}>
            Close
          </button>
          
          <button
            className="selectButtons"
            style={{ display: selectedPages.length > 0 ? "flex" : "none" }}
            onClick={() => {
              addSelectedPagesToFiles();
              setnNumSelectedPages(0);
            }}
          >
            Select Pages
          </button>
        </div>
      </div>
    </>
  );
}