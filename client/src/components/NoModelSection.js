import React, { useState } from 'react';
import AIToolsModal from './AIToolsModal';
import QuoteRequestModal from './QuoteRequestModal';

function NoModelSection() {
  const [showAIModal, setShowAIModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteType, setQuoteType] = useState('scan');

  const handleQuoteClick = (type) => {
    setQuoteType(type);
    setShowQuoteModal(true);
  };

  return (
    <section className="no-model-section">
      <div className="no-model-header">
        <h2>Vous n'avez pas de modèle 3D ?</h2>
        <p>Pas de problème ! Voici plusieurs solutions pour créer votre fichier STL</p>
      </div>

      <div className="no-model-cards">
        {/* Card 1: Outils IA */}
        <div className="no-model-card">
          <div className="card-icon card-icon--ai">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
              <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <span className="card-badge card-badge--free">Gratuit</span>
          <h3>Générer avec l'IA</h3>
          <p className="card-description">
            Créez un modèle 3D à partir de photos ou de descriptions textuelles
          </p>
          <ul className="card-features">
            <li>Meshy AI - Photo → 3D</li>
            <li>Tripo3D - Texte → 3D</li>
            <li>Rodin - Objet → 3D</li>
          </ul>
          <button className="card-btn" onClick={() => setShowAIModal(true)}>
            Voir les outils
          </button>
        </div>

        {/* Card 2: Scan 3D */}
        <div className="no-model-card">
          <div className="card-icon card-icon--scan">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M3 9H21" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 21V9" stroke="currentColor" strokeWidth="2"/>
              <circle cx="6" cy="6" r="1" fill="currentColor"/>
            </svg>
          </div>
          <span className="card-badge card-badge--quote">Sur devis</span>
          <h3>Scan 3D professionnel</h3>
          <p className="card-description">
            Vous avez l'objet physique ? Nous le scannerons pour vous
          </p>
          <ul className="card-features">
            <li>Précision garantie</li>
            <li>Fichier optimisé</li>
            <li>Délai 48h</li>
          </ul>
          <button className="card-btn" onClick={() => handleQuoteClick('scan')}>
            Demander un devis
          </button>
        </div>

        {/* Card 3: Modélisation CAD */}
        <div className="no-model-card">
          <div className="card-icon card-icon--cad">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 19L19 12L22 15L15 22L12 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 13L16.5 5.5L2 2L5.5 16.5L13 18L18 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 2L9.586 9.586" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="11" cy="11" r="2" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <span className="card-badge card-badge--premium">Premium</span>
          <h3>Modélisation CAD</h3>
          <p className="card-description">
            Projet complexe ? Nos experts modélisent votre pièce à partir de plans ou croquis
          </p>
          <ul className="card-features">
            <li>Révisions incluses</li>
            <li>Suivi personnalisé</li>
            <li>Fichiers sources fournis</li>
          </ul>
          <button className="card-btn" onClick={() => handleQuoteClick('modelisation')}>
            Demander un devis
          </button>
        </div>
      </div>

      {/* Modales */}
      {showAIModal && (
        <AIToolsModal onClose={() => setShowAIModal(false)} />
      )}

      {showQuoteModal && (
        <QuoteRequestModal
          type={quoteType}
          onClose={() => setShowQuoteModal(false)}
        />
      )}
    </section>
  );
}

export default NoModelSection;
