import Link from "next/link";
import { LegalPage, LegalSection as Section } from "@/app/components/LegalPage";
import { pageAlternates } from "@/app/lib/seo";
import { localePath } from "@/app/i18n/config.mjs";

const META = {
  fr: { title: "Mentions légales", description: "Mentions légales de la boutique en ligne Pull-Lover." },
  en: { title: "Legal notice", description: "Legal notice of the Pull-Lover online shop." },
};

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { ...META[lang], alternates: pageAlternates(lang, "/mentions-legales") };
}

export default async function MentionsLegalesPage({ params }) {
  const { lang } = await params;
  return lang === "en" ? <LegalNoticeEn /> : <LegalNoticeFr />;
}

function LegalNoticeFr() {
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
        <Link href={localePath("fr", "/politique-de-confidentialite")}>
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

function LegalNoticeEn() {
  return (
    <LegalPage eyebrow="Legal information" title={<>Legal <em>notice.</em></>}>

      <Section title="1. Website publisher">
        <p>The website <strong>pull-lover.com</strong> is published by:</p>
        <ul>
          <li><strong>Company name:</strong> Pull Lover</li>
          <li><strong>Legal form:</strong> Sole proprietorship (entreprise individuelle)</li>
          <li><strong>Address:</strong> France</li>
          <li><strong>Email:</strong> <a href="mailto:tom.wybo@yahoo.fr">tom.wybo@yahoo.fr</a></li>
        </ul>
      </Section>

      <Section title="2. Publication director">
        The publication director is the manager of Pull Lover, who can be reached at the email address
        given above.
      </Section>

      <Section title="3. Hosting">
        <p>The website is hosted by:</p>
        <ul>
          <li><strong>Vercel Inc.</strong> — 340 Pine Street, Suite 701, San Francisco, CA 94104, United States</li>
          <li>Website: <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a></li>
        </ul>
        <p>
          Media (images, videos) are hosted on <strong>Cloudflare R2</strong> and data on
          <strong> Neon</strong> (managed PostgreSQL hosting).
        </p>
      </Section>

      <Section title="4. Intellectual property">
        All content on this website (texts, images, videos, logos, graphics) is the exclusive property of
        Pull Lover or its partners and is protected by French and international intellectual property
        laws. Any reproduction, representation, modification or use, in whole or in part, without prior
        written permission is strictly prohibited.
      </Section>

      <Section title="5. Liability">
        Pull Lover strives to keep the information published on this website accurate and up to date.
        However, we cannot guarantee the accuracy, completeness or timeliness of the information provided.
        Pull Lover cannot be held liable for any direct or indirect damage resulting from the use of this
        website or from being unable to access it.
      </Section>

      <Section title="6. Hyperlinks">
        The website may contain links to third-party websites. Pull Lover has no control over these
        websites and accepts no responsibility for their content or privacy policies.
      </Section>

      <Section title="7. Personal data">
        The collection and processing of your personal data are described in our{" "}
        <Link href={localePath("en", "/politique-de-confidentialite")}>
          Privacy policy
        </Link>
        , in accordance with the General Data Protection Regulation (GDPR).
      </Section>

      <Section title="8. Contact">
        For any question about the website or its content:{" "}
        <a href="mailto:tom.wybo@yahoo.fr">tom.wybo@yahoo.fr</a>
      </Section>

    </LegalPage>
  );
}
