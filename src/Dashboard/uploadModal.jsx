import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

import "./uploadModal.css";

export default function UploadModal({ isOpen, close , activeTab }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [pickPages, setPickPages] = useState(false);
  const [isWarning,setWarning]=useState(false);
  const [isWarning2, setWarning2]=useState(false);
  const [isWarning3, setWarning3]=useState(false);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [pdfPages, setPdfPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [numSelectedPages,setnNumSelectedPages]=useState(0);
  const [specialInstructions, setSpecialInstructions] = useState(""); 

  const [fileSizeRemaining, changeFileSizeRemaining]= useState(10 * 1024 * 1024);
  const [isLegalFileSize, changeLegalFileSize] = useState(false);
  const [remainingFiles,setRemainingFiles]=useState(10);
  const fileInputRef = useRef(null);


  const maxNumFiles=10;
  //file size cap
    const maxFileSize= 10 * 1024 * 1024; //20 mb

  //are we mobile
  const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const check = () => setIsMobile(window.innerWidth < 768);
  check();
  window.addEventListener("resize", check);
  return () => window.removeEventListener("resize", check);
}, []);


    //stop dashboard scrolling when modal open
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
      window.scrollTo(0, scrollY); // restore scroll position
    }
  
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
    };
  }, [isOpen]);
  
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


  //PDF IMAGE LAZY LOADER HELPER
  const renderPage = async (pageObj, index) => {
    if (pageObj.src) return; // already rendered
  
    const page = await pageObj.pdf.getPage(pageObj.pageNumber);
    const viewport = page.getViewport({ scale: 1.5 });
  
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
  
    await page.render({
      canvasContext: canvas.getContext("2d"),
      viewport
    }).promise;
  
    setPdfPages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], src: canvas.toDataURL() };
      return updated;
    });
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

  const processFiles = (files) => {
    const unsupported = files.some(
      f => !f.type.startsWith("image/") && f.type !== "application/pdf"
    );
  
    if (unsupported) {
      setWarning(true);      // If any invalid file found , reject entire batch
      return;
    }
    let curRemainingFiles=remainingFiles;

    // If all files are valid, handle images
    const newSelectedFiles = files.filter((f) => f.type.startsWith("image/"));
    if (newSelectedFiles.length > 0 && curRemainingFiles-newSelectedFiles.length>=0) {
      let PDFExceededFileSize=false;
      let curRemaining=fileSizeRemaining;
      let usedFileSize=0;
      for (const f of newSelectedFiles) {
        curRemaining-=f.size;
        usedFileSize+=f.size;
  
        if(curRemaining<0){
          PDFExceededFileSize=true;
          break;
        }
      }

      //if file size has been exceeded, reject entire batch
    if(PDFExceededFileSize){
      setSelectedFiles((prev) =>prev);
      setRemainingFiles((prev) => prev);
      setWarning(false);
      setWarning2(true);
      setWarning3(false);
    }
    else{
      changeFileSizeRemaining(prev => prev - usedFileSize);
      setSelectedFiles((prev) => [...prev, ...newSelectedFiles]);
      setRemainingFiles((prev) => prev - newSelectedFiles.length);
      setWarning(false);
      setWarning2(false);
      setWarning3(false);
    }
     
    }
    else{ //if file size exceeds limit # of files
      setWarning(false);
      setWarning2(false);
      setWarning3(true);
    }
  
    // Handle PDFs
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

  // Clear all uploaded files
  const clearFiles = () => {
    setSelectedFiles([]);
    clearPDF();
  };

  // Remove single file from list
  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPdfPages((prev) => prev.filter((_, i) => i !== index));
    setSelectedPages([]);
    setRemainingFiles((prev) => prev + 1);
  };
  

  // Render PDFs to canvases
 // Render PDFs lazily
useEffect(() => {
  if (pdfFiles.length === 0) {
    setPdfPages([]);
    return;
  }

  const loadPDF = async () => {
    const placeholders = [];

    for (let pdfFile of pdfFiles) {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        placeholders.push({
          name: pdfFile.name,
          pageNumber: i,
          pdf,               // store reference for lazy loading
          src: null          // NOT LOADED YET
        });
      }
    }

    setPdfPages(placeholders);
  };

  loadPDF();
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
    if(remainingFiles-newFiles.length >=0){
    let PDFExceededFileSize=false;
    let curRemaining=fileSizeRemaining;
    let usedFileSize=0;
    for (const f of newFiles) {
      curRemaining-=f.size;
      usedFileSize+=f.size;
      console.log(curRemaining);

      if(curRemaining<0){
        PDFExceededFileSize=true;
        break;
      }
    }

      //if file size has been exceeded, reject entire batch
    if(PDFExceededFileSize){
      setWarning2(true);
      
      setSelectedFiles(prev => prev);
      setRemainingFiles(prev => prev);
      setPickPages(false);
      setSelectedPages([]);
    }
    else{
      changeFileSizeRemaining(prev => prev - usedFileSize);
      setSelectedFiles((prev) => [...prev, ...newFiles] );
      setRemainingFiles((prev) => prev - newFiles.length);
      setPickPages(false);
      setSelectedPages([]);
    }
  }
   else{
    setWarning3(true);
    setPickPages(false);
    setSelectedPages([]);
   }
  };
  return (
    <>
      {/* UPLOAD MODAL */}
      {/* UPLOAD MODAL */}
    <div
      className="uploadModalOverlay"
      style={{ display: isOpen ? "flex" : "none" }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}   // ← always active
    >
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
         
        </div>

        {/* "Add Another File" bar */}
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
          display: (selectedFiles.length > 0)&& isMobile ? "flex" : "none",
          resize: "none",
        }}
      
        className="specialInstructions"
        placeholder="Special Instructions..."
        value={specialInstructions}
        onChange={(e) => {
          setSpecialInstructions(e.target.value); // update state
          // console.log(e.target.value);            // log current input
        }}
        rows={2}
        maxLength={365}
      />
      <p className="numChars" style={{display: (specialInstructions.length > 0) && isMobile ? "block" : "none"}}> <span style={{color: specialInstructions.length===365 ? "red" :"#555"}}>Characters: {specialInstructions.length} / 365</span> </p>

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
        {/* File List Header */}
        <div className="fileListHeader" style={{ display: selectedFiles.length > 0 ? "flex" : "none" }}>
          <span className="fileNameHeader">Name</span>
          <span className="fileSizeHeader">Size</span>
          <span className="removeHeader"></span>
        </div>
        <div className="bottomHeader" style={{ display: selectedFiles.length > 0 ? "flex" : "none" }}></div>

        {/* Drag & Drop Zone (visual only when empty) */}
        <div
          className={`uploadDropZone ${dragOver ? "dragOver" : ""}`}
          style={{ display: selectedFiles.length === 0 ? "flex" : "none" }}
          onClick={openFileDialog}
        >
          
          <img
            className="uploadModalIcon"
            src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2017/png/iconmonstr-upload-21.png&r=0&g=0&b=0"
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
        
        {/* File List */}
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
          display: (selectedFiles.length > 0)&& !isMobile ? "flex" : "none",
          resize: "none",
        }}
      
        className="specialInstructions"
        placeholder="Special Instructions..."
        value={specialInstructions}
        onChange={(e) => {
          setSpecialInstructions(e.target.value); // update state
          // console.log(e.target.value);            // log current input
        }}
        rows={2}
        maxLength={365}
      />
      <p className="numChars" style={{display: (specialInstructions.length > 0) && !isMobile ? "block" : "none"}}> <span style={{color: specialInstructions.length===365 ? "red" :"#555"}}>Characters: {specialInstructions.length} / 365</span> </p>

        </div>
      


       


        {/* Buttons */}
        <div className="uploadButton">
          <button
            className="closeUploadModal"
            onClick={() => {
              setWarning(false);
              setWarning2(false);
              setRemainingFiles(10);
              close();
              clearFiles();
              setSpecialInstructions("");
            }}
          >
            {selectedFiles.length > 0 ? "Cancel" : "Close"}
          </button>

          {selectedFiles.length > 0 && (
            <button className="closeUploadModal" onClick={openFileDialog}>
              Upload
            </button>
          )}
        </div>
      </div>
    </div>

    {/* PDF PAGE GRID MODAL */}
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
        {pdfPages.map((page, i) => (
          <div
            key={i}
            className={`pdfPageContainer ${selectedPages.includes(i) ? "selected" : ""}`}
            onClick={() => {
              togglePage(i);
              setnNumSelectedPages(prev =>
                selectedPages.includes(i) ? prev - 1 : prev + 1
              );
            }}
          >
            <div className="pdfPageLabel">
              {page.name} - Page {page.pageNumber}
            </div>
            <div
            className="lazyThumb"
            data-index={i}
            ref={(el) => {
              if (!el) return;

              const observer = new IntersectionObserver(
                (entries) => {
                  entries.forEach(entry => {
                    if (entry.isIntersecting) {
                      renderPage(pdfPages[i], i);
                      observer.disconnect();
                    }
                  });
                },
                { rootMargin: "200px" } // load slightly before visible
              );

              observer.observe(el);
            }}
          >
            {page.src ? (
              <img src={page.src} alt={`${page.name} - Page ${page.pageNumber}`} />
            ) : (
              <div className="pdfPlaceholder">Loading…</div>
            )}
          </div>
          </div>
        ))}
      </div>
        
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
