/**
 * ========================================
 * CONFIGURATION DES PRIX - PrintQuote
 * ========================================
 *
 * Modifiez les valeurs ci-dessous pour ajuster les prix
 * de votre application de devis impression 3D.
 *
 * Les changements seront appliqués automatiquement
 * après un rafraîchissement de la page.
 */

// ----------------------------------------
// PARAMÈTRES DE TARIFICATION GLOBAUX
// ----------------------------------------
export const PRICING_CONFIG = {
  // Utiliser le volume de la bounding box au lieu du volume réel du modèle
  // La bbox inclut implicitement l'espace pour les supports
  useBoundingBoxVolume: true,

  // Nouveau modèle de prix : Frais fixes + Prix variable
  // Prix = fixedCost + (Volume × pricePerCm3 × Qualité × Matériau)
  fixedCost: 12.00,              // Frais fixes : préparation, contrôle qualité, machine
  pricePerCm3: 0.020,            // Prix variable par cm³ (matière + temps)

  // Prix minimum (sécurité pour très petites pièces)
  minimumPrice: 15.00,           // Prix minimum en €

  // Anciens paramètres (pour référence)
  // hourlyRate: 2.50,           // Taux horaire machine en €/h
  // printSpeedCm3PerHour: 15,   // Vitesse moyenne FDM en cm³/h
  // fillFactor: 0.20            // 20% de la bbox est réellement imprimé
};

// ----------------------------------------
// TECHNOLOGIE FDM (Filament)
// ----------------------------------------
export const FDM_CONFIG = {
  // Dimensions maximales de la zone d'impression (en mm)
  maxSize: { x: 300, y: 300, z: 300 },

  // Matériaux disponibles
  materials: [
    {
      id: 'PLA',
      name: 'PLA',
      price: 0.025,           // Prix en €/cm³
      color: '#22c55e',      // Couleur d'affichage (vert)
      desc: 'Standard, biodégradable'
    },
    {
      id: 'PETG',
      name: 'PETG',
      price: 0.028,           // Prix en €/cm³
      color: '#3b82f6',      // Couleur d'affichage (bleu)
      desc: 'Résistant, flexible'
    },
    {
      id: 'ABS',
      name: 'ABS',
      price: 0.03,           // Prix en €/cm³
      color: '#f59e0b',      // Couleur d'affichage (orange)
      desc: 'Durable, haute température'
    }
  ],

  // Couleurs disponibles
  colors: [
    { id: 'noir', name: 'Noir', hex: '#1a1a1a' },
    { id: 'blanc', name: 'Blanc', hex: '#f5f5f5' }
  ],

  // Niveaux de qualité
  qualities: [
    {
      id: 'fine',
      name: 'Fine',
      layer: '0.1mm',
      desc: 'Haute qualité, plus long',
      multiplier: 1.2        // Multiplicateur de prix (×1.5)
    },
    {
      id: 'normal',
      name: 'Standard',
      layer: '0.2mm',
      desc: 'Équilibre qualité/temps',
      multiplier: 1.1       // Prix de base (×1.0)
    },
    {
      id: 'draft',
      name: 'Rapide',
      layer: '0.28mm',
      desc: 'Prototype rapide',
      multiplier: 1       // Réduction de prix (×0.8)
    }
  ]
};

// ----------------------------------------
// TECHNOLOGIE SLA (Résine)
// ----------------------------------------
export const SLA_CONFIG = {
  // Dimensions maximales de la zone d'impression (en mm)
  maxSize: { x: 250, y: 160, z: 250 },

  // Matériaux disponibles
  materials: [
    {
      id: 'standard',
      name: 'Résine Standard',
      price: 0.2,           // Prix en €/cm³
      color: '#4e7396',      // Couleur d'affichage (bleu ardoise)
      desc: 'Polyvalente, finition lisse'
    }
  ],

  // Couleurs disponibles
  colors: [
    { id: 'blanc', name: 'Blanc', hex: '#f5f5f5' },
    { id: 'gris', name: 'Gris', hex: '#9ca3af' }
  ],

  // Niveaux de qualité
  qualities: [
    {
      id: 'ultra',
      name: 'Ultra-fine',
      layer: '0.025mm',
      desc: 'Détails extrêmes',
      multiplier: 1.8        // Multiplicateur de prix (×1.8)
    },
    {
      id: 'fine',
      name: 'Fine',
      layer: '0.05mm',
      desc: 'Haute précision',
      multiplier: 1.3        // Multiplicateur de prix (×1.3)
    },
    {
      id: 'normal',
      name: 'Standard',
      layer: '0.1mm',
      desc: 'Qualité optimale',
      multiplier: 1.0        // Prix de base (×1.0)
    }
  ]
};

// ----------------------------------------
// POST-TRAITEMENT (Finition)
// ----------------------------------------
export const POST_PROCESSING_CONFIG = {
  // Seuil de volume pour le tarif (en cm³)
  smallThreshold: 100,

  // Prix pour les petites pièces (< seuil)
  smallPrice: 15,            // Prix en €

  // Prix pour les grandes pièces (>= seuil)
  largePrice: 25             // Prix en €
};

// ----------------------------------------
// DÉLAIS DE LIVRAISON
// ----------------------------------------
export const DELIVERY_CONFIG = {
  options: [
    {
      id: 'standard',
      name: 'Standard',
      delay: '7-10 jours',
      icon: 'slow',
      multiplier: 1.0,         // Pas de surcoût (×1.0)
      desc: 'Livraison économique'
    },
    {
      id: 'express',
      name: 'Express',
      delay: '3-5 jours',
      icon: 'fast',
      multiplier: 1.3,         // +30% du prix impression
      desc: 'Priorité de production'
    },
    {
      id: 'urgent',
      name: 'Moins de 3 jours',
      delay: '24-48h',
      icon: 'lightning',
      multiplier: 1.5,         // +50% du prix impression
      desc: 'Traitement immédiat'
    }
  ]
};

// ----------------------------------------
// TRANSPORTEURS (Frais de port)
// ----------------------------------------
// Tarifs avec marge de 20% incluse
export const SHIPPING_CONFIG = {
  // Densité moyenne pour estimer le poids (g/cm³)
  // PLA: ~1.24, PETG: ~1.27, ABS: ~1.04, Résine: ~1.1
  // On utilise une moyenne basse car les pièces ne sont pas pleines
  averageDensity: 0.25,  // g/cm³ (pièce avec ~20% remplissage)

  carriers: [
    {
      id: 'mondial_relay',
      name: 'Mondial Relay',
      delay: '3-5 jours',
      icon: 'relay',
      desc: 'Point relais',
      rates: [
        { maxWeight: 500, price: 5.40 },
        { maxWeight: 1000, price: 7.10 },
        { maxWeight: 2000, price: 8.30 },
        { maxWeight: 5000, price: 10.20 },
        { maxWeight: 10000, price: 15.00 },
        { maxWeight: 30000, price: 30.00 }
      ]
    },
    {
      id: 'colissimo',
      name: 'Colissimo',
      delay: '48h',
      icon: 'box',
      desc: 'Livraison domicile',
      rates: [
        { maxWeight: 500, price: 9.00 },
        { maxWeight: 1000, price: 10.20 },
        { maxWeight: 2000, price: 12.90 },
        { maxWeight: 5000, price: 18.00 },
        { maxWeight: 10000, price: 26.40 },
        { maxWeight: 30000, price: 45.60 }
      ]
    },
    {
      id: 'chronopost',
      name: 'Chronopost',
      delay: '24h',
      icon: 'lightning',
      desc: 'Express',
      rates: [
        { maxWeight: 500, price: 18.00 },
        { maxWeight: 1000, price: 21.60 },
        { maxWeight: 2000, price: 26.40 },
        { maxWeight: 5000, price: 33.60 },
        { maxWeight: 10000, price: 45.60 },
        { maxWeight: 30000, price: 66.00 }
      ]
    }
  ]
};

// ----------------------------------------
// EMAIL DE CONTACT
// ----------------------------------------
export const CONTACT_EMAIL = 'contact@example.com';

// ----------------------------------------
// NE PAS MODIFIER CI-DESSOUS
// (Configuration assemblée pour l'application)
// ----------------------------------------
export const TECHNOLOGIES = {
  FDM: {
    id: 'fdm',
    name: 'FDM - Filament',
    description: 'Prototypage, pièces fonctionnelles',
    maxSize: FDM_CONFIG.maxSize,
    materials: FDM_CONFIG.materials,
    qualities: FDM_CONFIG.qualities,
    colors: FDM_CONFIG.colors
  },
  SLA: {
    id: 'sla',
    name: 'SLA - Résine',
    description: 'Finition premium, haute précision',
    maxSize: SLA_CONFIG.maxSize,
    materials: SLA_CONFIG.materials,
    qualities: SLA_CONFIG.qualities,
    colors: SLA_CONFIG.colors
  }
};

export const POST_PROCESSING = {
  smallThreshold: POST_PROCESSING_CONFIG.smallThreshold,
  smallPrice: POST_PROCESSING_CONFIG.smallPrice,
  largePrice: POST_PROCESSING_CONFIG.largePrice
};

export const DELIVERY_OPTIONS = DELIVERY_CONFIG.options;

export const SHIPPING_CARRIERS = SHIPPING_CONFIG.carriers;

// Fonction utilitaire pour calculer le poids estimé
export const estimateWeight = (volumeCm3) => {
  // Retourne le poids en grammes
  return volumeCm3 * SHIPPING_CONFIG.averageDensity;
};

// Fonction utilitaire pour obtenir le prix d'expédition
export const getShippingPrice = (carrierId, weightGrams) => {
  const carrier = SHIPPING_CONFIG.carriers.find(c => c.id === carrierId);
  if (!carrier) return null;

  // Poids minimum de 100g pour l'emballage
  const totalWeight = Math.max(weightGrams + 100, 200);

  const rate = carrier.rates.find(r => totalWeight <= r.maxWeight);
  return rate ? rate.price : null; // null si trop lourd
};
