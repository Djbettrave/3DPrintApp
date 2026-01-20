import React from 'react';

function ModelInfo({ dimensions, volume, fileName }) {
  if (!dimensions) {
    return null;
  }

  return (
    <div className="model-info card card--compact">
      <div className="info-header">
        <h3>Modèle</h3>
        {fileName && <span className="file-badge">{fileName}</span>}
      </div>

      <div className="info-content">
        <div className="dimensions-row">
          <div className="dim-chip" style={{ '--dim-color': '#ff6b6b' }}>
            <span className="dim-axis">X</span>
            <span className="dim-val">{dimensions.x.toFixed(1)}</span>
          </div>
          <div className="dim-chip" style={{ '--dim-color': '#69db7c' }}>
            <span className="dim-axis">Y</span>
            <span className="dim-val">{dimensions.y.toFixed(1)}</span>
          </div>
          <div className="dim-chip" style={{ '--dim-color': '#74c0fc' }}>
            <span className="dim-axis">Z</span>
            <span className="dim-val">{dimensions.z.toFixed(1)}</span>
          </div>
          <div className="dim-chip dim-chip--volume">
            <span className="dim-axis">Vol</span>
            <span className="dim-val">{volume.toFixed(1)} cm³</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModelInfo;
