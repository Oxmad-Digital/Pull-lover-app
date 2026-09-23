import Link from "next/link";

export const metadata = {
  title: "Conditions générales de vente — Pull Lover",
  description: "Conditions générales de vente de la boutique en ligne Pull Lover.",
};

export default function ConditionsDeVentePage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 32px", fontFamily: "Montserrat, sans-serif", color: "#252323", lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Conditions générales de vente</h1>
      <p style={{ color: "#64748b", marginBottom: 48 }}>Dernière mise à jour : juin 2025</p>

      <Section title="1. Objet">
        Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre
        Pull Lover (ci-après « le Vendeur ») et toute personne effectuant un achat sur le site
        <strong> pull-lover.com</strong> (ci-après « le Client »). Tout achat implique l'acceptation
        pleine et entière des présentes CGV.
      </Section>

      <Section title="2. Produits">
        Les produits proposés à la vente sont des vêtements et accessoires en mailles faits main,
        fabriqués à Antananarivo (Madagascar) dans l'atelier familial Ultramaille. Les photographies
        et descriptions sont aussi fidèles que possible. En raison du caractère artisanal des pièces,
        de légères variations de couleur ou de texture peuvent exister d'un article à l'autre.
      </Section>

      <Section title="3. Prix">
        Les prix sont indiqués en euros (€) toutes taxes comprises. Pull Lover se réserve le droit
        de modifier ses prix à tout moment, étant entendu que le prix appliqué sera celui en vigueur
        au moment de la validation de la commande.
      </Section>

      <Section title="4. Commandes">
        <p>Pour passer commande, le Client doit :</p>
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li>Sélectionner les articles souhaités et les ajouter au panier</li>
          <li>Renseigner ses coordonnées et son adresse de livraison</li>
          <li>Choisir un mode de paiement et valider la commande</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          Un e-mail de confirmation est envoyé dès validation de la commande. Pull Lover se réserve
          le droit de refuser ou d'annuler toute commande en cas de problème de stock, d'erreur de
          prix manifeste ou de suspicion de fraude.
        </p>
      </Section>

      <Section title="5. Paiement">
        Le paiement s'effectue en ligne par carte bancaire (Visa, Mastercard, American Express) via
        la plateforme sécurisée <strong>Stripe</strong>. Les données bancaires sont chiffrées et ne
        sont jamais stockées sur nos serveurs. La commande est traitée après confirmation du paiement.
      </Section>

      <Section title="6. Livraison">
        <p>Les commandes sont expédiées vers la France métropolitaine et, selon disponibilité, à
        l'international. Les délais indicatifs sont :</p>
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li><strong>France métropolitaine :</strong> 5 à 10 jours ouvrés</li>
          <li><strong>International :</strong> 10 à 20 jours ouvrés</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          Ces délais courent à compter de la confirmation de commande. Pull Lover ne saurait être
          tenu responsable des retards imputables au transporteur ou à des événements hors de son
          contrôle.
        </p>
      </Section>

      <Section title="7. Droit de rétractation">
        Conformément à l'article L.221-18 du Code de la consommation, le Client dispose d'un délai
        de <strong>14 jours</strong> à compter de la réception de sa commande pour exercer son droit
        de rétractation, sans avoir à justifier sa décision. Pour ce faire, il doit contacter Pull
        Lover à <a href="mailto:tom.wybo@yahoo.fr" style={{ color: "#C75C5C" }}>tom.wybo@yahoo.fr</a>{" "}
        avant de retourner l'article dans son état d'origine. Les frais de retour sont à la charge
        du Client.
      </Section>

      <Section title="8. Retours et remboursements">
        Les articles retournés doivent être non portés, non lavés et dans leur emballage d'origine.
        Après réception et vérification du retour, le remboursement est effectué sous 14 jours sur
        le moyen de paiement utilisé lors de la commande. Les articles personnalisés ou en promotion
        ne sont pas éligibles au retour sauf défaut avéré.
      </Section>

      <Section title="9. Garanties">
        Les produits bénéficient de la garantie légale de conformité (articles L.217-4 et suivants
        du Code de la consommation) et de la garantie contre les vices cachés (articles 1641 et
        suivants du Code civil). En cas de défaut constaté, contactez-nous à{" "}
        <a href="mailto:tom.wybo@yahoo.fr" style={{ color: "#C75C5C" }}>tom.wybo@yahoo.fr</a>.
      </Section>

      <Section title="10. Propriété intellectuelle">
        L'ensemble des visuels, textes et contenus du site sont la propriété de Pull Lover. Toute
        reproduction sans autorisation écrite est interdite. Pour plus d'informations, consultez
        nos{" "}
        <Link href="/mentions-legales" style={{ color: "#C75C5C", fontWeight: 600 }}>
          Mentions légales
        </Link>.
      </Section>

      <Section title="11. Données personnelles">
        Les données collectées lors de la commande sont traitées conformément à notre{" "}
        <Link href="/politique-de-confidentialite" style={{ color: "#C75C5C", fontWeight: 600 }}>
          Politique de confidentialité
        </Link>.
      </Section>

      <Section title="12. Droit applicable et litiges">
        Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable
        sera recherchée en priorité. À défaut, le litige sera porté devant les tribunaux compétents.
        Le Client peut également recourir à une médiation de la consommation via la plateforme
        européenne de règlement en ligne des litiges :{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: "#C75C5C" }}>
          ec.europa.eu/consumers/odr
        </a>.
      </Section>

      <Section title="13. Contact">
        Pour toute question relative à une commande ou aux présentes CGV :{" "}
        <a href="mailto:tom.wybo@yahoo.fr" style={{ color: "#C75C5C" }}>tom.wybo@yahoo.fr</a>
      </Section>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#252323" }}>{title}</h2>
      <div style={{ color: "#334155" }}>{children}</div>
    </section>
  );
}
