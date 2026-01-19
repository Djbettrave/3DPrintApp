# 3D Print App - Documentation Technique

## Vue d'ensemble

Application web de devis et commande d'impression 3D avec :
- Upload et visualisation de fichiers STL
- Calcul automatique du prix selon volume, matériau, qualité
- Paiement en ligne via Stripe
- Stockage des fichiers STL pour l'atelier
- Notifications email automatiques

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   FRONTEND      │     │    BACKEND      │     │   SERVICES      │
│   (Vercel)      │────▶│    (Render)     │────▶│                 │
│                 │     │                 │     │  - Stripe       │
│   React 18      │     │   Express.js    │     │  - PostgreSQL   │
│   Three.js      │     │   Node.js       │     │  - Cloudflare R2│
│                 │     │                 │     │  - Resend       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Étapes de création (Feuille de route)

### Phase 1 : Base de l'application
- [x] Création projet React (Create React App)
- [x] Composant FileUpload (drag & drop STL)
- [x] Visualisation 3D avec Three.js / React Three Fiber
- [x] Calcul du volume et dimensions du modèle
- [x] Interface dark theme responsive

### Phase 2 : Configuration des prix
- [x] Fichier de configuration `pricing.js`
- [x] Support technologie FDM (filament)
- [x] Support technologie SLA (résine)
- [x] Matériaux configurables (PLA, PETG, ABS, Résine Standard)
- [x] Qualités d'impression (Draft, Standard, Fine)
- [x] Options de post-traitement (ponçage + apprêt)
- [x] Limites de taille par technologie

### Phase 3 : Options de livraison
- [x] Livraison Standard (7-10 jours) - prix de base
- [x] Livraison Express (3-5 jours) - +30%
- [x] Livraison Urgent (24-48h) - +50%
- [x] Pourcentages configurables dans `pricing.js`

### Phase 4 : Paiement Stripe
- [x] Intégration Stripe Elements
- [x] Création PaymentIntent côté serveur
- [x] Formulaire de checkout (infos client + carte)
- [x] Page de confirmation de commande

### Phase 5 : Déploiement
- [x] Repository GitHub créé
- [x] Frontend déployé sur Vercel
- [x] Backend déployé sur Render
- [x] Configuration des variables d'environnement

### Phase 6 : Base de données
- [x] PostgreSQL sur Render
- [x] Table `orders` avec toutes les infos commande
- [x] API REST pour CRUD commandes
- [x] Endpoint pour mettre à jour le statut

### Phase 7 : Emails automatiques
- [x] Intégration Resend (remplace Nodemailer bloqué)
- [x] Domaine vérifié : inphenix-system.fr
- [x] Email client : confirmation de commande
- [x] Email admin : notification nouvelle commande
- [x] Templates HTML stylisés

### Phase 8 : Stockage fichiers STL
- [x] Cloudflare R2 configuré (S3-compatible)
- [x] Bucket `3dprintapp-stl`
- [x] Upload automatique après paiement
- [x] Lien fichier stocké en BDD
- [x] Endpoints workshop pour téléchargement

### Phase 9 : À faire (prochaine session)
- [ ] Script atelier pour télécharger les STL
- [ ] Nettoyage automatique des fichiers après téléchargement
- [ ] Dashboard admin (optionnel)

---

## Structure du projet

```
3DPrintApp/
├── client/                    # Frontend React
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Checkout.js        # Page paiement
│   │   │   ├── FileUpload.js      # Upload STL
│   │   │   ├── ModelInfo.js       # Infos modèle
│   │   │   ├── OrderSuccess.js    # Confirmation
│   │   │   ├── PriceCalculator.js # Calcul prix
│   │   │   └── STLViewer.js       # Visualisation 3D
│   │   ├── config/
│   │   │   └── pricing.js         # Configuration prix
│   │   ├── utils/
│   │   │   └── stlUtils.js        # Calculs STL
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── .env                   # Variables environnement (local)
│   └── package.json
│
├── server/                    # Backend Express
│   ├── index.js               # Point d'entrée + routes
│   ├── .env                   # Variables environnement (local)
│   └── package.json
│
├── vercel.json                # Config Vercel
├── .gitignore
└── DOCUMENTATION.md           # Ce fichier
```

---

## Variables d'environnement

### Frontend (Vercel)

| Variable | Description |
|----------|-------------|
| `REACT_APP_STRIPE_PUBLIC_KEY` | Clé publique Stripe |
| `REACT_APP_API_URL` | URL du backend Render |

### Backend (Render)

| Variable | Description |
|----------|-------------|
| `PORT` | Port du serveur (auto sur Render) |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe |
| `DATABASE_URL` | URL PostgreSQL |
| `RESEND_API_KEY` | Clé API Resend |
| `R2_ENDPOINT` | Endpoint Cloudflare R2 |
| `R2_ACCESS_KEY_ID` | Access Key R2 |
| `R2_SECRET_ACCESS_KEY` | Secret Key R2 |

---

## Endpoints API

### Public

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api` | Message de bienvenue |
| GET | `/api/health` | Status de l'API |
| POST | `/api/create-payment-intent` | Créer intention de paiement |
| POST | `/api/orders` | Créer une commande |
| POST | `/api/upload-stl` | Uploader fichier STL |
| PATCH | `/api/orders/:id/file` | Associer fichier à commande |

### Admin

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/orders` | Liste toutes les commandes |
| GET | `/api/orders/:id` | Détails d'une commande |
| PATCH | `/api/orders/:id/status` | Modifier statut commande |

### Workshop (Atelier)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/workshop/pending` | Commandes en attente de téléchargement |
| GET | `/api/workshop/download/:id` | Obtenir URL de téléchargement (signée) |
| PATCH | `/api/workshop/downloaded/:id` | Marquer comme téléchargé |
| DELETE | `/api/workshop/cleanup/:id` | Supprimer fichier de R2 |

---

## Base de données

### Table `orders`

| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL | ID auto-incrémenté |
| order_id | VARCHAR(100) | ID Stripe (unique) |
| stripe_payment_id | VARCHAR(100) | ID paiement Stripe |
| status | VARCHAR(50) | Statut (paid, processing, shipped, delivered) |
| customer_email | VARCHAR(255) | Email client |
| customer_name | VARCHAR(255) | Nom complet |
| customer_phone | VARCHAR(50) | Téléphone |
| customer_address | TEXT | Adresse |
| customer_city | VARCHAR(100) | Ville |
| customer_postal_code | VARCHAR(20) | Code postal |
| technology | VARCHAR(50) | FDM ou SLA |
| material | VARCHAR(100) | Matériau choisi |
| quality | VARCHAR(100) | Qualité d'impression |
| volume | DECIMAL(10,2) | Volume en cm³ |
| post_processing | BOOLEAN | Finition demandée |
| delivery_type | VARCHAR(50) | Type livraison |
| delivery_delay | VARCHAR(50) | Délai estimé |
| print_price | DECIMAL(10,2) | Prix impression |
| finishing_price | DECIMAL(10,2) | Prix finition |
| delivery_extra | DECIMAL(10,2) | Supplément livraison |
| total_price | DECIMAL(10,2) | Prix total |
| file_name | VARCHAR(255) | Nom fichier STL |
| file_key | VARCHAR(255) | Clé R2 du fichier |
| file_size | BIGINT | Taille en bytes |
| file_downloaded | BOOLEAN | Téléchargé par atelier |
| file_downloaded_at | TIMESTAMP | Date téléchargement |
| created_at | TIMESTAMP | Date création |
| updated_at | TIMESTAMP | Date modification |

---

## Services externes

### Stripe (Paiement)
- **Dashboard** : https://dashboard.stripe.com
- **Mode** : Test (passer en Live pour production)
- **Carte test** : 4242 4242 4242 4242

### Resend (Emails)
- **Dashboard** : https://resend.com
- **Domaine** : inphenix-system.fr
- **Expéditeur** : noreply@inphenix-system.fr

### Cloudflare R2 (Stockage)
- **Dashboard** : https://dash.cloudflare.com → R2
- **Bucket** : 3dprintapp-stl
- **Limite gratuite** : 10 Go/mois

### Render (Hébergement backend)
- **Dashboard** : https://dashboard.render.com
- **Service** : threedprintapp
- **Database** : db_3dprintapp_db

### Vercel (Hébergement frontend)
- **Dashboard** : https://vercel.com
- **Déploiement auto** : sur push GitHub

---

## URLs de production

| Service | URL |
|---------|-----|
| Frontend | https://[ton-projet].vercel.app |
| Backend | https://threedprintapp.onrender.com |
| API Orders | https://threedprintapp.onrender.com/api/orders |
| Workshop Pending | https://threedprintapp.onrender.com/api/workshop/pending |

---

## Commandes utiles

### Développement local

```bash
# Frontend
cd client
npm install
npm start         # http://localhost:3000

# Backend
cd server
npm install
npm run dev       # http://localhost:5000
```

### Déploiement

```bash
# Commit et push (déclenche déploiement auto)
git add .
git commit -m "Description des changements"
git push
```

### Vérifier les commandes (API)

```bash
# Liste des commandes
curl https://threedprintapp.onrender.com/api/orders

# Commandes en attente de téléchargement
curl https://threedprintapp.onrender.com/api/workshop/pending
```

---

## Configuration des prix

Fichier : `client/src/config/pricing.js`

```javascript
// Technologies
FDM: { maxSize: { x: 400, y: 400, z: 400 } }
SLA: { maxSize: { x: 300, y: 200, z: 120 } }

// Matériaux FDM (prix au cm³)
PLA: 0.03€, PETG: 0.04€, ABS: 0.045€

// Résine SLA
Standard: 0.12€/cm³

// Qualités (multiplicateur)
Draft: x0.8, Standard: x1.0, Fine: x1.3

// Livraison (multiplicateur sur prix impression)
Standard: x1.0, Express: x1.3, Urgent: x1.5

// Finition (prix fixe selon volume)
< 100cm³: +15€, >= 100cm³: +25€
```

---

## Notes importantes

1. **Render Free Tier** : Le backend se met en veille après 15 min d'inactivité. Premier appel peut prendre ~30 secondes.

2. **Stripe Mode Test** : Pour passer en production, remplacer les clés test par les clés live dans les variables d'environnement.

3. **Fichiers volumineux** : Les STL de 500Mo-2Go sont supportés. Penser à nettoyer R2 régulièrement.

4. **Emails** : Limité à 3000 emails/mois sur le plan gratuit Resend.

---

## Contact & Support

- **Repository** : https://github.com/Djbettrave/3DPrintApp
- **Admin email** : rayane.safollahi@gmail.com

---

*Documentation générée le 20/01/2026*
