import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

import "./uploadModal.css";

export default function UploadModal({ isOpen, close }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [pickPages, setPickPages] = useState(false);
  const [isWarning,setWarning]=useState(false);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [pdfPages, setPdfPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [numSelectedPages,setnNumSelectedPages]=useState(0);

  const [remainingFiles,setRemainingFiles]=useState(10);
  const fileInputRef = useRef(null);

  
  //edge case variables
  // let numFilesRemaining=10;

  //file conversion for sizing
  const formatFileSize = (size) => {
    if (size < 1024) return size;
    else if (size < 1024 * 1024) return (size / 1024).toFixed(1) ;
    else return (size / (1024 * 1024)).toFixed(1) ;
  };
  const formatFileSizeDecoration = (size) => {
    if (size < 1024) return" B";
    else if (size < 1024 * 1024) return" KB";
    else return " MB";
  };

  // Toggle page selection
  const togglePage = (index) => {
    setSelectedPages((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  // Drag events
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragOver(false); };

  // Clear only the PDF preview
  const clearPDF = () => {
    setPdfPages([]);
    setPdfFiles([]);
    setPickPages(false);
    setSelectedPages([]);
  };

  // Process uploaded files
  const processFiles = (files) => {
    // Filter non-PDF files
    const newSelectedFiles = files.filter(
      (f) =>{
       
          if(f.type.startsWith("image/")){
            return true;
          }
        // alert("Please make sure to upload either photos or PDFs.");
        if(f.type !== "application/pdf")setWarning(true);
        return false;
    }
    );

    if (newSelectedFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newSelectedFiles]);
      setRemainingFiles((prev) => prev - newSelectedFiles.length);
      setWarning(false);
    }

    // Filter PDFs
    const newPDFs = files.filter((f) => f.type === "application/pdf");
    if (newPDFs.length > 0) {
      clearPDF(); // clear old PDFs before adding new
      setWarning(false);
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

  // Clear all uploaded files
  const clearFiles = () => {
    setSelectedFiles([]);
    clearPDF();
  };

  // Remove single file from list
  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPdfFiles((prev) => prev+1);
    setPdfPages((prev) => prev.filter((_, i) => i !== index));
    setSelectedPages([]);
    setRemainingFiles((prev) => prev + 1);
  };
  

  // Render PDFs to canvases
  useEffect(() => {
    if (pdfFiles.length === 0) {
      setPdfPages([]);
      return;
    }

    const renderPDFs = async () => {
      const allPages = [];
      for (let pdfFile of pdfFiles) {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context, viewport }).promise;
          allPages.push({ src: canvas.toDataURL(), name: pdfFile.name, pageNumber: i });
        }
      }
      setPdfPages(allPages);
    };

    renderPDFs();
  }, [pdfFiles]);

  const addSelectedPagesToFiles = () => {
    const newFiles = selectedPages.map((index) => {
      const page = pdfPages[index];
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

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setRemainingFiles((prev) => prev - newFiles.length);
    setPickPages(false);
    setSelectedPages([]);
  };
  return (
    <>
      {/* UPLOAD MODAL */}
      <div className="uploadModalOverlay" style={{ display: isOpen ? "flex" : "none" }}>
        <div className="uploadModalContent">
          <div className="uploadFileHeader">
            <h1 className="uploadFileText">
              Upload Files
              <div className="tooltipWrapper">
                <img
                  className="infoIcon"
                  src="https://uxwing.com/wp-content/themes/uxwing/download/signs-and-symbols/info-circle-icon.png"
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
        {/* file selection that appears once you uplaod a file */}
            
        
          </div>
          <div className="addAnotherFile " style={{display: selectedFiles.length>0 ? "flex" : "none"}}>
          <p >Add files via Drag & Drop or <span><button className="addFileButton" 
          onClick={openFileDialog} >Browse Files</button></span></p>


          </div>

          <div className="fileGraph" style={{display: selectedFiles.length>0 ? "flex" : "none"}}>
              <p>Name</p> <p className="fileSizeGraph">Size</p>
           </div>
          {/* Drag & Drop Zone */}
          {selectedFiles.length === 0 && (
            <div
              className={`uploadDropZone ${dragOver ? "dragOver" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <p className="warning" style={{ display: isWarning ? "block" : "none" }}>
                Please make sure to upload either photos or PDFs.
              </p>
  
              <img
                className="uploadModalIcon"
                src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2017/png/iconmonstr-upload-21.png&r=0&g=0&b=0"
                alt="Upload Icon"
              />
  
              <p className="uploadBoxDescription">Drag & drop or click to upload</p>
              <p className="fileTypeSpecify">PDF and Image file types</p>
  
             
            </div>
          )}
           <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
          {/* File List */}
          {selectedFiles.length > 0 && (
            
            <ul className="fileList">
              {selectedFiles.map((file, i) => (
              <li key={i}>
              <span className="fileName">{file.name}</span>
              <span className="chosenFileSize">{formatFileSize(file.size)} <span className="colorizeFileSize">{formatFileSizeDecoration(file.size)}</span></span>
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
          <div className="bottomHeader" style={{display: selectedFiles.length>0 ? "flex" : "none"}}></div>

          <div className="uploadButton">
            <button
              className="closeUploadModal"
              onClick={() => {
                setWarning(false);
                setRemainingFiles(10);
                close();
                clearFiles();
              }}
            >
              {selectedFiles.length > 0 ? "Cancel" : "Close"}
            </button>
  
            {selectedFiles.length > 0 && (
              <button className="closeUploadModal" onClick={openFileDialog}>Upload</button>
            )}
          </div>
        </div>
      </div>
  
      {/* PDF PAGE GRID MODAL */}
      <div
        style={{ display: pickPages ? "flex" : "none" }}
        className="selectPDFPages"
      >
        <h1 className="selectPageHeader">Select PDF Pages</h1>
        <h4><span className="asterik">* </span>Files Selected: {numSelectedPages}</h4>
        <h4><span className="asterik">* </span>Files Remaining: {remainingFiles}</h4>
       
        <div className="pdfGrid">
          {pdfPages.map((page, i) => (
            <div
              key={i}
              className={`pdfPageContainer ${selectedPages.includes(i) ? "selected" : ""}`}
              onClick={() => {
                togglePage(i);
                if (selectedPages.includes(i)) {
                  setnNumSelectedPages((prev) => prev - 1);
                } else {
                  setnNumSelectedPages((prev) => prev + 1);
                }
              }}
            >
              <div className="pdfPageLabel">
                {page.name} - Page {page.pageNumber}
              </div>
              <img src={page.src} alt={`${page.name} - Page ${page.pageNumber}`} />
            </div>
          ))}
        </div>
  
        <div className="selectButtonsContainer">
          <button className="selectButtons" onClick={clearPDF}>Close</button>
          <button
            className="selectButtons"
            style={{ display: selectedPages.length > 0 ? "flex" : "none" }}
            onClick={addSelectedPagesToFiles}
          >
            Select Pages
          </button>
        </div>
      </div>
    </>
  );
  
}
