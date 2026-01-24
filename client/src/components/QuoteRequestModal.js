import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function QuoteRequestModal({ type, onClose, prefillData }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    transferLink: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const serviceInfo = {
    scan: {
      title: 'Scan 3D professionnel',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M3 9H21" stroke="currentColor" strokeWidth="2"/>
          <path d="M9 21V9" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      description: 'Envoyez-nous des photos de votre objet et nous vous recontacterons avec un devis.',
      showTransferLink: false
    },
    modelisation: {
      title: 'Modélisation CAD',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
          <path d="M12 19L19 12L22 15L15 22L12 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 13L16.5 5.5L2 2L5.5 16.5L13 18L18 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="11" cy="11" r="2" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      description: 'Décrivez votre projet et joignez vos plans, croquis ou images de référence.',
      showTransferLink: false
    },
    oversized: {
      title: 'Pièce hors gabarit',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
          <path d="M21 21L15 15M15 15V20M15 15H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 3L9 9M9 9V4M9 9H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="6" y="6" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3"/>
        </svg>
      ),
      description: 'Votre modèle dépasse les dimensions standard. Nous étudierons une solution adaptée.',
      showTransferLink: true
    },
    quote: {
      title: 'Demande de devis',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 18V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      description: 'Finition professionnelle, délai express ou vérification manuelle requise.',
      showTransferLink: true
    },
    stl_issue: {
      title: 'Vérification du fichier',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      description: 'Votre fichier nécessite une vérification manuelle avant impression.',
      showTransferLink: true
    }
  };

  const currentService = serviceInfo[type] || serviceInfo.quote;

  // Générer le message pré-rempli
  const getPrefillMessage = () => {
    if (!prefillData) return '';

    let msg = '';

    if (prefillData.reason) {
      msg += `Raison : ${prefillData.reason}\n\n`;
    }

    if (prefillData.dimensions) {
      msg += `Dimensions du modèle :\n`;
      msg += `- X : ${prefillData.dimensions.x?.toFixed(1) || '?'} mm\n`;
      msg += `- Y : ${prefillData.dimensions.y?.toFixed(1) || '?'} mm\n`;
      msg += `- Z : ${prefillData.dimensions.z?.toFixed(1) || '?'} mm\n`;
      msg += `- Volume : ${prefillData.volume?.toFixed(2) || '?'} cm³\n\n`;
    }

    if (prefillData.config) {
      msg += `Configuration souhaitée :\n`;
      msg += `- Technologie : ${prefillData.config.technology || '?'}\n`;
      msg += `- Matériau : ${prefillData.config.material || '?'}\n`;
      msg += `- Qualité : ${prefillData.config.quality || '?'}\n`;
      msg += `- Couleur : ${prefillData.config.color || '?'}\n`;
      msg += `- Quantité : ${prefillData.config.quantity || 1}\n`;
      msg += `- Finition : ${prefillData.config.finishType === 'pro' ? 'Professionnelle' : "Brut d'impression"}\n`;
      msg += `- Délai : ${prefillData.config.delivery || 'Standard'}\n`;
    }

    return msg;
  };

  // Initialiser le message avec les données pré-remplies
  React.useEffect(() => {
    const prefillMessage = getPrefillMessage();
    if (prefillMessage) {
      setFormData(prev => ({ ...prev, message: prefillMessage }));
    }
  }, [prefillData]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch(`${API_URL}/api/quote-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          serviceType: type,
          prefillData
        })
      });

      if (response.ok) {
        setSubmitStatus('success');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting quote request:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content modal-content--quote">
        <button className="modal-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="modal-header">
          <div className="modal-icon">
            {currentService.icon}
          </div>
          <h2>{currentService.title}</h2>
          <p>{currentService.description}</p>
        </div>

        {submitStatus === 'success' ? (
          <div className="quote-success">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Demande envoyée !</h3>
            <p>Nous vous recontacterons sous 24h.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="quote-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Nom *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div className="form-row form-row--two">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="votre@email.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Téléphone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>

            {currentService.showTransferLink && (
              <div className="form-group">
                <label htmlFor="transferLink">
                  Lien vers votre fichier 3D
                  <span className="label-hint">WeTransfer, Google Drive, Dropbox...</span>
                </label>
                <input
                  type="url"
                  id="transferLink"
                  name="transferLink"
                  value={formData.transferLink}
                  onChange={handleInputChange}
                  placeholder="https://wetransfer.com/downloads/..."
                />
                <p className="field-help">
                  Uploadez votre fichier sur <a href="https://wetransfer.com" target="_blank" rel="noopener noreferrer">WeTransfer</a> et collez le lien ici.
                </p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="message">Informations complémentaires</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={6}
                placeholder="Détails supplémentaires, questions, contraintes particulières..."
              />
            </div>

            {submitStatus === 'error' && (
              <div className="form-error">
                Une erreur est survenue. Veuillez réessayer.
              </div>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Envoyer la demande
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default QuoteRequestModal;
