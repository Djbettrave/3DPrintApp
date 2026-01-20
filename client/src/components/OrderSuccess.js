import React from 'react';

function OrderSuccess({ orderDetails, onNewOrder }) {
  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1>Commande confirmée !</h1>
        <p className="success-message">
          Merci pour votre commande. Vous recevrez un email de confirmation
          à l'adresse <strong>{orderDetails?.customer?.email}</strong>.
        </p>

        <div className="order-info">
          <div className="order-info-row">
            <span>Numéro de commande</span>
            <span className="order-id">{orderDetails?.orderId}</span>
          </div>
          <div className="order-info-row">
            <span>Montant payé</span>
            <span>{orderDetails?.order?.prices?.totalPrice?.toFixed(2)} €</span>
          </div>
          <div className="order-info-row">
            <span>Délai de livraison</span>
            <span>{orderDetails?.order?.delivery?.delay}</span>
          </div>
        </div>

        <div className="next-steps">
          <h3>Prochaines étapes</h3>
          <ol>
            <li>Vous recevrez un email de confirmation</li>
            <li>Votre commande sera traitée sous 24h</li>
            <li>Un email de suivi vous sera envoyé à l'expédition</li>
          </ol>
        </div>

        <button className="new-order-btn" onClick={onNewOrder}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Nouvelle commande
        </button>
      </div>
    </div>
  );
}

export default OrderSuccess;
