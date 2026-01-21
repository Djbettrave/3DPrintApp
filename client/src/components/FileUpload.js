import React, { useCallback, useState, useRef } from 'react';

function FileUpload({ onFileLoad, onDemoLoad }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith('.stl')) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onFileLoad(e.target.result, file.name, file);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="upload-container">
      {/* Zone principale - Upload STL */}
      <div
        className={`upload-primary ${isDragging ? 'upload-primary--dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleZoneClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".stl"
          onChange={handleFileSelect}
          hidden
        />

        <div className="upload-primary-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h3 className="upload-primary-title">
          Glissez votre fichier <span>.STL</span> ici
        </h3>

        <p className="upload-primary-hint">ou</p>

        <span className="upload-primary-btn">
          Parcourir mes fichiers
        </span>
      </div>

      {/* Option secondaire - Cube démo */}
      {onDemoLoad && (
        <div className="upload-secondary">
          <p>
            Pas de fichier 3D ?{' '}
            <button className="upload-secondary-link" onClick={onDemoLoad} type="button">
              Testez avec un cube démo
            </button>{' '}
            pour estimer un prix.
          </p>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
