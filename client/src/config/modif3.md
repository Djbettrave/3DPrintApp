# Ajout d'une section "Pas de modèle 3D ?" sur la page d'accueil

## Objectif
Créer une section élégante qui aide les utilisateurs n'ayant pas de fichier STL à en créer un, en proposant des outils IA gratuits et des services sur-mesure.

## Emplacement
Placer cette section **avant** la zone d'upload du fichier STL, sur la page d'accueil.

## Design requis
- Style cohérent avec le design actuel de l'application
- Utiliser la palette de couleurs existante (violet #6366f1, #8b5cf6)
- Cards modernes avec hover effects
- Responsive mobile-first
- Animations subtiles au scroll

## Structure de la section

### Titre principal
"Vous n'avez pas de modèle 3D ?"

### Sous-titre
"Pas de problème ! Voici plusieurs solutions pour créer votre fichier STL"

### 3 Cards côte à côte (responsive)

#### Card 1 : Outils IA (gratuits)
- **Icône** : 🤖 ou icône IA moderne
- **Titre** : "Générer avec l'IA"
- **Description** : "Créez un modèle 3D à partir de photos ou de descriptions textuelles"
- **Badge** : "Gratuit" (vert)
- **Outils listés** :
  - Meshy AI - Photo → 3D
  - Tripo3D - Texte → 3D
  - Rodin - Objet → 3D
- **Bouton** : "Voir les outils" (ouvre une modale avec liens)

#### Card 2 : Scan 3D
- **Icône** : 📸 ou icône scanner
- **Titre** : "Scan 3D professionnel"
- **Description** : "Vous avez l'objet physique ? Nous le scannerons pour vous"
- **Badge** : "Sur devis"
- **Points clés** :
  - Précision garantie
  - Fichier optimisé
  - Délai 48h
- **Bouton** : "Demander un devis"

#### Card 3 : Modélisation sur-mesure
- **Icône** : ✏️ ou icône CAD
- **Titre** : "Modélisation CAD"
- **Description** : "Projet complexe ? Nos experts modélisent votre pièce à partir de plans ou croquis"
- **Badge** : "Premium"
- **Points clés** :
  - Révisions incluses
  - Suivi personnalisé
  - Fichiers sources fournis
- **Bouton** : "Demander un devis"

## Fonctionnalités interactives

### Modale "Outils IA"
Lors du clic sur "Voir les outils" :
- Liste des 3 outils avec logos
- Brève description de chacun
- Lien externe vers chaque outil (s'ouvre dans un nouvel onglet)
- Note : "Une fois votre fichier généré, revenez le télécharger ici pour obtenir un devis instantané"

### Formulaire "Demander un devis" (Cards 2 et 3)
Ouvrir une modale avec formulaire simple :
- Nom + Email + Téléphone
- Type de service (scan / modélisation)
- Message / Description du projet
- Upload optionnel (photos, plans, croquis)
- Bouton "Envoyer la demande"

Backend : Envoyer un email à l'admin avec les infos.

## Code à générer

### Fichiers à créer
1. `client/src/components/NoModelSection.js` - Composant principal
2. `client/src/components/AIToolsModal.js` - Modale outils IA
3. `client/src/components/QuoteRequestModal.js` - Modale devis
4. CSS correspondant (ou styled-components si déjà utilisé)

### Intégration
- Importer dans `App.js`
- Placer avant le composant d'upload STL

### Liens outils IA
- Meshy : https://www.meshy.ai
- Tripo3D : https://www.tripo3d.ai
- Rodin : https://hyperhuman.deemos.com/rodin

## Style CSS demandé

- Cards avec `border-radius: 12px`
- Ombre portée subtile : `box-shadow: 0 4px 6px rgba(0,0,0,0.1)`
- Hover effect : légère élévation + changement d'ombre
- Badges avec coins arrondis
- Boutons avec gradient violet cohérent avec le reste de l'app
- Responsive : 3 colonnes desktop, 1 colonne mobile
- Animations : `transition: all 0.3s ease`

## Accessibilité
- Balises sémantiques HTML5
- Alt text pour les icônes
- Focus visible sur les boutons
- Contraste WCAG AA minimum

## Backend (optionnel pour plus tard)
Route API pour enregistrer les demandes de devis :
- `POST /api/quote-requests`
- Sauvegarder en base de données
- Envoyer email à l'admin (rayane.safollahi@gmail.com)

---

**Rappel** : Respecter le design et la palette de couleurs actuels de l'application. Tout doit être élégant, moderne et cohérent avec l'existant.
