import React from 'react';

function ModelInfo({ dimensions, volume, fileName }) {
  if (!dimensions) {
    return null;
  }

  return (
    <div className="model-info card">
      <div className="card-header">
        <h3>Informations</h3>
        {fileName && <span className="file-badge">{fileName}</span>}
      </div>

      <div className="card-body">
        <div className="dimensions-grid">
          <div className="dimension-item">
            <div className="dimension-icon" style={{ '--dim-color': '#ff6b6b' }}>X</div>
            <div className="dimension-data">
              <span className="dimension-value">{dimensions.x.toFixed(1)}</span>
              <span className="dimension-unit">mm</span>
            </div>
          </div>

          <div className="dimension-item">
            <div className="dimension-icon" style={{ '--dim-color': '#69db7c' }}>Y</div>
            <div className="dimension-data">
              <span className="dimension-value">{dimensions.y.toFixed(1)}</span>
              <span className="dimension-unit">mm</span>
            </div>
          </div>

          <div className="dimension-item">
            <div className="dimension-icon" style={{ '--dim-color': '#74c0fc' }}>Z</div>
            <div className="dimension-data">
              <span className="dimension-value">{dimensions.z.toFixed(1)}</span>
              <span className="dimension-unit">mm</span>
            </div>
          </div>
        </div>

        <div className="volume-display">
          <div className="volume-label">Volume total</div>
          <div className="volume-value">
            <span className="volume-number">{volume.toFixed(2)}</span>
            <span className="volume-unit">cm³</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModelInfo;
