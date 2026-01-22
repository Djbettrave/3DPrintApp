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
import MultiObjectErrorModal from './components/MultiObjectErrorModal';
import AssemblyWarningModal from './components/AssemblyWarningModal';
import { calculateVolume, calculateDimensions, mm3ToCm3 } from './utils/stlUtils';
import { analyzeSTLComplete } from './utils/stlAnalyzer';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

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

  // === FLOW 2 ÉTAPES ===
  // step: 'VERIFY' = étape 1 (vérification), 'UPLOAD_AND_CONFIG' = étape 2 (viewer + config)
  const [step, setStep] = useState('VERIFY');
  // stlCheckStatus: 'PENDING' | 'CHECKING' | 'PASS' | 'WARN' | 'FAIL'
  const [stlCheckStatus, setStlCheckStatus] = useState('PENDING');
  // quoteEligibility: 'ALLOWED' (devis instantané) | 'QUOTE_ONLY' (devis sur demande)
  const [quoteEligibility, setQuoteEligibility] = useState('QUOTE_ONLY');
  // Fichier sélectionné pour vérification (avant upload réel)
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');

  // États pour l'analyse multi-objets (modals)
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showMultiObjectError, setShowMultiObjectError] = useState(false);
  const [showAssemblyWarning, setShowAssemblyWarning] = useState(false);

  // === ÉTAPE 1 : Sélection du fichier ===
  const handleFileSelect = useCallback((file) => {
    const fileName = file?.name?.toLowerCase() || '';
    if (file && (fileName.endsWith('.stl') || fileName.endsWith('.obj'))) {
      setSelectedFile(file);
      setSelectedFileName(file.name);
      setStlCheckStatus('PENDING');
      setAnalysisResult(null);
    }
  }, []);

  // === ÉTAPE 1 : Vérification du fichier ===
  const handleVerify = useCallback(async () => {
    if (!selectedFile) return;

    setStlCheckStatus('CHECKING');

    try {
      // Lire le fichier localement
      const arrayBuffer = await selectedFile.arrayBuffer();

      // Parser le STL
      const loader = new STLLoader();
      const geometry = loader.parse(arrayBuffer);

      // Analyser pour détecter les objets multiples ET les trous
      const analysis = analyzeSTLComplete(geometry);
      setAnalysisResult(analysis);

      // Vérifier si des trous sont détectés
      const hasHoles = analysis.holes?.hasHoles;

      if (analysis.action === 'block') {
        // FAIL : Objets séparés
        setStlCheckStatus('FAIL');
        setQuoteEligibility('QUOTE_ONLY');
        setShowMultiObjectError(true);
      } else if (analysis.action === 'warn' || hasHoles) {
        // WARN : Assemblage détecté OU trous détectés
        setStlCheckStatus('WARN');
        setQuoteEligibility('QUOTE_ONLY');
        if (analysis.status === 'assembled_objects') {
          setShowAssemblyWarning(true);
        }
        // Note: les trous sont affichés dans le résultat de vérification
      } else {
        // PASS : Objet unique sans trous
        setStlCheckStatus('PASS');
        setQuoteEligibility('ALLOWED');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      // En cas d'erreur, WARN + QUOTE_ONLY
      setStlCheckStatus('WARN');
      setQuoteEligibility('QUOTE_ONLY');
      setAnalysisResult({ status: 'analysis_error', error: error.message });
    }
  }, [selectedFile]);

  // === ÉTAPE 1 → 2 : Continuer après vérification ===
  const handleContinueToStep2 = useCallback(async () => {
    if (!selectedFile) return;

    // Charger le fichier dans le viewer
    const arrayBuffer = await selectedFile.arrayBuffer();
    setFileData(arrayBuffer);
    setFileName(selectedFileName);
    setOriginalFile(selectedFile);
    setStep('UPLOAD_AND_CONFIG');

    // Fermer les modals si ouvertes
    setShowMultiObjectError(false);
    setShowAssemblyWarning(false);
  }, [selectedFile, selectedFileName]);

  // === ÉTAPE 2 : Quand le modèle est chargé dans le viewer ===
  const handleModelLoad = useCallback((geometry) => {
    // Calculer dimensions et volume (l'analyse a déjà été faite en étape 1)
    const dims = calculateDimensions(geometry);
    const vol = calculateVolume(geometry);
    setDimensions(dims);
    setVolume(mm3ToCm3(vol));
  }, []);

  // Legacy handler pour compatibilité avec FileUpload (si utilisé directement)
  const handleFileLoad = useCallback((data, name, file) => {
    setFileData(data);
    setFileName(name);
    setOriginalFile(file);
  }, []);

  // Charger un cube de démonstration (50x50x50mm)
  const handleDemoLoad = useCallback(() => {
    // Créer un cube STL binaire simple de 50x50x50mm
    const size = 50; // mm
    const halfSize = size / 2;

    // Définir les 12 triangles d'un cube (2 par face)
    const triangles = [
      // Face avant (z = halfSize)
      [[-halfSize, -halfSize, halfSize], [halfSize, -halfSize, halfSize], [halfSize, halfSize, halfSize], [0, 0, 1]],
      [[-halfSize, -halfSize, halfSize], [halfSize, halfSize, halfSize], [-halfSize, halfSize, halfSize], [0, 0, 1]],
      // Face arrière (z = -halfSize)
      [[halfSize, -halfSize, -halfSize], [-halfSize, -halfSize, -halfSize], [-halfSize, halfSize, -halfSize], [0, 0, -1]],
      [[halfSize, -halfSize, -halfSize], [-halfSize, halfSize, -halfSize], [halfSize, halfSize, -halfSize], [0, 0, -1]],
      // Face droite (x = halfSize)
      [[halfSize, -halfSize, halfSize], [halfSize, -halfSize, -halfSize], [halfSize, halfSize, -halfSize], [1, 0, 0]],
      [[halfSize, -halfSize, halfSize], [halfSize, halfSize, -halfSize], [halfSize, halfSize, halfSize], [1, 0, 0]],
      // Face gauche (x = -halfSize)
      [[-halfSize, -halfSize, -halfSize], [-halfSize, -halfSize, halfSize], [-halfSize, halfSize, halfSize], [-1, 0, 0]],
      [[-halfSize, -halfSize, -halfSize], [-halfSize, halfSize, halfSize], [-halfSize, halfSize, -halfSize], [-1, 0, 0]],
      // Face haut (y = halfSize)
      [[-halfSize, halfSize, halfSize], [halfSize, halfSize, halfSize], [halfSize, halfSize, -halfSize], [0, 1, 0]],
      [[-halfSize, halfSize, halfSize], [halfSize, halfSize, -halfSize], [-halfSize, halfSize, -halfSize], [0, 1, 0]],
      // Face bas (y = -halfSize)
      [[-halfSize, -halfSize, -halfSize], [halfSize, -halfSize, -halfSize], [halfSize, -halfSize, halfSize], [0, -1, 0]],
      [[-halfSize, -halfSize, -halfSize], [halfSize, -halfSize, halfSize], [-halfSize, -halfSize, halfSize], [0, -1, 0]],
    ];

    // Créer le buffer STL binaire
    const numTriangles = triangles.length;
    const bufferSize = 84 + (numTriangles * 50); // header(80) + numTriangles(4) + triangles(50 each)
    const buffer = new ArrayBuffer(bufferSize);
    const dataView = new DataView(buffer);

    // Header (80 bytes) - peut être vide
    for (let i = 0; i < 80; i++) {
      dataView.setUint8(i, 0);
    }

    // Nombre de triangles (4 bytes, little endian)
    dataView.setUint32(80, numTriangles, true);

    // Écrire chaque triangle
    let offset = 84;
    triangles.forEach(tri => {
      const [v1, v2, v3, normal] = tri;

      // Normal (3 floats)
      dataView.setFloat32(offset, normal[0], true); offset += 4;
      dataView.setFloat32(offset, normal[1], true); offset += 4;
      dataView.setFloat32(offset, normal[2], true); offset += 4;

      // Vertex 1
      dataView.setFloat32(offset, v1[0], true); offset += 4;
      dataView.setFloat32(offset, v1[1], true); offset += 4;
      dataView.setFloat32(offset, v1[2], true); offset += 4;

      // Vertex 2
      dataView.setFloat32(offset, v2[0], true); offset += 4;
      dataView.setFloat32(offset, v2[1], true); offset += 4;
      dataView.setFloat32(offset, v2[2], true); offset += 4;

      // Vertex 3
      dataView.setFloat32(offset, v3[0], true); offset += 4;
      dataView.setFloat32(offset, v3[1], true); offset += 4;
      dataView.setFloat32(offset, v3[2], true); offset += 4;

      // Attribute byte count (2 bytes)
      dataView.setUint16(offset, 0, true); offset += 2;
    });

    // Pour le cube démo, on passe directement à l'étape 2 avec PASS
    setFileData(buffer);
    setFileName('cube_demo_50mm.stl');
    setOriginalFile(null);
    setStep('UPLOAD_AND_CONFIG');
    setStlCheckStatus('PASS');
    setQuoteEligibility('ALLOWED');
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
    // Reset flow 2 étapes
    setStep('VERIFY');
    setStlCheckStatus('PENDING');
    setQuoteEligibility('QUOTE_ONLY');
    setSelectedFile(null);
    setSelectedFileName('');
    // Reset analyse multi-objets
    setAnalysisResult(null);
    setShowMultiObjectError(false);
    setShowAssemblyWarning(false);
  };

  // Handlers pour les modals d'analyse (étape 1)
  const handleMultiObjectErrorClose = () => {
    // Fermer la modal mais rester sur étape 1 avec le résultat FAIL
    // L'utilisateur peut quand même cliquer "Continuer"
    setShowMultiObjectError(false);
  };

  const handleAssemblyWarningContinue = () => {
    // L'utilisateur accepte de continuer avec l'assemblage
    // Passer à l'étape 2
    handleContinueToStep2();
  };

  const handleAssemblyWarningCancel = () => {
    // L'utilisateur annule - reset la sélection de fichier
    setShowAssemblyWarning(false);
    setSelectedFile(null);
    setSelectedFileName('');
    setStlCheckStatus('PENDING');
    setAnalysisResult(null);
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

  // Mode Landing - Étape 1 : Vérification
  if (step === 'VERIFY') {
    return (
      <div className="App App--scrollable">
        {/* Modals d'analyse */}
        <MultiObjectErrorModal
          isOpen={showMultiObjectError}
          onClose={handleMultiObjectErrorClose}
          componentCount={analysisResult?.components}
          minDistance={analysisResult?.minDistance}
        />
        <AssemblyWarningModal
          isOpen={showAssemblyWarning}
          onContinue={handleAssemblyWarningContinue}
          onCancel={handleAssemblyWarningCancel}
          componentCount={analysisResult?.components}
        />

        <header className="app-header">
          <div className="header-content">
            <div className="logo">
              <img src="/logo.svg" alt="Logo" className="logo-img" />
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
              Importez votre fichier .stl ou .obj, configurez vos options d'impression
              et recevez une estimation de prix instantanée.
            </p>
          </section>

          {/* Flow 2 étapes */}
          <section className="verify-flow">
            {/* ÉTAPE 1 : Chargement */}
            <div className="verify-step verify-step--active">
              <div className="verify-step-header">
                <span className="verify-step-number"></span>
                <h3>Charger mon fichier</h3>
                <span className="verify-step-badge">Obligatoire</span>
              </div>

              <div className="verify-step-content">
                {/* Zone de sélection de fichier */}
                <div className="file-select-zone">
                  <input
                    type="file"
                    id="stl-file-input"
                    accept=".stl,.obj"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    hidden
                  />
                  <label htmlFor="stl-file-input" className="file-select-label">
                    <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                      <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {selectedFileName ? (
                      <span className="file-selected-name">{selectedFileName}</span>
                    ) : (
                      <span>Sélectionner un fichier .stl ou .obj</span>
                    )}
                  </label>
                </div>

                {/* Bouton Charger */}
                {selectedFile && stlCheckStatus === 'PENDING' && (
                  <button className="verify-btn" onClick={handleVerify}>
                    Charger le fichier
                  </button>
                )}

                {/* Loader pendant vérification */}
                {stlCheckStatus === 'CHECKING' && (
                  <div className="verify-loader">
                    <div className="loader-spinner"></div>
                    <span>Analyse du modele en cours...</span>
                  </div>
                )}

                {/* Résultat de la vérification */}
                {stlCheckStatus === 'PASS' && (
                  <div className="verify-result verify-result--pass">
                    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>STL valide - devis instantane disponible</span>
                  </div>
                )}
                {stlCheckStatus === 'WARN' && (
                  <div className="verify-result verify-result--warn">
                    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                      <path d="M12 9V13M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.56 20.74C2.87 20.92 3.22 21.01 3.58 21H20.42C20.78 21.01 21.13 20.92 21.44 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.32 12.97 3.15C12.66 2.98 12.32 2.89 11.97 2.89C11.62 2.89 11.28 2.98 10.97 3.15C10.67 3.32 10.41 3.56 10.23 3.86H10.29Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div className="verify-result-text">
                      <span>STL a verifier - devis sur demande</span>
                      {analysisResult?.holes?.hasHoles && (
                        <span className="verify-detail">
                          Mesh non-etanche detecte ({analysisResult.holes.openEdgeCount} aretes ouvertes)
                        </span>
                      )}
                      {analysisResult?.status === 'assembled_objects' && (
                        <span className="verify-detail">
                          Assemblage de {analysisResult.components} objets detecte
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {stlCheckStatus === 'FAIL' && (
                  <div className="verify-result verify-result--fail">
                    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>STL non conforme - devis sur demande</span>
                  </div>
                )}

                {/* Bouton Continuer (visible après vérification) */}
                {(stlCheckStatus === 'PASS' || stlCheckStatus === 'WARN' || stlCheckStatus === 'FAIL') && (
                  <button className="continue-btn" onClick={handleContinueToStep2}>
                    Continuer
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

          </section>

          {/* Option cube démo */}
          <div className="demo-option">
            <p>
              Pas de fichier 3D ?{' '}
              <button className="demo-link" onClick={handleDemoLoad}>
                Testez avec un cube demo
              </button>{' '}
              pour estimer un prix.
            </p>
          </div>

          {/* No Model Section */}
          <NoModelSection />

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
          <p>Formats acceptés : .stl et .obj</p>
        </footer>
      </div>
    );
  }

  // Mode Configurateur (fichier chargé)
  return (
    <div className="App">
      {/* Modals d'analyse multi-objets */}
      <MultiObjectErrorModal
        isOpen={showMultiObjectError}
        onClose={handleMultiObjectErrorClose}
        componentCount={analysisResult?.components}
        minDistance={analysisResult?.minDistance}
      />
      <AssemblyWarningModal
        isOpen={showAssemblyWarning}
        onContinue={handleAssemblyWarningContinue}
        onCancel={handleAssemblyWarningCancel}
        componentCount={analysisResult?.components}
      />

      <header className="app-header app-header--compact">
        <div className="header-content">
          <div className="logo logo--clickable" onClick={handleReset} title="Retour à l'accueil">
            <img src="/logo.svg" alt="Logo" className="logo-img logo-img--small" />
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
            quoteEligibility={quoteEligibility}
          />
        </aside>
      </main>
    </div>
  );
}

export default App;
