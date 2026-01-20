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
// TECHNOLOGIE FDM (Filament)
// ----------------------------------------
export const FDM_CONFIG = {
  // Dimensions maximales de la zone d'impression (en mm)
  maxSize: { x: 400, y: 400, z: 400 },

  // Matériaux disponibles
  materials: [
    {
      id: 'PLA',
      name: 'PLA',
      price: 0.03,           // Prix en €/cm³
      color: '#22c55e',      // Couleur d'affichage (vert)
      desc: 'Standard, biodégradable'
    },
    {
      id: 'PETG',
      name: 'PETG',
      price: 0.04,           // Prix en €/cm³
      color: '#3b82f6',      // Couleur d'affichage (bleu)
      desc: 'Résistant, flexible'
    },
    {
      id: 'ABS',
      name: 'ABS',
      price: 0.05,           // Prix en €/cm³
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
      multiplier: 1.5        // Multiplicateur de prix (×1.5)
    },
    {
      id: 'normal',
      name: 'Standard',
      layer: '0.2mm',
      desc: 'Équilibre qualité/temps',
      multiplier: 1.0        // Prix de base (×1.0)
    },
    {
      id: 'draft',
      name: 'Rapide',
      layer: '0.28mm',
      desc: 'Prototype rapide',
      multiplier: 0.8        // Réduction de prix (×0.8)
    }
  ]
};

// ----------------------------------------
// TECHNOLOGIE SLA (Résine)
// ----------------------------------------
export const SLA_CONFIG = {
  // Dimensions maximales de la zone d'impression (en mm)
  maxSize: { x: 300, y: 200, z: 120 },

  // Matériaux disponibles
  materials: [
    {
      id: 'standard',
      name: 'Résine Standard',
      price: 0.12,           // Prix en €/cm³
      color: '#8b5cf6',      // Couleur d'affichage (violet)
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
