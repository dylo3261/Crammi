import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

import "./uploadModal.css";

export default function UploadModal({ isOpen, close }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [pickPages, setPickPages] = useState(false);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [pdfPages, setPdfPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);

  const fileInputRef = useRef(null);

  // Toggle page selection
  const togglePage = (index) => {
    setSelectedPages((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index) // deselect
        : [...prev, index] // select
    );
  };

  // Drag events
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragOver(false); };

  // Process uploaded files
  const processFiles = (files) => {
    const newSelectedFiles = files.filter(
      (f) => !selectedFiles.some((file) => file.name === f.name)
    );
    if (!newSelectedFiles.length) return;

    setSelectedFiles((prev) => [...prev, ...newSelectedFiles]);

    // Filter PDFs
    const newPDFs = newSelectedFiles.filter(
      (f) => f.type === "application/pdf" && !pdfFiles.some((p) => p.name === f.name)
    );

    if (newPDFs.length > 0) {
      setPdfFiles((prev) => [...prev, ...newPDFs]);
      setSelectedPages([]); // reset selections for new PDFs
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
    setPickPages(false);
    setPdfFiles([]);
    setPdfPages([]);
    setSelectedPages([]);
  };

  // Clear only the PDF preview
  const clearPDF = () => {
    setPdfPages([]);
    setPdfFiles([]);
    setPickPages(false);
    setSelectedPages([]); // reset selected pages
  };

  // Remove single file from list
  const removeFile = (name) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== name));
    setPdfFiles((prev) => prev.filter((f) => f.name !== name));
    setPdfPages((prev) => prev.filter((p) => p.name !== name));
    setSelectedPages([]); // reset selections when a PDF is removed
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

  return (
    <>
      {/* UPLOAD MODAL */}
      <div className="uploadModalOverlay" style={{ display: isOpen ? "flex" : "none" }}>
        <div className="uploadModalContent">
          <div className="uploadFileHeader">
            <h1 className="uploadFileText">Upload Files</h1>
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
            <p className="uploadBoxDescription">
              Drag and drop or click to upload
            </p>

            {selectedFiles.length > 0 && (
              <ul className="fileList">
                {selectedFiles.map((file, i) => (
                  <li key={i}>
                    {file.name}
                    <span
                      className="removeFile"
                      onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                    >
                      ×
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </div>

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

      {/* PDF PAGE GRID MODAL */}
      <div
        style={{ display: pickPages ? "flex" : "none" }}
        className="selectPDFPages"
      >
        <h1 className='selectPageHeader'>Select Pages</h1>

        <div className="pdfGrid">
          {pdfPages.map((page, i) => (
            <div
              key={i}
              className={`pdfPageContainer ${selectedPages.includes(i) ? "selected" : ""}`}
              onClick={() => togglePage(i)}
            >
              <div className="pdfPageLabel">
                {page.name} - Page {page.pageNumber}
              </div>
              <img src={page.src} alt={`${page.name} - Page ${page.pageNumber}`} />
            </div>
          ))}
        </div>

        <div className='selectButtonsContainer'>
          <button className="selectButtons" onClick={clearPDF}>Close</button>
        </div>
      </div>
    </>
  );
}
