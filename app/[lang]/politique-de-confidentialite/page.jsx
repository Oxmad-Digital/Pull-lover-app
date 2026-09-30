import Link from "next/link";
import { LegalPage, LegalSection as Section } from "@/app/components/LegalPage";
import { pageAlternates } from "@/app/lib/seo";
import { localePath } from "@/app/i18n/config.mjs";

const META = {
  fr: { title: "Politique de confidentialité", description: "Politique de confidentialité et protection des données personnelles de Pull-Lover." },
  en: { title: "Privacy policy", description: "Pull-Lover privacy policy and personal data protection." },
};

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { ...META[lang], alternates: pageAlternates(lang, "/politique-de-confidentialite") };
}

export default async function PolitiqueConfidentialitePage({ params }) {
  const { lang } = await params;
  return lang === "en" ? <PrivacyEn /> : <PrivacyFr />;
}

function PrivacyFr() {
  return (
    <LegalPage eyebrow="Protection de vos données" title={<>Politique de <em>confidentialité.</em></>}>

      <Section title="1. Qui sommes-nous ?">
        Pull Lover est une boutique en ligne de vente de pulls et vêtements en mailles. Le responsable du traitement des données est Pull Lover (contact : <a href="mailto:tom.wybo@yahoo.fr">tom.wybo@yahoo.fr</a>).
      </Section>

      <Section title="2. Données collectées">
        Nous collectons les données suivantes :
        <ul>
          <li>Nom et prénom</li>
          <li>Adresse e-mail</li>
          <li>Adresse de livraison</li>
          <li>Historique de commandes</li>
          <li>Données de connexion (adresse e-mail et mot de passe chiffré)</li>
        </ul>
      </Section>

      <Section title="3. Finalités du traitement">
        Vos données sont utilisées pour :
        <ul>
          <li>Gérer votre compte et vos commandes</li>
          <li>Assurer la livraison de vos achats</li>
          <li>Vous envoyer des confirmations de commande par e-mail</li>
          <li>Améliorer nos services et la sécurité du site</li>
        </ul>
      </Section>


      <Section title="4. Conservation des données">
        Vos données personnelles sont conservées pendant toute la durée de votre relation commerciale avec nous, puis archivées pendant 3 ans à des fins légales. Vous pouvez demander leur suppression à tout moment (voir section 6).
      </Section>

      <Section title="5. Partage des données">
        Nous ne vendons pas vos données. Elles peuvent être partagées uniquement avec :
        <ul>
          <li>Nos prestataires de paiement et de livraison</li>
          <li>Nos hébergeurs (Neon, Cloudflare R2, Vercel)</li>
        </ul>
        Tous nos prestataires sont soumis à des obligations de confidentialité strictes.
      </Section>

      <Section title="6. Vos droits (RGPD)">
        Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
        <ul>
          <li><strong>Droit d’accès</strong> : obtenir une copie de vos données</li>
          <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
          <li><strong>Droit à l’effacement</strong> : demander la suppression de vos données</li>
          <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
          <li><strong>Droit d’opposition</strong> : vous opposer à certains traitements</li>
        </ul>
        <p>
          Pour exercer ces droits, et notamment demander la <Link href={localePath("fr", "/suppression-donnees")}>suppression de vos données</Link>, contactez-nous à <a href="mailto:tom.wybo@yahoo.fr">tom.wybo@yahoo.fr</a>. Nous répondons dans un délai maximum de 30 jours.
        </p>
      </Section>

      <Section title="7. Cookies">
        Nous utilisons des cookies techniques nécessaires au fonctionnement du site (session, panier, langue). Aucun cookie publicitaire tiers n’est utilisé sans votre consentement.
      </Section>

      <Section title="8. Sécurité">
        Vos mots de passe sont chiffrés (bcrypt). Les communications sont sécurisées via HTTPS. Nous mettons en place des mécanismes de protection contre les tentatives de connexion abusives.
      </Section>

      <Section title="9. Contact">
        Pour toute question relative à vos données personnelles : <a href="mailto:tom.wybo@yahoo.fr">tom.wybo@yahoo.fr</a>
      </Section>
    </LegalPage>
  );
}

function PrivacyEn() {
  return (
    <LegalPage eyebrow="Protecting your data" title={<>Privacy <em>policy.</em></>}>

      <Section title="1. Who are we?">
        Pull Lover is an online shop selling sweaters and knitted garments. The data controller is Pull Lover (contact: <a href="mailto:tom.wybo@yahoo.fr">tom.wybo@yahoo.fr</a>).
      </Section>

      <Section title="2. Data we collect">
        We collect the following data:
        <ul>
          <li>First and last name</li>
          <li>Email address</li>
          <li>Delivery address</li>
          <li>Order history</li>
          <li>Login data (email address and encrypted password)</li>
        </ul>
      </Section>

      <Section title="3. Purposes of processing">
        Your data is used to:
        <ul>
          <li>Manage your account and your orders</li>
          <li>Deliver your purchases</li>
          <li>Send you order confirmations by email</li>
          <li>Improve our services and the security of the website</li>
        </ul>
      </Section>


      <Section title="4. Data retention">
        Your personal data is kept for the duration of our business relationship, then archived for 3 years for legal purposes. You can request its deletion at any time (see section 6).
      </Section>

      <Section title="5. Data sharing">
        We do not sell your data. It may only be shared with:
        <ul>
          <li>Our payment and delivery providers</li>
          <li>Our hosting providers (Neon, Cloudflare R2, Vercel)</li>
        </ul>
        All our providers are bound by strict confidentiality obligations.
      </Section>

      <Section title="6. Your rights (GDPR)">
        Under the General Data Protection Regulation (GDPR), you have the following rights:
        <ul>
          <li><strong>Right of access</strong>: obtain a copy of your data</li>
          <li><strong>Right to rectification</strong>: correct inaccurate data</li>
          <li><strong>Right to erasure</strong>: request the deletion of your data</li>
          <li><strong>Right to data portability</strong>: receive your data in a structured format</li>
          <li><strong>Right to object</strong>: object to certain processing</li>
        </ul>
        <p>
          To exercise these rights, including requesting the <Link href={localePath("en", "/suppression-donnees")}>deletion of your data</Link>, contact us at <a href="mailto:tom.wybo@yahoo.fr">tom.wybo@yahoo.fr</a>. We reply within 30 days at most.
        </p>
      </Section>

      <Section title="7. Cookies">
        We use technical cookies required for the website to work (session, cart, language). No third-party advertising cookies are used without your consent.
      </Section>

      <Section title="8. Security">
        Your passwords are encrypted (bcrypt). Communications are secured via HTTPS. We have protections in place against abusive login attempts.
      </Section>

      <Section title="9. Contact">
        For any question about your personal data: <a href="mailto:tom.wybo@yahoo.fr">tom.wybo@yahoo.fr</a>
      </Section>
    </LegalPage>
  );
}
