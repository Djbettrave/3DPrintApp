import React from 'react';

/**
 * Modal d'avertissement pour fichiers STL avec assemblages
 * Permet de continuer ou d'annuler
 */
function AssemblyWarningModal({ isOpen, onContinue, onCancel, componentCount }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content modal-warning" onClick={e => e.stopPropagation()}>
        <div className="modal-icon modal-icon--warning">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V13M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.56 20.74C2.87 20.92 3.22 21.01 3.58 21H20.42C20.78 21.01 21.13 20.92 21.44 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.32 12.97 3.15C12.66 2.98 12.32 2.89 11.97 2.89C11.62 2.89 11.28 2.98 10.97 3.15C10.67 3.32 10.41 3.56 10.23 3.86H10.29Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 className="modal-title">Assemblage detecte</h2>

        <div className="modal-body">
          <p className="modal-message">
            Votre modele semble etre un assemblage de <strong>{componentCount} pieces connectees</strong>.
          </p>

          <p className="modal-info">
            Le devis est calcule sur l'ensemble de la structure.
          </p>

          <p className="modal-note">
            Si ce sont des pieces separees a imprimer individuellement,
            veuillez les importer separement pour un devis precis.
          </p>
        </div>

        <div className="modal-actions">
          <button className="modal-btn modal-btn--secondary" onClick={onCancel}>
            Annuler et reimporter
          </button>
          <button className="modal-btn modal-btn--primary" onClick={onContinue}>
            Continuer avec ce fichier
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssemblyWarningModal;
