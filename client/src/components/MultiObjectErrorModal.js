import React from 'react';

/**
 * Modal d'erreur pour fichiers STL avec objets séparés
 * Bloque l'import et guide l'utilisateur vers la solution
 */
function MultiObjectErrorModal({ isOpen, onClose, componentCount, minDistance }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-error" onClick={e => e.stopPropagation()}>
        <div className="modal-icon modal-icon--error">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        <h2 className="modal-title">Fichier multi-objets detecte</h2>

        <div className="modal-body">
          <p className="modal-message">
            Votre fichier STL contient <strong>{componentCount} objets separes</strong>
            {minDistance && <span> (distance: {minDistance}mm)</span>}.
          </p>

          <p className="modal-instructions">
            Pour obtenir un devis precis, veuillez :
          </p>

          <ul className="modal-list">
            <li>Importer chaque piece separement, OU</li>
            <li>Fusionner les objets en un seul maillage dans votre logiciel 3D</li>
          </ul>

          <div className="modal-tip">
            <span className="tip-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <span>
              Si vous souhaitez imprimer plusieurs pieces identiques,
              importez le fichier une fois et indiquez la quantite souhaitee.
            </span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-btn modal-btn--primary" onClick={onClose}>
            Reessayer avec un autre fichier
          </button>
        </div>
      </div>
    </div>
  );
}

export default MultiObjectErrorModal;
