On continue le peaufinage UI/UX. Changements ciblés, ne casse rien d’existant. Donne le code prêt à coller + fichiers modifiés.

1) VIEWER 3D – Nettoyage UI
- La molette souris (wheel) pour zoom est maintenant en place.
- Supprimer les boutons “+” et “–” de la barre de navigation du Viewer 3D (en haut), car ils ne sont plus nécessaires.
- Garder rotation/pan/drag inchangés.

2) DÉLAIS – Nettoyage affichage
- À côté de la sélection des délais, supprimer les mentions textuelles “+30%” et “+50%”.
  => Les majorations restent appliquées dans le calcul du prix, mais elles deviennent implicites (pas affichées en texte).
- Le prix doit continuer à se mettre à jour correctement.
- Supprimer la notification/texte d’explication qui s’affiche à côté du bouton (si elle existe), car c’est inutile.

3) ULTRA RAPIDE – Micro-copy bouton
- Sur le bouton “Ultra rapide”, retirer la petite mention “24 à 48 heures” (le texte en petit).
- Le bouton doit rester clair et clean.

4) ULTRA RAPIDE – Logique “sur devis”
- L’option “Ultra rapide” doit être “sur devis”.
- Si l’utilisateur sélectionne “Ultra rapide” :
  - déclencher le même flux que la “Demande de devis” existante (comme modèle > 400 x 400 ou finition professionnelle)
  - ne pas afficher de prix final automatique
  - afficher un message clair : “Ultra rapide : sur devis. On revient vers vous sous 24h.”
  - rediriger/ouvrir le formulaire de demande de devis existant (même endpoint / même modal / même page selon l’existant)

LIVRABLE
- Indiquer précisément où étaient les boutons +/– du Viewer et les supprimer proprement.
- Indiquer où étaient affichés les “+30% / +50%” et retirer l’affichage, sans toucher au calcul.
- Vérifier responsive + build OK.
