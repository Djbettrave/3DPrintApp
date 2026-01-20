Tu es un assistant développeur sur mon application web (configurateur + devis d’impression 3D).
Objectif : implémenter les modifications ci-dessous de manière propre, lisible et professionnelle.
Fais des changements ciblés, sans casser l’existant, et fournis du code prêt à coller.

CONTEXTE GÉNÉRAL
- Application web avec Viewer 3D (Three.js / équivalent) permettant de visualiser un modèle importé.
- Configurateur avec choix SLA / FDM, matériaux, couleur, quantité, finition.
- Un bloc d’informations à droite affiche les dimensions du modèle 3D (X / Y / Z).
- Il existe déjà une logique de “Demande de devis” automatique quand un modèle dépasse 400 mm x 400 mm.
- Une page et un email de confirmation existent déjà.

────────────────────────────────
1) OPTIONS / CHOIX UTILISATEUR
────────────────────────────────

- Ajouter un choix de couleur pour SLA :
  - Blanc
  - Gris

- Ajouter un choix de couleur pour FDM :
  - Noir
  - Blanc

- Ajouter / corriger le sélecteur de quantité :
  - UX simple (stepper + / – ou select)
  - Validation : minimum = 1
  - Mise à jour instantanée du calcul si applicable

────────────────────────────────
2) TEXTES / MICRO-COPY (CLARTÉ ABSOLUE)
────────────────────────────────

- Modifier le texte de confirmation pour éviter toute ambiguïté.
  NE PAS indiquer que l’impression est faite sous 24h.
  Texte attendu (ou équivalent, ton simple et pro) :
  “Votre commande sera traitée sous 24h. Vous recevez une confirmation par email.”

- Renommer le bouton :
  “Home” → “Home vue”

- Modifier le bouton “Urgent” :
  Libellé : “Moins de 3 jours”

────────────────────────────────
3) UI / LISIBILITÉ – BLOC DIMENSIONS (X / Y / Z)
────────────────────────────────

- Le bloc d’informations à droite (dimensions X / Y / Z) est trop volumineux.
- Objectif : réduire sa hauteur pour que la section de configuration (matériaux, options) remonte visuellement.

Contraintes UI :
- Garder X / Y / Z visibles immédiatement
- Réduire padding, marges, taille typographique
- Présenter les dimensions sous forme de “cartouche” compact
- Option possible : résumé visible + détails en accordéon / toggle
- Résultat attendu : page plus équilibrée, plus harmonieuse, moins “bloc lourd”

────────────────────────────────
4) FINITION – NOUVELLE LOGIQUE (DEVIS SUR DEMANDE)
────────────────────────────────

- Supprimer toute logique automatisée de calcul “ponçage / apprêt”.
- Remplacer l’option finition par 2 choix exclusifs :

  A) “Brut d’impression”
     - Prix affiché et calculé normalement

  B) “Finition professionnelle (devis sur demande)”
     - Aucun prix automatique
     - Afficher un message clair :
       “Finition professionnelle : devis sur demande. On revient vers vous sous 24h.”

- IMPORTANT :
  Si l’utilisateur sélectionne “Finition professionnelle” :
  → déclencher EXACTEMENT le même flux que la “Demande de devis” utilisée
    lorsque le modèle dépasse 400 mm x 400 mm,
    même si le modèle est plus petit.

- Dans ce cas :
  - Ne pas afficher de total chiffré final
  - Rediriger vers / activer la demande de devis existante

────────────────────────────────
5) BRANDING – INPHENIX SYSTEM
────────────────────────────────

- Remplacer le logo violet actuel en haut à gauche par le logo Inphenix System.
- Le logo doit apparaître :
  - En haut à gauche
  - À côté du texte “VIE Impression 3D”

- Ajouter également le branding Inphenix dans l’email de confirmation :
  - Logo Inphenix en header d’email (ou équivalent propre si contraintes email)
  - Nom “Inphenix System” clairement visible
  - Rendu responsive et compatible clients mail

────────────────────────────────
6) VIEWER 3D – ZOOM, SCROLL & UX NAVIGATION
────────────────────────────────

PROBLÈME ACTUEL
- Le zoom du Viewer 3D est inversé
- La molette de la souris scroll la page au lieu de zoomer dans le Viewer
- L’expérience de navigation n’est pas naturelle

OBJECTIF UX
- Rendre la navigation du Viewer 3D naturelle et professionnelle
- Utiliser la molette de la souris pour le zoom
- Bloquer le scroll de la page uniquement quand la souris est au-dessus du Viewer

COMPORTEMENT ATTENDU
- Quand le curseur est AU-DESSUS du Viewer 3D :
  - Intercepter l’événement `wheel`
  - Appliquer `preventDefault()` pour empêcher le scroll de la page
  - Utiliser la molette pour zoomer la caméra du Viewer
  - Sens du zoom :
    - Molette vers l’avant → zoom IN
    - Molette vers l’arrière → zoom OUT

- Quand le curseur SORT du Viewer :
  - Le scroll normal de la page redevient actif

CONTRAINTES TECHNIQUES
- Ne pas casser les contrôles existants (rotation, pan, drag)
- Définir des limites de zoom min / max (pas de traversée du modèle)
- Fonctionnel sur desktop (souris / trackpad)
- Zoom molette = interaction principale
- Boutons de zoom éventuels deviennent secondaires

────────────────────────────────
LIVRABLE ATTENDU
────────────────────────────────

- Liste claire des fichiers modifiés (chemins exacts)
- Code complet prêt à coller (pas d’extraits incomplets)
- Si un composant UI est créé (accordion / toggle / handler wheel), fournir le composant complet
- Vérifier :
  - build OK
  - affichage desktop + mobile
  - UX fluide et cohérente
- Ton français simple, clair, professionnel, pas trop formel