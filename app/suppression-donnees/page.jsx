export const metadata = {
  title: "Suppression des données — Pull Lover",
  description: "Comment demander la suppression de vos données personnelles sur Pull Lover.",
};

export default function SuppressionDonneesPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px", fontFamily: "Montserrat, sans-serif", color: "#252323", lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Suppression de vos données</h1>
      <p style={{ color: "#64748b", marginBottom: 48 }}>Conformément au RGPD et aux exigences de Meta (Facebook), vous pouvez demander la suppression de vos données à tout moment.</p>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Quelles données sont concernées ?</h2>
        <ul style={{ paddingLeft: 20, color: "#334155" }}>
          <li>Votre compte Pull Lover (nom, e-mail, mot de passe chiffré)</li>
          <li>Votre historique de commandes</li>
          <li>Vos informations de livraison</li>
          <li>Vos préférences et favoris</li>
          <li>Les données reçues lors de votre connexion via Facebook ou Google</li>
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Comment faire une demande de suppression ?</h2>
        <p style={{ color: "#334155", marginBottom: 16 }}>
          Envoyez un e-mail à <a href="mailto:tom.wybo@yahoo.fr?subject=Demande%20de%20suppression%20de%20données" style={{ color: "#C75C5C", fontWeight: 600 }}>tom.wybo@yahoo.fr</a> avec :
        </p>
        <ul style={{ paddingLeft: 20, color: "#334155" }}>
          <li>L'objet : <strong>Demande de suppression de données</strong></li>
          <li>L'adresse e-mail associée à votre compte Pull Lover</li>
          <li>Une brève description de votre demande</li>
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Délai de traitement</h2>
        <p style={{ color: "#334155" }}>
          Nous traitons votre demande dans un délai maximum de <strong>30 jours</strong> suivant sa réception. Vous recevrez une confirmation par e-mail une fois la suppression effectuée.
        </p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Ce qui ne peut pas être supprimé</h2>
        <p style={{ color: "#334155" }}>
          Certaines données peuvent être conservées pour des obligations légales (ex : données de facturation conservées 10 ans conformément au Code de commerce). Ces données ne seront plus utilisées à d'autres fins.
        </p>
      </section>

      <div style={{ background: "#f1f5f9", borderRadius: 12, padding: "24px 28px", marginTop: 48 }}>
        <p style={{ color: "#334155", margin: 0 }}>
          <strong>Contact :</strong>{" "}
          <a href="mailto:tom.wybo@yahoo.fr" style={{ color: "#C75C5C" }}>tom.wybo@yahoo.fr</a>
          <br />
          <span style={{ fontSize: 14, color: "#64748b" }}>Réponse garantie sous 30 jours ouvrés.</span>
        </p>
      </div>
    </main>
  );
}
