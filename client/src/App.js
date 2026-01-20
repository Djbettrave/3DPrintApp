import React, { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import './App.css';
import FileUpload from './components/FileUpload';
import STLViewer from './components/STLViewer';
import ModelInfo from './components/ModelInfo';
import PriceCalculator from './components/PriceCalculator';
import Checkout from './components/Checkout';
import OrderSuccess from './components/OrderSuccess';
import NoModelSection from './components/NoModelSection';
import { calculateVolume, calculateDimensions, mm3ToCm3 } from './utils/stlUtils';

// Clé publique Stripe (remplacez par votre clé en production)
// Pour tester, utilisez une clé de test Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_votre_cle_publique');

const STRIPE_OPTIONS = {
  appearance: {
    theme: 'night',
    variables: {
      colorPrimary: '#6366f1',
      colorBackground: '#16161f',
      colorText: '#ffffff',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      borderRadius: '10px',
    },
  },
};

function App() {
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [originalFile, setOriginalFile] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [volume, setVolume] = useState(0);

  // États pour le flow de commande
  const [currentView, setCurrentView] = useState('configurator'); // 'configurator', 'checkout', 'success'
  const [orderData, setOrderData] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  const handleFileLoad = useCallback((data, name, file) => {
    setFileData(data);
    setFileName(name);
    setOriginalFile(file);
  }, []);

  const handleModelLoad = useCallback((geometry) => {
    const dims = calculateDimensions(geometry);
    const vol = calculateVolume(geometry);
    setDimensions(dims);
    setVolume(mm3ToCm3(vol));
  }, []);

  const handleScaleApply = useCallback((newDimensions, newVolumeCm3) => {
    setDimensions(newDimensions);
    setVolume(newVolumeCm3);
  }, []);

  const handleReset = () => {
    setFileData(null);
    setFileName('');
    setOriginalFile(null);
    setDimensions(null);
    setVolume(0);
    setCurrentView('configurator');
    setOrderData(null);
    setOrderDetails(null);
  };

  const handleCheckout = (data) => {
    setOrderData({ ...data, stlFile: originalFile, fileName });
    setCurrentView('checkout');
  };

  const handleBackFromCheckout = () => {
    setCurrentView('configurator');
  };

  const handleOrderSuccess = (details) => {
    setOrderDetails(details);
    setCurrentView('success');
  };

  // Page de succès
  if (currentView === 'success') {
    return (
      <div className="App App--scrollable">
        <Elements stripe={stripePromise} options={STRIPE_OPTIONS}>
          <OrderSuccess orderDetails={orderDetails} onNewOrder={handleReset} />
        </Elements>
      </div>
    );
  }

  // Page de checkout
  if (currentView === 'checkout') {
    return (
      <div className="App App--scrollable">
        <Elements stripe={stripePromise} options={STRIPE_OPTIONS}>
          <Checkout
            orderData={orderData}
            onBack={handleBackFromCheckout}
            onSuccess={handleOrderSuccess}
          />
        </Elements>
      </div>
    );
  }

  // Mode Landing (pas de fichier chargé)
  if (!fileData) {
    return (
      <div className="App">
        <header className="app-header">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="logo-text">
                <h1>Devis Impression 3D</h1>
                <p>FDM & Résine - Prix instantané</p>
              </div>
            </div>
          </div>
        </header>

        <main className="landing-main">
          {/* Hero Section */}
          <section className="landing-hero">
            <h2 className="hero-title">
              Obtenez votre devis<br />
              <span className="hero-highlight">en quelques secondes</span>
            </h2>
            <p className="hero-subtitle">
              Importez votre fichier STL, configurez vos options d'impression
              et recevez une estimation de prix instantanée.
            </p>
          </section>

          {/* Steps */}
          <section className="landing-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Importez</h4>
                <p>Glissez votre fichier STL</p>
              </div>
            </div>
            <div className="step-arrow">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Configurez</h4>
                <p>Matériau, qualité, finition</p>
              </div>
            </div>
            <div className="step-arrow">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Commandez</h4>
                <p>Paiement sécurisé</p>
              </div>
            </div>
          </section>

          {/* No Model Section */}
          <NoModelSection />

          {/* Upload Zone */}
          <section className="landing-upload">
            <FileUpload onFileLoad={handleFileLoad} />
          </section>

          {/* Features */}
          <section className="landing-features">
            <div className="feature">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h5>Instantané</h5>
              <p>Résultat en temps réel</p>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h5>FDM & Résine</h5>
              <p>Deux technologies disponibles</p>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h5>Paiement sécurisé</h5>
              <p>Stripe intégré</p>
            </div>
          </section>
        </main>

        <footer className="app-footer">
          <p>Formats acceptés : STL</p>
        </footer>
      </div>
    );
  }

  // Mode Configurateur (fichier chargé)
  return (
    <div className="App">
      <header className="app-header app-header--compact">
        <div className="header-content">
          <div className="logo logo--clickable" onClick={handleReset} title="Retour à l'accueil">
            <div className="logo-icon logo-icon--small">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="logo-text">
              <h1>Devis Impression 3D</h1>
            </div>
          </div>
          <button className="header-reset-btn" onClick={handleReset}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
              <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 12L6 9M3 12L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Nouveau fichier
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="viewer-section">
          <STLViewer
            fileData={fileData}
            onModelLoad={handleModelLoad}
            onScaleApply={handleScaleApply}
          />
        </div>

        <aside className="sidebar">
          <ModelInfo
            dimensions={dimensions}
            volume={volume}
            fileName={fileName}
          />
          <PriceCalculator
            volume={volume}
            dimensions={dimensions}
            onCheckout={handleCheckout}
          />
        </aside>
      </main>
    </div>
  );
}

export default App;
