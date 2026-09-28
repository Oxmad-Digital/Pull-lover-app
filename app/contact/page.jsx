import Contact from "../components/Contact";

export const metadata = {
  title: "Contact",
  description: "Une question sur une taille, une commande ou la précommande ? Écrivez à l’atelier Pull-Lover, nous vous répondons sous 24 heures.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <Contact />;
}