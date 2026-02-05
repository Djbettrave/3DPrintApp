import React, { useState, useMemo } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { SHIPPING_CARRIERS, estimateWeight, getShippingPrice } from '../config/pricing';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#0f172a',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '16px',
      '::placeholder': {
        color: '#94a3b8',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

function Checkout({ orderData, onBack, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCarrier, setSelectedCarrier] = useState('colissimo');
  const [acceptRGPD, setAcceptRGPD] = useState(false);

  // Calcul du poids et prix de livraison
  const shippingInfo = useMemo(() => {
    const weight = estimateWeight(orderData?.volume || 0);
    const price = getShippingPrice(selectedCarrier, weight);
    const carrier = SHIPPING_CARRIERS.find(c => c.id === selectedCarrier);
    return { weight, price, carrier };
  }, [orderData?.volume, selectedCarrier]);

  // Total avec frais de port
  const totalWithShipping = useMemo(() => {
    const baseTotal = orderData?.prices?.totalPrice || 0;
    return baseTotal + (shippingInfo.price || 0);
  }, [orderData?.prices?.totalPrice, shippingInfo.price]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      // Créer le PaymentIntent côté serveur
      const response = await fetch(`${API_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalWithShipping,
          metadata: {
            technology: orderData.technology,
            material: orderData.material?.name,
            quality: orderData.quality?.name,
            volume: String(orderData.volume?.toFixed(2)),
            delivery: orderData.delivery?.name,
            shippingCarrier: shippingInfo.carrier?.name,
            shippingPrice: String(shippingInfo.price?.toFixed(2)),
            customerEmail: formData.email,
            customerName: `${formData.firstName} ${formData.lastName}`,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du paiement');
      }

      const { clientSecret } = await response.json();

      // Confirmer le paiement avec Stripe
      const cardElement = elements.getElement(CardElement);
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
            address: {
              line1: formData.address,
              city: formData.city,
              postal_code: formData.postalCode,
              country: 'FR',
            },
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setIsProcessing(false);
        return;
      }

      // Succès - Sauvegarder la commande en BDD
      if (paymentIntent.status === 'succeeded') {
        try {
          // 1. Sauvegarder la commande
          await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: paymentIntent.id,
              stripePaymentId: paymentIntent.id,
              customer: formData,
              order: {
                ...orderData,
                shippingCarrier: shippingInfo.carrier?.name,
                shippingPrice: shippingInfo.price,
                prices: {
                  ...orderData.prices,
                  totalPrice: totalWithShipping
                }
              },
            }),
          });

          // 2. Uploader le fichier STL
          if (orderData.stlFile) {
            const fileFormData = new FormData();
            fileFormData.append('stlFile', orderData.stlFile);

            const uploadResponse = await fetch(`${API_URL}/api/upload-stl`, {
              method: 'POST',
              body: fileFormData,
            });

            if (uploadResponse.ok) {
              const { fileKey, fileName, fileSize } = await uploadResponse.json();

              // 3. Associer le fichier à la commande
              await fetch(`${API_URL}/api/orders/${paymentIntent.id}/file`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileKey, fileName, fileSize }),
              });
              console.log('STL file uploaded successfully');
            }
          }
        } catch (saveError) {
          console.error('Order/upload error:', saveError);
          // On continue quand même, le paiement a réussi
        }

        if (onSuccess) {
          onSuccess({
            orderId: paymentIntent.id,
            customer: formData,
            order: orderData,
          });
        }
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      console.error('Payment error:', err);
    }

    setIsProcessing(false);
  };

  const isFormValid = () => {
    return (
      formData.email &&
      formData.firstName &&
      formData.lastName &&
      formData.address &&
      formData.city &&
      formData.postalCode &&
      formData.phone &&
      acceptRGPD
    );
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Header */}
        <div className="checkout-header">
          <button className="back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Retour
          </button>
          <h2>Finaliser la commande</h2>
        </div>

        <div className="checkout-content">
          {/* Formulaire */}
          <form className="checkout-form" onSubmit={handleSubmit}>
            {/* Informations de contact */}
            <section className="form-section">
              <h3>Informations de contact</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Prénom</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Jean"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Nom</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="phone">Téléphone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="06 12 34 56 78"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Adresse de livraison */}
            <section className="form-section">
              <h3>Adresse de livraison</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="address">Adresse</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Rue de la République"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="postalCode">Code postal</label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="75001"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="city">Ville</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Paris"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Mode de livraison */}
            <section className="form-section">
              <h3>Mode de livraison</h3>
              <div className="shipping-carriers">
                {SHIPPING_CARRIERS.map(carrier => {
                  const price = getShippingPrice(carrier.id, shippingInfo.weight);
                  return (
                    <label
                      key={carrier.id}
                      className={`carrier-option ${selectedCarrier === carrier.id ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="carrier"
                        value={carrier.id}
                        checked={selectedCarrier === carrier.id}
                        onChange={(e) => setSelectedCarrier(e.target.value)}
                      />
                      <div className="carrier-icon">
                        {carrier.icon === 'relay' && (
                          <svg viewBox="0 0 24 24" fill="none">
                            <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        )}
                        {carrier.icon === 'box' && (
                          <svg viewBox="0 0 24 24" fill="none">
                            <path d="M21 8V21H3V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M23 3H1V8H23V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        )}
                        {carrier.icon === 'lightning' && (
                          <svg viewBox="0 0 24 24" fill="none">
                            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div className="carrier-info">
                        <span className="carrier-name">{carrier.name}</span>
                        <span className="carrier-delay">{carrier.delay} • {carrier.desc}</span>
                      </div>
                      <span className="carrier-price">
                        {price !== null ? `${price.toFixed(2)}€` : 'Indisponible'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Paiement */}
            <section className="form-section">
              <h3>Paiement</h3>
              <div className="card-element-wrapper">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
              </div>
              <div className="secure-badge">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Paiement sécurisé par Stripe
              </div>
            </section>

            {/* RGPD */}
            <div className="rgpd-section">
              <label className="rgpd-checkbox">
                <input
                  type="checkbox"
                  checked={acceptRGPD}
                  onChange={(e) => setAcceptRGPD(e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="rgpd-text">
                  J'accepte les{' '}
                  <a href="/conditions-generales" target="_blank" rel="noopener noreferrer">
                    conditions générales de vente
                  </a>{' '}
                  et la{' '}
                  <a href="/politique-confidentialite" target="_blank" rel="noopener noreferrer">
                    politique de confidentialité
                  </a>
                  . Conformément au RGPD, vos données personnelles sont utilisées uniquement
                  pour le traitement de votre commande.
                </span>
              </label>
            </div>

            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={!stripe || isProcessing || !isFormValid() || !shippingInfo.price}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  Traitement en cours...
                </>
              ) : (
                <>
                  Payer {totalWithShipping.toFixed(2)} €
                </>
              )}
            </button>
          </form>

          {/* Récapitulatif */}
          <aside className="order-summary">
            <h3>Récapitulatif</h3>

            <div className="summary-section">
              <h4>Impression 3D</h4>
              <div className="summary-row">
                <span>Technologie</span>
                <span>{orderData?.technology}</span>
              </div>
              <div className="summary-row">
                <span>Matériau</span>
                <span>{orderData?.material?.name}</span>
              </div>
              <div className="summary-row">
                <span>Qualité</span>
                <span>{orderData?.quality?.name} ({orderData?.quality?.layer})</span>
              </div>
              <div className="summary-row">
                <span>Volume</span>
                <span>{orderData?.volume?.toFixed(2)} cm³</span>
              </div>
            </div>

            {orderData?.postProcessing && (
              <div className="summary-section">
                <h4>Finition</h4>
                <div className="summary-row">
                  <span>Ponçage + Apprêt</span>
                  <span>+{orderData?.prices?.finishingPrice?.toFixed(2)}€</span>
                </div>
              </div>
            )}

            <div className="summary-section">
              <h4>Production</h4>
              <div className="summary-row">
                <span>{orderData?.delivery?.name}</span>
                <span>{orderData?.delivery?.delay}</span>
              </div>
              {orderData?.prices?.deliveryExtra > 0 && (
                <div className="summary-row">
                  <span>Supplément express</span>
                  <span>+{orderData?.prices?.deliveryExtra?.toFixed(2)}€</span>
                </div>
              )}
            </div>

            <div className="summary-section">
              <h4>Livraison</h4>
              <div className="summary-row">
                <span>{shippingInfo.carrier?.name}</span>
                <span>{shippingInfo.carrier?.delay}</span>
              </div>
              <div className="summary-row">
                <span>Frais de port</span>
                <span>+{shippingInfo.price?.toFixed(2)}€</span>
              </div>
            </div>

            <div className="summary-total">
              <span>Total</span>
              <span>{totalWithShipping.toFixed(2)} €</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
