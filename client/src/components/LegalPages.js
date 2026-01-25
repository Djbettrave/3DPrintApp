import React from 'react';
import { useNavigate } from 'react-router-dom';

// Conditions Générales de Vente
export function CGV() {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-container">
        <button className="legal-back-btn" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Retour
        </button>

        <h1>Conditions Générales de Vente</h1>
        <p className="legal-updated">Dernière mise à jour : Janvier 2025</p>

        <section>
          <h2>Article 1 - Objet</h2>
          <p>
            Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles
            entre la société exploitant le site d'impression 3D (ci-après "le Prestataire") et toute
            personne effectuant un achat via le site (ci-après "le Client").
          </p>
          <p>
            Toute commande implique l'acceptation sans réserve des présentes CGV.
          </p>
        </section>

        <section>
          <h2>Article 2 - Services proposés</h2>
          <p>Le Prestataire propose les services suivants :</p>
          <ul>
            <li>Impression 3D par dépôt de filament (FDM) : PLA, PETG, ABS</li>
            <li>Impression 3D par stéréolithographie (SLA) : Résine standard</li>
            <li>Post-traitement optionnel : ponçage et apprêt</li>
            <li>Livraison via différents transporteurs</li>
          </ul>
        </section>

        <section>
          <h2>Article 3 - Commande</h2>
          <h3>3.1 Processus de commande</h3>
          <p>
            Le Client télécharge son fichier 3D (STL ou OBJ), configure les options d'impression
            (technologie, matériau, qualité, finition), choisit son mode de livraison, puis procède
            au paiement sécurisé.
          </p>
          <h3>3.2 Validation de la commande</h3>
          <p>
            La commande est validée après confirmation du paiement. Un email de confirmation est
            envoyé au Client avec le récapitulatif de sa commande.
          </p>
          <h3>3.3 Vérification des fichiers</h3>
          <p>
            Le Prestataire se réserve le droit de refuser ou modifier une commande si le fichier
            3D présente des défauts techniques rendant l'impression impossible ou de mauvaise qualité.
          </p>
        </section>

        <section>
          <h2>Article 4 - Prix et paiement</h2>
          <h3>4.1 Prix</h3>
          <p>
            Les prix sont indiqués en euros TTC. Ils comprennent le coût d'impression, les frais
            de post-traitement le cas échéant, et les frais de livraison.
          </p>
          <h3>4.2 Paiement</h3>
          <p>
            Le paiement s'effectue par carte bancaire via la plateforme sécurisée Stripe.
            Le paiement est débité immédiatement à la validation de la commande.
          </p>
        </section>

        <section>
          <h2>Article 5 - Délais et livraison</h2>
          <h3>5.1 Délais de production</h3>
          <ul>
            <li>Standard : 7-10 jours ouvrés</li>
            <li>Express : 3-5 jours ouvrés</li>
            <li>Urgent : 24-48 heures</li>
          </ul>
          <h3>5.2 Livraison</h3>
          <p>
            La livraison est assurée par les transporteurs Mondial Relay, Colissimo ou Chronopost
            selon le choix du Client. Les délais de livraison sont donnés à titre indicatif.
          </p>
          <h3>5.3 Retard de livraison</h3>
          <p>
            En cas de retard de livraison supérieur à 7 jours par rapport à la date prévue,
            le Client peut demander l'annulation de sa commande et le remboursement intégral.
          </p>
        </section>

        <section>
          <h2>Article 6 - Droit de rétractation</h2>
          <p>
            Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation
            ne s'applique pas aux produits personnalisés ou fabriqués sur mesure. Les impressions
            3D étant réalisées sur commande selon les spécifications du Client, elles ne peuvent
            faire l'objet d'un droit de rétractation.
          </p>
        </section>

        <section>
          <h2>Article 7 - Garantie et réclamations</h2>
          <h3>7.1 Conformité</h3>
          <p>
            Le Prestataire garantit la conformité de l'impression au fichier fourni par le Client,
            dans les tolérances techniques propres à chaque technologie d'impression.
          </p>
          <h3>7.2 Réclamations</h3>
          <p>
            Toute réclamation doit être formulée par email dans les 14 jours suivant la réception,
            accompagnée de photos du produit. En cas de défaut avéré, le Prestataire propose un
            remplacement ou un remboursement.
          </p>
        </section>

        <section>
          <h2>Article 8 - Responsabilité</h2>
          <p>
            Le Prestataire n'est pas responsable des dommages indirects résultant de l'utilisation
            des produits imprimés. Le Client est responsable de la conception de son fichier 3D
            et de l'usage prévu de la pièce imprimée.
          </p>
        </section>

        <section>
          <h2>Article 9 - Propriété intellectuelle</h2>
          <p>
            Le Client garantit détenir les droits de propriété intellectuelle sur les fichiers
            soumis à impression. Le Prestataire s'engage à ne pas reproduire ou diffuser les
            fichiers du Client.
          </p>
        </section>

        <section>
          <h2>Article 10 - Données personnelles</h2>
          <p>
            Les données personnelles collectées sont traitées conformément à notre Politique de
            Confidentialité et au Règlement Général sur la Protection des Données (RGPD).
          </p>
        </section>

        <section>
          <h2>Article 11 - Litiges</h2>
          <p>
            Les présentes CGV sont soumises au droit français. En cas de litige, une solution
            amiable sera recherchée avant toute action judiciaire. À défaut, les tribunaux
            français seront seuls compétents.
          </p>
        </section>

        <section>
          <h2>Article 12 - Contact</h2>
          <p>
            Pour toute question concernant ces CGV ou vos commandes, vous pouvez nous contacter
            par email à l'adresse indiquée sur le site.
          </p>
        </section>
      </div>
    </div>
  );
}

// Politique de Confidentialité
export function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-container">
        <button className="legal-back-btn" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Retour
        </button>

        <h1>Politique de Confidentialité</h1>
        <p className="legal-updated">Dernière mise à jour : Janvier 2025</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            La présente Politique de Confidentialité décrit comment nous collectons, utilisons
            et protégeons vos données personnelles conformément au Règlement Général sur la
            Protection des Données (RGPD) et à la loi Informatique et Libertés.
          </p>
        </section>

        <section>
          <h2>2. Responsable du traitement</h2>
          <p>
            Le responsable du traitement des données personnelles est la société exploitant
            le site d'impression 3D. Pour exercer vos droits ou pour toute question,
            vous pouvez nous contacter par email.
          </p>
        </section>

        <section>
          <h2>3. Données collectées</h2>
          <p>Nous collectons les données suivantes :</p>
          <h3>3.1 Données d'identification</h3>
          <ul>
            <li>Nom et prénom</li>
            <li>Adresse email</li>
            <li>Numéro de téléphone</li>
            <li>Adresse postale de livraison</li>
          </ul>
          <h3>3.2 Données de commande</h3>
          <ul>
            <li>Fichiers 3D uploadés</li>
            <li>Configuration de commande (matériau, qualité, etc.)</li>
            <li>Historique des commandes</li>
          </ul>
          <h3>3.3 Données de paiement</h3>
          <p>
            Les données bancaires sont traitées directement par notre prestataire de paiement
            Stripe et ne sont pas stockées sur nos serveurs.
          </p>
        </section>

        <section>
          <h2>4. Finalités du traitement</h2>
          <p>Vos données sont utilisées pour :</p>
          <ul>
            <li>Traiter et expédier vos commandes</li>
            <li>Vous envoyer des confirmations et mises à jour de commande</li>
            <li>Répondre à vos demandes de support</li>
            <li>Établir les factures</li>
            <li>Respecter nos obligations légales</li>
          </ul>
        </section>

        <section>
          <h2>5. Base légale du traitement</h2>
          <p>Le traitement de vos données repose sur :</p>
          <ul>
            <li><strong>L'exécution du contrat</strong> : traitement de votre commande</li>
            <li><strong>Les obligations légales</strong> : conservation des factures, lutte contre la fraude</li>
            <li><strong>L'intérêt légitime</strong> : amélioration de nos services</li>
          </ul>
        </section>

        <section>
          <h2>6. Durée de conservation</h2>
          <ul>
            <li><strong>Données de commande</strong> : 5 ans (obligations comptables)</li>
            <li><strong>Fichiers 3D</strong> : 30 jours après livraison</li>
            <li><strong>Données de contact</strong> : 3 ans après dernière interaction</li>
          </ul>
        </section>

        <section>
          <h2>7. Destinataires des données</h2>
          <p>Vos données peuvent être partagées avec :</p>
          <ul>
            <li><strong>Stripe</strong> : traitement des paiements</li>
            <li><strong>Transporteurs</strong> (Mondial Relay, Colissimo, Chronopost) : livraison des colis</li>
            <li><strong>Hébergeurs</strong> : stockage sécurisé des données</li>
          </ul>
          <p>
            Ces prestataires sont soumis à des obligations de confidentialité et ne peuvent
            utiliser vos données qu'aux fins prévues.
          </p>
        </section>

        <section>
          <h2>8. Transferts hors UE</h2>
          <p>
            Certains de nos prestataires (Stripe, hébergement cloud) peuvent traiter des données
            hors de l'Union Européenne. Ces transferts sont encadrés par des garanties appropriées
            (clauses contractuelles types, certification Privacy Shield).
          </p>
        </section>

        <section>
          <h2>9. Vos droits</h2>
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
            <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
            <li><strong>Droit à l'effacement</strong> : supprimer vos données</li>
            <li><strong>Droit à la limitation</strong> : restreindre le traitement</li>
            <li><strong>Droit à la portabilité</strong> : récupérer vos données</li>
            <li><strong>Droit d'opposition</strong> : vous opposer au traitement</li>
          </ul>
          <p>
            Pour exercer ces droits, contactez-nous par email. Nous répondrons dans un délai
            d'un mois.
          </p>
        </section>

        <section>
          <h2>10. Sécurité</h2>
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger
            vos données : chiffrement SSL/TLS, accès restreint, sauvegardes régulières,
            surveillance des accès.
          </p>
        </section>

        <section>
          <h2>11. Cookies</h2>
          <p>
            Notre site utilise des cookies essentiels au fonctionnement du service.
            Aucun cookie publicitaire ou de tracking n'est utilisé.
          </p>
        </section>

        <section>
          <h2>12. Réclamation</h2>
          <p>
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire
            une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés)
            sur le site <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
          </p>
        </section>

        <section>
          <h2>13. Modification de la politique</h2>
          <p>
            Nous nous réservons le droit de modifier cette politique. Toute modification
            sera publiée sur cette page avec une date de mise à jour.
          </p>
        </section>
      </div>
    </div>
  );
}
