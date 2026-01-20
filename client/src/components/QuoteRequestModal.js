import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function QuoteRequestModal({ type, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [files, setFiles] = useState([]);
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
      description: 'Envoyez-nous des photos de votre objet et nous vous recontacterons avec un devis.'
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
      description: 'Décrivez votre projet et joignez vos plans, croquis ou images de référence.'
    }
  };

  const currentService = serviceInfo[type] || serviceInfo.scan;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('serviceType', type);
      formDataToSend.append('message', formData.message);

      files.forEach((file) => {
        formDataToSend.append('files', file);
      });

      const response = await fetch(`${API_URL}/api/quote-requests`, {
        method: 'POST',
        body: formDataToSend
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

            <div className="form-group">
              <label htmlFor="message">Description du projet *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder={type === 'scan'
                  ? "Décrivez l'objet à scanner (taille approximative, matière, niveau de détail souhaité...)"
                  : "Décrivez votre projet (dimensions, fonctionnalité, matériaux envisagés...)"
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="files">
                Fichiers joints (photos, plans, croquis)
                <span className="label-optional">Optionnel</span>
              </label>
              <div className="file-upload-zone">
                <input
                  type="file"
                  id="files"
                  multiple
                  accept="image/*,.pdf,.dwg,.dxf"
                  onChange={handleFileChange}
                />
                <div className="file-upload-content">
                  <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>Glissez vos fichiers ou cliquez pour parcourir</span>
                </div>
              </div>
              {files.length > 0 && (
                <div className="files-list">
                  {files.map((file, index) => (
                    <span key={index} className="file-chip">{file.name}</span>
                  ))}
                </div>
              )}
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
