import { pageAlternates } from "@/app/lib/seo";

const TEXT = {
  fr: {
    title: "Suppression des données",
    description: "Comment demander la suppression de vos données personnelles sur Pull-Lover.",
    heading: "Suppression de vos données",
    intro: "Conformément au RGPD et aux exigences de Meta (Facebook), vous pouvez demander la suppression de vos données à tout moment.",
    whichTitle: "Quelles données sont concernées ?",
    which: [
      "Votre compte Pull Lover (nom, e-mail, mot de passe chiffré)",
      "Votre historique de commandes",
      "Vos informations de livraison",
      "Vos préférences",
      "Les données reçues lors de votre connexion via Facebook ou Google",
    ],
    howTitle: "Comment faire une demande de suppression ?",
    howIntro: "Envoyez un e-mail à",
    howWith: "avec :",
    mailSubject: "Demande de suppression de données",
    how: [
      <>L&apos;objet : <strong>Demande de suppression de données</strong></>,
      "L'adresse e-mail associée à votre compte Pull Lover",
      "Une brève description de votre demande",
    ],
    delayTitle: "Délai de traitement",
    delay: <>Nous traitons votre demande dans un délai maximum de <strong>30 jours</strong> suivant sa réception. Vous recevrez une confirmation par e-mail une fois la suppression effectuée.</>,
    keptTitle: "Ce qui ne peut pas être supprimé",
    kept: "Certaines données peuvent être conservées pour des obligations légales (ex : données de facturation conservées 10 ans conformément au Code de commerce). Ces données ne seront plus utilisées à d'autres fins.",
    contact: "Contact :",
    guarantee: "Réponse garantie sous 30 jours ouvrés.",
  },
  en: {
    title: "Data deletion",
    description: "How to request the deletion of your personal data on Pull-Lover.",
    heading: "Deleting your data",
    intro: "In accordance with the GDPR and Meta (Facebook) requirements, you can request the deletion of your data at any time.",
    whichTitle: "What data is concerned?",
    which: [
      "Your Pull Lover account (name, email, encrypted password)",
      "Your order history",
      "Your delivery information",
      "Your preferences",
      "Data received when you sign in via Facebook or Google",
    ],
    howTitle: "How to request deletion?",
    howIntro: "Send an email to",
    howWith: "including:",
    mailSubject: "Data deletion request",
    how: [
      <>The subject: <strong>Data deletion request</strong></>,
      "The email address linked to your Pull Lover account",
      "A short description of your request",
    ],
    delayTitle: "Processing time",
    delay: <>We process your request within <strong>30 days</strong> of receiving it. You will receive an email confirmation once the deletion is complete.</>,
    keptTitle: "What cannot be deleted",
    kept: "Some data may be kept to meet legal obligations (e.g. billing data kept for 10 years under the French Commercial Code). This data will not be used for any other purpose.",
    contact: "Contact:",
    guarantee: "Guaranteed reply within 30 business days.",
  },
};

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = TEXT[lang];
  return { title: t.title, description: t.description, alternates: pageAlternates(lang, "/suppression-donnees") };
}

export default async function SuppressionDonneesPage({ params }) {
  const { lang } = await params;
  const t = TEXT[lang];
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px", fontFamily: "Montserrat, sans-serif", color: "#252323", lineHeight: 1.8 }} data-reveal-stagger>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{t.heading}</h1>
      <p style={{ color: "#64748b", marginBottom: 48 }}>{t.intro}</p>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{t.whichTitle}</h2>
        <ul style={{ paddingLeft: 20, color: "#334155" }}>
          {t.which.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{t.howTitle}</h2>
        <p style={{ color: "#334155", marginBottom: 16 }}>
          {t.howIntro} <a href={`mailto:tom.wybo@yahoo.fr?subject=${encodeURIComponent(t.mailSubject)}`} style={{ color: "#C75C5C", fontWeight: 600 }}>tom.wybo@yahoo.fr</a> {t.howWith}
        </p>
        <ul style={{ paddingLeft: 20, color: "#334155" }}>
          {t.how.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{t.delayTitle}</h2>
        <p style={{ color: "#334155" }}>{t.delay}</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{t.keptTitle}</h2>
        <p style={{ color: "#334155" }}>{t.kept}</p>
      </section>

      <div style={{ background: "#f1f5f9", borderRadius: 12, padding: "24px 28px", marginTop: 48 }}>
        <p style={{ color: "#334155", margin: 0 }}>
          <strong>{t.contact}</strong>{" "}
          <a href="mailto:tom.wybo@yahoo.fr" style={{ color: "#C75C5C" }}>tom.wybo@yahoo.fr</a>
          <br />
          <span style={{ fontSize: 14, color: "#64748b" }}>{t.guarantee}</span>
        </p>
      </div>
    </div>
  );
}
