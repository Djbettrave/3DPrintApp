import React, { useState, useEffect, useMemo } from 'react';
import { TECHNOLOGIES, POST_PROCESSING, DELIVERY_OPTIONS, CONTACT_EMAIL, PRICING_CONFIG } from '../config/pricing';

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

function PriceCalculator({ volume, dimensions, onCheckout, quoteEligibility = 'ALLOWED' }) {
  const [selectedTech, setSelectedTech] = useState('FDM');
  const [selectedMaterial, setSelectedMaterial] = useState('PLA');
  const [selectedQuality, setSelectedQuality] = useState('normal');
  const [selectedColor, setSelectedColor] = useState('noir');
  const [quantity, setQuantity] = useState(1);
  const [finishType, setFinishType] = useState('brut'); // 'brut' ou 'pro'
  const [selectedDelivery, setSelectedDelivery] = useState('standard');

  const tech = TECHNOLOGIES[selectedTech];

  // Vérifier si devis sur demande forcé par le flow (STL non conforme)
  const isSTLQuoteOnly = quoteEligibility === 'QUOTE_ONLY';

  // Vérifier si devis sur demande (finition pro OU délai urgent OU STL non conforme)
  const isQuoteRequest = finishType === 'pro' || selectedDelivery === 'urgent' || isSTLQuoteOnly;

  // Vérifier si les dimensions dépassent la limite
  const isOversized = useMemo(() => {
    if (!dimensions) return false;
    const maxSize = tech.maxSize;
    return dimensions.x > maxSize.x || dimensions.y > maxSize.y || dimensions.z > maxSize.z;
  }, [dimensions, tech.maxSize]);

  // Réinitialiser le matériau, qualité et couleur quand on change de techno
  useEffect(() => {
    const newTech = TECHNOLOGIES[selectedTech];
    setSelectedMaterial(newTech.materials[0].id);
    setSelectedQuality('normal');
    setSelectedColor(newTech.colors[0].id);
  }, [selectedTech]);

  // Calculer le volume de la bounding box (en cm³)
  const bboxVolume = useMemo(() => {
    if (!dimensions) return 0;
    // dimensions sont en mm, on convertit en cm³ (mm³ / 1000)
    return (dimensions.x * dimensions.y * dimensions.z) / 1000;
  }, [dimensions]);

  // Calculer le prix
  const priceDetails = useMemo(() => {
    if (!volume || volume <= 0 || isOversized || isQuoteRequest) {
      return { printPrice: 0, deliveryExtra: 0, totalPrice: 0, unitPrice: 0, bboxVolume: 0 };
    }

    const material = tech.materials.find(m => m.id === selectedMaterial);
    const quality = tech.qualities.find(q => q.id === selectedQuality);
    const delivery = DELIVERY_OPTIONS.find(d => d.id === selectedDelivery);

    if (!material || !quality || !delivery) {
      return { printPrice: 0, deliveryExtra: 0, totalPrice: 0, unitPrice: 0, bboxVolume: 0 };
    }

    // Utiliser le volume bbox ou le volume réel selon la config
    const pricingVolume = PRICING_CONFIG.useBoundingBoxVolume ? bboxVolume : volume;

    // Prix de base impression (pour 1 pièce)
    let unitPrice = pricingVolume * material.price * quality.multiplier;

    // Appliquer le prix minimum
    unitPrice = Math.max(unitPrice, PRICING_CONFIG.minimumPrice);

    // Prix total impression (quantité)
    const printPrice = unitPrice * quantity;

    // Surcoût délai (% du prix impression)
    const deliveryExtra = printPrice * (delivery.multiplier - 1);

    // Total
    const totalPrice = printPrice + deliveryExtra;

    return {
      printPrice,
      deliveryExtra,
      totalPrice,
      unitPrice,
      deliveryMultiplier: delivery.multiplier,
      bboxVolume: pricingVolume,
      isMinimumApplied: (pricingVolume * material.price * quality.multiplier) < PRICING_CONFIG.minimumPrice
    };
  }, [volume, bboxVolume, selectedTech, selectedMaterial, selectedQuality, quantity, selectedDelivery, tech, isOversized, isQuoteRequest]);

  // Générer le lien mailto (hors gabarit)
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

  // Générer le lien mailto (devis sur demande)
  const generateQuoteMailtoLink = () => {
    const selectedMat = tech.materials.find(m => m.id === selectedMaterial);
    const selectedQual = tech.qualities.find(q => q.id === selectedQuality);
    const selectedCol = tech.colors.find(c => c.id === selectedColor);

    const isUrgent = selectedDelivery === 'urgent';
    const isPro = finishType === 'pro';

    let reason = '';
    if (isSTLQuoteOnly && isUrgent && isPro) {
      reason = 'STL nécessitant vérification + Délai ultra rapide + Finition professionnelle';
    } else if (isSTLQuoteOnly && isUrgent) {
      reason = 'STL nécessitant vérification + Délai ultra rapide';
    } else if (isSTLQuoteOnly && isPro) {
      reason = 'STL nécessitant vérification + Finition professionnelle';
    } else if (isSTLQuoteOnly) {
      reason = 'STL nécessitant vérification manuelle';
    } else if (isUrgent && isPro) {
      reason = 'Délai ultra rapide + Finition professionnelle';
    } else if (isUrgent) {
      reason = 'Délai ultra rapide (moins de 3 jours)';
    } else {
      reason = 'Finition professionnelle';
    }

    const subject = encodeURIComponent(`Demande de devis - ${reason}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nJe souhaite obtenir un devis pour : ${reason}\n\n` +
      `Dimensions du modèle:\n` +
      `- X: ${dimensions?.x?.toFixed(1) || '?'} mm\n` +
      `- Y: ${dimensions?.y?.toFixed(1) || '?'} mm\n` +
      `- Z: ${dimensions?.z?.toFixed(1) || '?'} mm\n` +
      `- Volume: ${volume?.toFixed(2) || '?'} cm³\n\n` +
      `Configuration:\n` +
      `- Technologie: ${tech.name}\n` +
      `- Matériau: ${selectedMat?.name || '?'}\n` +
      `- Qualité: ${selectedQual?.name || '?'}\n` +
      `- Couleur: ${selectedCol?.name || '?'}\n` +
      `- Quantité: ${quantity}\n` +
      `- Finition: ${isPro ? 'Professionnelle' : 'Brut d\'impression'}\n` +
      `- Délai: ${isUrgent ? 'Moins de 3 jours' : 'Standard/Express'}\n\n` +
      `Merci de me recontacter.\n\nCordialement`
    );
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  // Handler pour le checkout
  const handleCheckout = () => {
    if (onCheckout) {
      const selectedMat = tech.materials.find(m => m.id === selectedMaterial);
      const selectedQual = tech.qualities.find(q => q.id === selectedQuality);
      const selectedCol = tech.colors.find(c => c.id === selectedColor);
      const selectedDel = DELIVERY_OPTIONS.find(d => d.id === selectedDelivery);

      onCheckout({
        technology: selectedTech,
        material: selectedMat,
        quality: selectedQual,
        color: selectedCol,
        quantity,
        finishType,
        delivery: selectedDel,
        volume,
        bboxVolume,
        dimensions,
        prices: priceDetails
      });
    }
  };

  // Quantité handlers
  const handleQuantityChange = (delta) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  if (!volume) {
    return null;
  }

  const selectedMat = tech.materials.find(m => m.id === selectedMaterial);
  const selectedQual = tech.qualities.find(q => q.id === selectedQuality);
  const selectedCol = tech.colors.find(c => c.id === selectedColor);
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

            {/* Sélection de la couleur */}
            <div className="option-group">
              <label className="option-label">Couleur</label>
              <div className="color-options">
                {tech.colors.map((color) => (
                  <button
                    key={color.id}
                    className={`color-option ${selectedColor === color.id ? 'selected' : ''}`}
                    onClick={() => setSelectedColor(color.id)}
                    title={color.name}
                  >
                    <span
                      className="color-swatch"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="color-name">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sélection de la quantité */}
            <div className="option-group">
              <label className="option-label">Quantité</label>
              <div className="quantity-selector">
                <button
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="quantity-value">{quantity}</span>
                <button
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Finition */}
            <div className="option-group">
              <label className="option-label">Finition</label>
              <div className="finish-toggle">
                <button
                  className={`finish-option ${finishType === 'brut' ? 'selected' : ''}`}
                  onClick={() => setFinishType('brut')}
                >
                  <span className="finish-title">Brut d'impression</span>
                  <span className="finish-price">Prix calculé</span>
                </button>
                <button
                  className={`finish-option ${finishType === 'pro' ? 'selected' : ''}`}
                  onClick={() => setFinishType('pro')}
                >
                  <span className="finish-title">Finition professionnelle</span>
                  <span className="finish-price">Devis sur demande</span>
                </button>
              </div>
              {finishType === 'pro' && (
                <p className="finish-info">
                  Finition professionnelle : devis sur demande. On revient vers vous sous 24h.
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
                    className={`delivery-option ${selectedDelivery === option.id ? 'selected' : ''} ${option.id === 'urgent' ? 'delivery-option--urgent' : ''}`}
                    onClick={() => setSelectedDelivery(option.id)}
                  >
                    <DeliveryIcon type={option.icon} />
                    <div className="delivery-option-content">
                      <span className="delivery-option-name">{option.name}</span>
                      {option.id !== 'urgent' && (
                        <span className="delivery-option-delay">{option.delay}</span>
                      )}
                    </div>
                    {option.id === 'urgent' ? (
                      <span className="delivery-option-price">Sur devis</span>
                    ) : (
                      <span className="delivery-option-price">
                        {option.multiplier === 1 ? 'Inclus' : ''}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {selectedDelivery === 'urgent' && (
                <p className="delivery-urgent-info">
                  Moins de 3 jours : sur devis. On revient vers vous sous 24h.
                </p>
              )}
            </div>

            {/* Résumé du prix */}
            <div className="price-summary">
              {isQuoteRequest ? (
                <>
                  <div className="quote-request-message">
                    <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <p>
                      {isSTLQuoteOnly
                        ? 'Votre fichier STL nécessite une vérification manuelle.'
                        : selectedDelivery === 'urgent' && finishType === 'pro'
                        ? 'Délai ultra rapide + Finition professionnelle sélectionnés.'
                        : selectedDelivery === 'urgent'
                        ? 'Délai ultra rapide sélectionné.'
                        : 'Finition professionnelle sélectionnée.'}
                      <br/>Devis personnalisé sous 24h.
                    </p>
                  </div>
                  <a href={generateQuoteMailtoLink()} className="checkout-btn checkout-btn--quote">
                    <svg viewBox="0 0 24 24" fill="none" className="checkout-icon">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Demander un devis
                  </a>
                </>
              ) : (
                <>
                  <div className="price-details">
                    <div className="price-line">
                      <span>Impression ({selectedMat?.name}, {selectedQual?.name})</span>
                      <span>{priceDetails.unitPrice.toFixed(2)}€</span>
                    </div>
                    {priceDetails.isMinimumApplied && (
                      <div className="price-line price-line--info">
                        <span>Prix minimum appliqué</span>
                        <span>{PRICING_CONFIG.minimumPrice.toFixed(2)}€</span>
                      </div>
                    )}
                    {quantity > 1 && (
                      <div className="price-line">
                        <span>× {quantity} pièces</span>
                        <span>{priceDetails.printPrice.toFixed(2)}€</span>
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
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PriceCalculator;
