import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '16px',
      '::placeholder': {
        color: '#606070',
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
      // En production, vous créeriez un PaymentIntent côté serveur
      // et utiliseriez le client_secret retourné
      // Pour la démo, on simule un succès

      const cardElement = elements.getElement(CardElement);

      // Créer un token de paiement (pour la démo)
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
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
      });

      if (stripeError) {
        setError(stripeError.message);
        setIsProcessing(false);
        return;
      }

      // Simuler un appel API pour créer la commande
      // En production, envoyez paymentMethod.id au serveur
      console.log('Payment Method:', paymentMethod);
      console.log('Order:', { ...orderData, customer: formData });

      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Succès
      if (onSuccess) {
        onSuccess({
          orderId: `ORD-${Date.now()}`,
          paymentMethod: paymentMethod.id,
          customer: formData,
          order: orderData,
        });
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
      formData.phone
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
              disabled={!stripe || isProcessing || !isFormValid()}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  Traitement en cours...
                </>
              ) : (
                <>
                  Payer {orderData?.prices?.totalPrice?.toFixed(2)} €
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
              <h4>Livraison</h4>
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

            <div className="summary-total">
              <span>Total</span>
              <span>{orderData?.prices?.totalPrice?.toFixed(2)} €</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
