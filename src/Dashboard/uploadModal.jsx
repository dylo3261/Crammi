import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

import "./uploadModal.css";

export default function UploadModal({ isOpen, close }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [pickPages, setPickPages] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPages, setPdfPages] = useState([]); // store canvases

  const fileInputRef = useRef(null);

  // Drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Process uploaded files
  const processFiles = (files) => {
    setSelectedFiles((prev) => {
      const newList = [...prev, ...files];

      // Only look for PDF in the new files
      const pdf = files.find((f) => f.type === "application/pdf");

      if (pdf) {
        setPdfFile(pdf);
        setPickPages(true);
      } else {
        // Clear PDF if no PDF uploaded
        setPdfFile(null);
        setPdfPages([]);
        setPickPages(false);
      }

      return newList;
    });
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
    setPickPages(false); // optional: hide PDF modal
  };

  // Clear only the PDF preview
  const clearPDF = () => {
    setPdfPages([]);
    setPdfFile(null);
    setPickPages(false);
  };

  // Remove single file from list
  const removeFile = (name) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  // Render PDF to canvases
  useEffect(() => {
    if (!pdfFile) return;

    const renderPDF = async () => {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const pages = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        pages.push(canvas.toDataURL());
      }

      setPdfPages(pages);
    };

    renderPDF();
  }, [pdfFile]);

  return (
    <>
      {/* UPLOAD MODAL */}
      <div
        className="uploadModalOverlay"
        style={{ display: isOpen ? "flex" : "none" }}
      >
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
        <button onClick={() => clearPDF()}>Close</button>
        <div className="pdfGrid">
          {pdfPages.map((src, i) => (
            <div key={i} className="pdfPageContainer">
              <img src={src} alt={`Page ${i + 1}`} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
