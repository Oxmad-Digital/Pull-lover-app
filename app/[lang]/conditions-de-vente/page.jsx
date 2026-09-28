import Link from "next/link";
import { LegalPage, LegalSection as Section } from "@/app/components/LegalPage";
import { pageAlternates } from "@/app/lib/seo";
import { localePath } from "@/app/i18n/config.mjs";

const META = {
  fr: { title: "Conditions générales de vente", description: "Conditions générales de vente de la boutique en ligne Pull-Lover." },
  en: { title: "Terms and conditions of sale", description: "Terms and conditions of sale of the Pull-Lover online shop." },
};

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { ...META[lang], alternates: pageAlternates(lang, "/conditions-de-vente") };
}

export default async function ConditionsDeVentePage({ params }) {
  const { lang } = await params;
  return lang === "en" ? <TermsEn /> : <TermsFr />;
}

function TermsFr() {
  return (
    <LegalPage eyebrow="Conditions de commande" title={<>Conditions générales <em>de vente.</em></>}>

      <Section title="1. Objet">
        Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre
        Pull Lover (ci-après « le Vendeur ») et toute personne effectuant un achat sur le site
        <strong> pull-lover.com</strong> (ci-après « le Client »). Tout achat implique l’acceptation
        pleine et entière des présentes CGV.
      </Section>

      <Section title="2. Produits">
        Les produits proposés à la vente sont des vêtements et accessoires en mailles faits main,
        fabriqués à Antananarivo (Madagascar) dans l’atelier familial Ultramaille. Les photographies
        et descriptions sont aussi fidèles que possible. En raison du caractère artisanal des pièces,
        de légères variations de couleur ou de texture peuvent exister d’un article à l’autre.
      </Section>

      <Section title="3. Prix">
        Les prix sont indiqués en euros (€) toutes taxes comprises. Pull Lover se réserve le droit
        de modifier ses prix à tout moment, étant entendu que le prix appliqué sera celui en vigueur
        au moment de la validation de la commande.
      </Section>

      <Section title="4. Commandes">
        <p>Pour passer commande, le Client doit :</p>
        <ul>
          <li>Sélectionner les articles souhaités et les ajouter au panier</li>
          <li>Renseigner ses coordonnées et son adresse de livraison</li>
          <li>Choisir un mode de paiement et valider la commande</li>
        </ul>
        <p>
          Un e-mail de confirmation est envoyé dès validation de la commande. Pull Lover se réserve
          le droit de refuser ou d’annuler toute commande en cas de problème de stock, d’erreur de
          prix manifeste ou de suspicion de fraude.
        </p>
      </Section>

      <Section title="5. Paiement">
        Le paiement s’effectue en ligne par carte bancaire (Visa, Mastercard, American Express) via
        la plateforme sécurisée <strong>Stripe</strong>. Les données bancaires sont chiffrées et ne
        sont jamais stockées sur nos serveurs. La commande est traitée après confirmation du paiement.
      </Section>

      <Section title="6. Livraison">
        <p>Les commandes sont expédiées vers la France métropolitaine et, selon disponibilité, à
        l’international. Les délais indicatifs sont :</p>
        <ul>
          <li><strong>France métropolitaine :</strong> 5 à 10 jours ouvrés</li>
          <li><strong>International :</strong> 10 à 20 jours ouvrés</li>
        </ul>
        <p>
          Ces délais courent à compter de la confirmation de commande. Pull Lover ne saurait être
          tenu responsable des retards imputables au transporteur ou à des événements hors de son
          contrôle.
        </p>
      </Section>

      <Section title="7. Droit de rétractation">
        Conformément à l’article L.221-18 du Code de la consommation, le Client dispose d’un délai
        de <strong>14 jours</strong> à compter de la réception de sa commande pour exercer son droit
        de rétractation, sans avoir à justifier sa décision. Pour ce faire, il doit contacter Pull
        Lover à <a href="mailto:tom.wybo@yahoo.fr">tom.wybo@yahoo.fr</a>{" "}
        avant de retourner l’article dans son état d’origine. Les frais de retour sont à la charge
        du Client.
      </Section>

      <Section title="8. Retours et remboursements">
        Les articles retournés doivent être non portés, non lavés et dans leur emballage d’origine.
        Après réception et vérification du retour, le remboursement est effectué sous 14 jours sur
        le moyen de paiement utilisé lors de la commande. Les articles personnalisés ou en promotion
        ne sont pas éligibles au retour sauf défaut avéré.
      </Section>

      <Section title="9. Garanties">
        Les produits bénéficient de la garantie légale de conformité (articles L.217-4 et suivants
        du Code de la consommation) et de la garantie contre les vices cachés (articles 1641 et
        suivants du Code civil). En cas de défaut constaté, contactez-nous à{" "}
        <a href="mailto:tom.wybo@yahoo.fr">tom.wybo@yahoo.fr</a>.
      </Section>

      <Section title="10. Propriété intellectuelle">
        L’ensemble des visuels, textes et contenus du site sont la propriété de Pull Lover. Toute
        reproduction sans autorisation écrite est interdite. Pour plus d’informations, consultez
        nos{" "}
        <Link href={localePath("fr", "/mentions-legales")}>
          Mentions légales
        </Link>.
      </Section>

      <Section title="11. Données personnelles">
        Les données collectées lors de la commande sont traitées conformément à notre{" "}
        <Link href={localePath("fr", "/politique-de-confidentialite")}>
          Politique de confidentialité
        </Link>.
      </Section>

      <Section title="12. Droit applicable et litiges">
        Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable
        sera recherchée en priorité. À défaut, le litige sera porté devant les tribunaux compétents.
        Le Client peut également recourir à une médiation de la consommation via la plateforme
        européenne de règlement en ligne des litiges :{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr
        </a>.
      </Section>

      <Section title="13. Contact">
        Pour toute question relative à une commande ou aux présentes CGV :{" "}
        <a href="mailto:tom.wybo@yahoo.fr">tom.wybo@yahoo.fr</a>
      </Section>
    </LegalPage>
  );
}

// Traduction de courtoisie : en cas de divergence, la version française fait foi (section 12).
function TermsEn() {
  return (
    <LegalPage eyebrow="Ordering terms" title={<>Terms and conditions <em>of sale.</em></>}>

      <Section title="1. Purpose">
        These general terms and conditions of sale (the “Terms”) govern the contractual relationship between
        Pull Lover (the “Seller”) and any person making a purchase on the website
        <strong> pull-lover.com</strong> (the “Customer”). Any purchase implies full and unreserved
        acceptance of these Terms.
      </Section>

      <Section title="2. Products">
        The products offered for sale are handmade knitted garments and accessories, made in
        Antananarivo (Madagascar) in the Ultramaille family workshop. Photographs and descriptions are
        as accurate as possible. Due to the handcrafted nature of the pieces, slight variations in colour
        or texture may exist from one item to another.
      </Section>

      <Section title="3. Prices">
        Prices are shown in euros (€) including all taxes. Pull Lover reserves the right to change its
        prices at any time; the price applied will be the one in force when the order is confirmed.
      </Section>

      <Section title="4. Orders">
        <p>To place an order, the Customer must:</p>
        <ul>
          <li>Select the desired items and add them to the cart</li>
          <li>Enter their contact details and delivery address</li>
          <li>Choose a payment method and confirm the order</li>
        </ul>
        <p>
          A confirmation email is sent as soon as the order is confirmed. Pull Lover reserves the right
          to refuse or cancel any order in the event of a stock issue, an obvious pricing error or
          suspected fraud.
        </p>
      </Section>

      <Section title="5. Payment">
        Payment is made online by bank card (Visa, Mastercard, American Express) via the secure
        <strong> Stripe</strong> platform. Card details are encrypted and never stored on our servers.
        The order is processed once payment has been confirmed.
      </Section>

      <Section title="6. Delivery">
        <p>Orders are shipped to mainland France and, depending on availability, internationally.
        Estimated delivery times are:</p>
        <ul>
          <li><strong>Mainland France:</strong> 5 to 10 business days</li>
          <li><strong>International:</strong> 10 to 20 business days</li>
        </ul>
        <p>
          These times run from the order confirmation. Pull Lover cannot be held responsible for delays
          caused by the carrier or by events beyond its control.
        </p>
      </Section>

      <Section title="7. Right of withdrawal">
        In accordance with Article L.221-18 of the French Consumer Code, the Customer has
        <strong> 14 days</strong> from receipt of their order to exercise their right of withdrawal,
        without having to give any reason. To do so, they must contact Pull Lover at{" "}
        <a href="mailto:tom.wybo@yahoo.fr">tom.wybo@yahoo.fr</a> before returning the item in its
        original condition. Return costs are borne by the Customer.
      </Section>

      <Section title="8. Returns and refunds">
        Returned items must be unworn, unwashed and in their original packaging. Once the return has
        been received and checked, the refund is made within 14 days using the payment method used for
        the order. Personalised or discounted items are not eligible for return unless proven defective.
      </Section>

      <Section title="9. Warranties">
        Products are covered by the legal guarantee of conformity (Articles L.217-4 et seq. of the French
        Consumer Code) and the guarantee against hidden defects (Articles 1641 et seq. of the French Civil
        Code). If you notice a defect, contact us at{" "}
        <a href="mailto:tom.wybo@yahoo.fr">tom.wybo@yahoo.fr</a>.
      </Section>

      <Section title="10. Intellectual property">
        All visuals, texts and content on the website are the property of Pull Lover. Any reproduction
        without written permission is prohibited. For more information, see our{" "}
        <Link href={localePath("en", "/mentions-legales")}>
          Legal notice
        </Link>.
      </Section>

      <Section title="11. Personal data">
        Data collected when ordering is processed in accordance with our{" "}
        <Link href={localePath("en", "/politique-de-confidentialite")}>
          Privacy policy
        </Link>.
      </Section>

      <Section title="12. Governing law and disputes">
        These Terms are governed by French law. This English version is provided for convenience; in the
        event of any discrepancy, the French version prevails. In the event of a dispute, an amicable
        solution will be sought first. Failing that, the dispute will be brought before the competent
        courts. The Customer may also use consumer mediation via the European online dispute resolution
        platform:{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr
        </a>.
      </Section>

      <Section title="13. Contact">
        For any question about an order or these Terms:{" "}
        <a href="mailto:tom.wybo@yahoo.fr">tom.wybo@yahoo.fr</a>
      </Section>
    </LegalPage>
  );
}
