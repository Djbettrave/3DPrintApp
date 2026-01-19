import React, { useState, useEffect, useMemo } from 'react';
import { TECHNOLOGIES, POST_PROCESSING, DELIVERY_OPTIONS, CONTACT_EMAIL } from '../config/pricing';

// Icône FDM (lignes de couche)
const FDMIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="tech-icon">
    <rect x="8" y="8" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="8" y1="14" x2="32" y2="14" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
    <line x1="8" y1="20" x2="32" y2="20" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
    <line x1="8" y1="26" x2="32" y2="26" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
  </svg>
);

// Icône SLA (surface lisse avec reflet)
const SLAIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="tech-icon">
    <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="2"/>
    <ellipse cx="16" cy="16" rx="4" ry="2" fill="currentColor" opacity="0.3" transform="rotate(-30 16 16)"/>
    <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
  </svg>
);

// Icônes délai
const DeliveryIcon = ({ type }) => {
  if (type === 'slow') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="delivery-icon">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  if (type === 'fast') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="delivery-icon">
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  // lightning
  return (
    <svg viewBox="0 0 24 24" fill="none" className="delivery-icon delivery-icon--urgent">
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" opacity="0.2"/>
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

function PriceCalculator({ volume, dimensions, onCheckout }) {
  const [selectedTech, setSelectedTech] = useState('FDM');
  const [selectedMaterial, setSelectedMaterial] = useState('PLA');
  const [selectedQuality, setSelectedQuality] = useState('normal');
  const [postProcessing, setPostProcessing] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState('standard');

  const tech = TECHNOLOGIES[selectedTech];

  // Vérifier si les dimensions dépassent la limite
  const isOversized = useMemo(() => {
    if (!dimensions) return false;
    const maxSize = tech.maxSize;
    return dimensions.x > maxSize.x || dimensions.y > maxSize.y || dimensions.z > maxSize.z;
  }, [dimensions, tech.maxSize]);

  // Réinitialiser le matériau et la qualité quand on change de techno
  useEffect(() => {
    const newTech = TECHNOLOGIES[selectedTech];
    setSelectedMaterial(newTech.materials[0].id);
    setSelectedQuality('normal');
  }, [selectedTech]);

  // Calculer le prix
  const priceDetails = useMemo(() => {
    if (!volume || volume <= 0 || isOversized) {
      return { printPrice: 0, finishingPrice: 0, deliveryExtra: 0, totalPrice: 0 };
    }

    const material = tech.materials.find(m => m.id === selectedMaterial);
    const quality = tech.qualities.find(q => q.id === selectedQuality);
    const delivery = DELIVERY_OPTIONS.find(d => d.id === selectedDelivery);

    if (!material || !quality || !delivery) {
      return { printPrice: 0, finishingPrice: 0, deliveryExtra: 0, totalPrice: 0 };
    }

    // Prix de base impression
    const printPrice = volume * material.price * quality.multiplier;

    // Finition
    const finishingPrice = postProcessing
      ? (volume < POST_PROCESSING.smallThreshold ? POST_PROCESSING.smallPrice : POST_PROCESSING.largePrice)
      : 0;

    // Surcoût délai (% du prix impression uniquement)
    const deliveryExtra = printPrice * (delivery.multiplier - 1);

    // Total
    const totalPrice = printPrice + finishingPrice + deliveryExtra;

    return {
      printPrice,
      finishingPrice,
      deliveryExtra,
      totalPrice,
      deliveryMultiplier: delivery.multiplier
    };
  }, [volume, selectedTech, selectedMaterial, selectedQuality, postProcessing, selectedDelivery, tech, isOversized]);

  // Générer le lien mailto
  const generateMailtoLink = () => {
    const subject = encodeURIComponent('Devis pièce hors gabarit');
    const body = encodeURIComponent(
      `Bonjour,\n\nJe souhaite obtenir un devis pour une pièce dépassant les dimensions standard.\n\n` +
      `Dimensions du modèle:\n` +
      `- X: ${dimensions?.x?.toFixed(1) || '?'} mm\n` +
      `- Y: ${dimensions?.y?.toFixed(1) || '?'} mm\n` +
      `- Z: ${dimensions?.z?.toFixed(1) || '?'} mm\n` +
      `- Volume: ${volume?.toFixed(2) || '?'} cm³\n\n` +
      `Technologie souhaitée: ${tech.name}\n\n` +
      `Merci de me recontacter.\n\nCordialement`
    );
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  // Handler pour le checkout
  const handleCheckout = () => {
    if (onCheckout) {
      const selectedMat = tech.materials.find(m => m.id === selectedMaterial);
      const selectedQual = tech.qualities.find(q => q.id === selectedQuality);
      const selectedDel = DELIVERY_OPTIONS.find(d => d.id === selectedDelivery);

      onCheckout({
        technology: selectedTech,
        material: selectedMat,
        quality: selectedQual,
        postProcessing,
        delivery: selectedDel,
        volume,
        dimensions,
        prices: priceDetails
      });
    }
  };

  if (!volume) {
    return null;
  }

  const selectedMat = tech.materials.find(m => m.id === selectedMaterial);
  const selectedQual = tech.qualities.find(q => q.id === selectedQuality);
  const selectedDel = DELIVERY_OPTIONS.find(d => d.id === selectedDelivery);

  return (
    <div className="price-calculator card">
      <div className="card-header">
        <h3>Configuration</h3>
      </div>

      <div className="card-body">
        {/* Sélection de la technologie */}
        <div className="option-group">
          <label className="option-label">Technologie</label>
          <div className="tech-toggle">
            <button
              className={`tech-card ${selectedTech === 'FDM' ? 'selected' : ''}`}
              onClick={() => setSelectedTech('FDM')}
            >
              <FDMIcon />
              <div className="tech-card-content">
                <span className="tech-card-title">FDM</span>
                <span className="tech-card-subtitle">Filament</span>
              </div>
            </button>
            <button
              className={`tech-card ${selectedTech === 'SLA' ? 'selected' : ''}`}
              onClick={() => setSelectedTech('SLA')}
            >
              <SLAIcon />
              <div className="tech-card-content">
                <span className="tech-card-title">SLA</span>
                <span className="tech-card-subtitle">Résine</span>
              </div>
            </button>
          </div>
          <p className="tech-description">{tech.description}</p>
        </div>

        {/* Alerte dépassement de taille */}
        {isOversized && (
          <div className="size-warning">
            <div className="size-warning-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="size-warning-content">
              <strong>Dimensions hors gabarit</strong>
              <p>
                Max {selectedTech}: {tech.maxSize.x} × {tech.maxSize.y} × {tech.maxSize.z} mm
              </p>
            </div>
            <a href={generateMailtoLink()} className="size-warning-btn">
              Demander un devis
            </a>
          </div>
        )}

        {/* Suite du configurateur (masqué si hors gabarit) */}
        {!isOversized && (
          <>
            {/* Sélection du matériau */}
            <div className="option-group">
              <label className="option-label">Matériau</label>
              <div className="option-cards">
                {tech.materials.map((material) => (
                  <button
                    key={material.id}
                    className={`option-card ${selectedMaterial === material.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMaterial(material.id)}
                    style={{ '--accent-color': material.color }}
                  >
                    <div className="option-card-indicator" />
                    <div className="option-card-content">
                      <span className="option-card-title">{material.name}</span>
                      <span className="option-card-desc">{material.desc}</span>
                    </div>
                    <span className="option-card-price">{material.price}€/cm³</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sélection de la qualité */}
            <div className="option-group">
              <label className="option-label">Qualité d'impression</label>
              <div className="option-cards">
                {tech.qualities.map((quality) => (
                  <button
                    key={quality.id}
                    className={`option-card ${selectedQuality === quality.id ? 'selected' : ''}`}
                    onClick={() => setSelectedQuality(quality.id)}
                  >
                    <div className="option-card-indicator" />
                    <div className="option-card-content">
                      <span className="option-card-title">{quality.name}</span>
                      <span className="option-card-desc">{quality.desc}</span>
                    </div>
                    <span className="option-card-badge">{quality.layer}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Post-traitement */}
            <div className="option-group">
              <label className="option-label">Finition</label>
              <div className="post-processing-toggle">
                <button
                  className={`post-processing-option ${!postProcessing ? 'selected' : ''}`}
                  onClick={() => setPostProcessing(false)}
                >
                  <span className="post-processing-title">Sans finition</span>
                  <span className="post-processing-price">Inclus</span>
                </button>
                <button
                  className={`post-processing-option ${postProcessing ? 'selected' : ''}`}
                  onClick={() => setPostProcessing(true)}
                >
                  <span className="post-processing-title">Ponçage + Apprêt</span>
                  <span className="post-processing-price">
                    +{volume < POST_PROCESSING.smallThreshold ? POST_PROCESSING.smallPrice : POST_PROCESSING.largePrice}€
                  </span>
                </button>
              </div>
              {postProcessing && (
                <p className="post-processing-info">
                  Surface poncée et apprêtée, prête à peindre
                </p>
              )}
            </div>

            {/* Délai de livraison */}
            <div className="option-group">
              <label className="option-label">Délai de livraison</label>
              <div className="delivery-options">
                {DELIVERY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    className={`delivery-option ${selectedDelivery === option.id ? 'selected' : ''}`}
                    onClick={() => setSelectedDelivery(option.id)}
                  >
                    <DeliveryIcon type={option.icon} />
                    <div className="delivery-option-content">
                      <span className="delivery-option-name">{option.name}</span>
                      <span className="delivery-option-delay">{option.delay}</span>
                    </div>
                    <span className="delivery-option-price">
                      {option.multiplier === 1 ? 'Inclus' : `+${Math.round((option.multiplier - 1) * 100)}%`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Résumé du prix */}
            <div className="price-summary">
              <div className="price-details">
                <div className="price-line">
                  <span>Impression ({selectedMat?.name}, {selectedQual?.name})</span>
                  <span>{priceDetails.printPrice.toFixed(2)}€</span>
                </div>
                {postProcessing && (
                  <div className="price-line">
                    <span>Finition</span>
                    <span>+{priceDetails.finishingPrice.toFixed(2)}€</span>
                  </div>
                )}
                {priceDetails.deliveryExtra > 0 && (
                  <div className="price-line">
                    <span>Délai {selectedDel?.name}</span>
                    <span>+{priceDetails.deliveryExtra.toFixed(2)}€</span>
                  </div>
                )}
              </div>

              <div className="price-total">
                <span className="price-total-label">Total</span>
                <span className="price-total-value">{priceDetails.totalPrice.toFixed(2)} €</span>
              </div>

              <button className="checkout-btn" onClick={handleCheckout}>
                <svg viewBox="0 0 24 24" fill="none" className="checkout-icon">
                  <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Commander
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PriceCalculator;
