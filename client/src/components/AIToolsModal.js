import React from 'react';

const AI_TOOLS = [
  {
    id: 'meshy',
    name: 'Meshy AI',
    description: 'Transformez vos photos en modèles 3D de haute qualité. Idéal pour les objets du quotidien.',
    feature: 'Photo → 3D',
    url: 'https://www.meshy.ai',
    color: '#4e7396'
  },
  {
    id: 'tripo3d',
    name: 'Tripo3D',
    description: 'Générez des modèles 3D à partir de descriptions textuelles. Décrivez votre idée, l\'IA crée le modèle.',
    feature: 'Texte → 3D',
    url: 'https://www.tripo3d.ai',
    color: '#3d6182'
  },
  {
    id: 'rodin',
    name: 'Rodin',
    description: 'Spécialisé dans la création de personnages et objets complexes à partir d\'images ou de concepts.',
    feature: 'Objet → 3D',
    url: 'https://hyperhuman.deemos.com/rodin',
    color: '#2f4f6e'
  }
];

function AIToolsModal({ onClose }) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content modal-content--ai">
        <button className="modal-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="modal-header">
          <div className="modal-icon">
            <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
              <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <h2>Outils IA gratuits</h2>
          <p>Générez votre modèle 3D en quelques clics</p>
        </div>

        <div className="ai-tools-list">
          {AI_TOOLS.map((tool) => (
            <a
              key={tool.id}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ai-tool-item"
              style={{ '--tool-color': tool.color }}
            >
              <div className="ai-tool-info">
                <div className="ai-tool-header">
                  <h4>{tool.name}</h4>
                  <span className="ai-tool-feature">{tool.feature}</span>
                </div>
                <p>{tool.description}</p>
              </div>
              <div className="ai-tool-arrow">
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </a>
          ))}
        </div>

        <div className="modal-note">
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="8" r="1" fill="currentColor"/>
          </svg>
          <p>
            Une fois votre fichier STL généré, revenez le télécharger ici pour obtenir un devis instantané !
          </p>
        </div>
      </div>
    </div>
  );
}

export default AIToolsModal;
