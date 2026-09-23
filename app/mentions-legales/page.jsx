import Link from "next/link";
import { LegalPage, LegalSection as Section } from "../components/LegalPage";

export const metadata = {
  title: "Mentions légales — Pull Lover",
  description: "Mentions légales de la boutique en ligne Pull Lover.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage title={<>Mentions <em>légales.</em></>}>

      <Section title="1. Éditeur du site">
        <p>Le site <strong>pull-lover.com</strong> est édité par :</p>
        <ul>
          <li><strong>Raison sociale :</strong> Pull Lover</li>
          <li><strong>Forme juridique :</strong> Entreprise individuelle</li>
          <li><strong>Adresse :</strong> France</li>
          <li><strong>E-mail :</strong> <a href="mailto:tom.wybo@yahoo.fr">tom.wybo@yahoo.fr</a></li>
        </ul>
      </Section>

      <Section title="2. Directeur de la publication">
        Le directeur de la publication est le responsable de Pull Lover, joignable à l'adresse e-mail
        indiquée ci-dessus.
      </Section>

      <Section title="3. Hébergement">
        <p>Le site est hébergé par :</p>
        <ul>
          <li><strong>Vercel Inc.</strong> — 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</li>
          <li>Site : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a></li>
        </ul>
        <p>
          Les médias (images, vidéos) sont hébergés sur <strong>Cloudflare R2</strong> et les données sur
          <strong> Neon</strong> (hébergement PostgreSQL managé).
        </p>
      </Section>

      <Section title="4. Propriété intellectuelle">
        L'ensemble des contenus présents sur ce site (textes, images, vidéos, logos, graphismes) est la
        propriété exclusive de Pull Lover ou de ses partenaires, et est protégé par les lois françaises et
        internationales relatives à la propriété intellectuelle. Toute reproduction, représentation,
        modification ou exploitation, totale ou partielle, sans autorisation écrite préalable est strictement
        interdite.
      </Section>

      <Section title="5. Responsabilité">
        Pull Lover s'efforce de maintenir les informations publiées sur ce site à jour et exactes. Toutefois,
        nous ne saurions garantir l'exactitude, la complétude ou l'actualité des informations diffusées.
        Pull Lover ne peut être tenu responsable des dommages directs ou indirects résultant de l'utilisation
        de ce site ou de l'impossibilité d'y accéder.
      </Section>

      <Section title="6. Liens hypertextes">
        Le site peut contenir des liens vers des sites tiers. Pull Lover n'exerce aucun contrôle sur ces
        sites et décline toute responsabilité quant à leur contenu ou leur politique de confidentialité.
      </Section>

      <Section title="7. Données personnelles">
        La collecte et le traitement de vos données personnelles sont décrits dans notre{" "}
        <Link href="/politique-de-confidentialite">
          Politique de confidentialité
        </Link>
        , conformément au Règlement Général sur la Protection des Données (RGPD).
      </Section>

      <Section title="8. Contact">
        Pour toute question relative au site ou à son contenu :{" "}
        <a href="mailto:tom.wybo@yahoo.fr">tom.wybo@yahoo.fr</a>
      </Section>

    </LegalPage>
  );
}
