import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité — Pull Lover",
  description: "Politique de confidentialité et protection des données personnelles de Pull Lover.",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 32px", fontFamily: "Montserrat, sans-serif", color: "#252323", lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Politique de confidentialité</h1>
      <p style={{ color: "#64748b", marginBottom: 48 }}>Dernière mise à jour : juin 2025</p>

      <Section title="1. Qui sommes-nous ?">
        Pull Lover est une boutique en ligne de vente de pulls et vêtements en mailles. Le responsable du traitement des données est Pull Lover (contact : <a href="mailto:tom.wybo@yahoo.fr" style={{ color: "#C75C5C" }}>tom.wybo@yahoo.fr</a>).
      </Section>

      <Section title="2. Données collectées">
        Nous collectons les données suivantes :
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li>Nom et prénom</li>
          <li>Adresse e-mail</li>
          <li>Adresse de livraison</li>
          <li>Historique de commandes</li>
          <li>Données de connexion (via e-mail, Google ou Facebook)</li>
        </ul>
      </Section>

      <Section title="3. Finalités du traitement">
        Vos données sont utilisées pour :
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li>Gérer votre compte et vos commandes</li>
          <li>Assurer la livraison de vos achats</li>
          <li>Vous envoyer des confirmations de commande par e-mail</li>
          <li>Vous envoyer notre newsletter si vous y avez consenti</li>
          <li>Améliorer nos services et la sécurité du site</li>
        </ul>
      </Section>

      <Section title="4. Connexion via réseaux sociaux (Google, Facebook)">
        Si vous choisissez de vous connecter via Google ou Facebook, nous recevons uniquement votre nom et votre adresse e-mail depuis ces plateformes. Nous ne publions rien sur votre profil social et n'accédons pas à vos contacts. Ces données sont traitées conformément à la présente politique.
      </Section>

      <Section title="5. Conservation des données">
        Vos données personnelles sont conservées pendant toute la durée de votre relation commerciale avec nous, puis archivées pendant 3 ans à des fins légales. Vous pouvez demander leur suppression à tout moment (voir section 7).
      </Section>

      <Section title="6. Partage des données">
        Nous ne vendons pas vos données. Elles peuvent être partagées uniquement avec :
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li>Nos prestataires de paiement et de livraison</li>
          <li>Nos hébergeurs (Neon, Cloudflare R2, Vercel)</li>
        </ul>
        Tous nos prestataires sont soumis à des obligations de confidentialité strictes.
      </Section>

      <Section title="7. Vos droits (RGPD)">
        Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
          <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
          <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
          <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
          <li><strong>Droit d'opposition</strong> : vous opposer à certains traitements</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          Pour exercer ces droits, et notamment demander la <Link href="/suppression-donnees" style={{ color: "#C75C5C", fontWeight: 600 }}>suppression de vos données</Link>, contactez-nous à <a href="mailto:tom.wybo@yahoo.fr" style={{ color: "#C75C5C" }}>tom.wybo@yahoo.fr</a>. Nous répondons dans un délai maximum de 30 jours.
        </p>
      </Section>

      <Section title="8. Cookies">
        Nous utilisons des cookies techniques nécessaires au fonctionnement du site (session, panier). Aucun cookie publicitaire tiers n'est utilisé sans votre consentement.
      </Section>

      <Section title="9. Sécurité">
        Vos mots de passe sont chiffrés (bcrypt). Les communications sont sécurisées via HTTPS. Nous mettons en place des mécanismes de protection contre les tentatives de connexion abusives.
      </Section>

      <Section title="10. Contact">
        Pour toute question relative à vos données personnelles : <a href="mailto:tom.wybo@yahoo.fr" style={{ color: "#C75C5C" }}>tom.wybo@yahoo.fr</a>
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
