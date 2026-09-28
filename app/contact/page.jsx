import Image from "next/image";
import ContactForm from "./ContactForm";
import { OPEN_GRAPH_BASE } from "@/app/lib/seo";
import "./contact.css";

export const metadata = {
  title: "Contact",
  description: "Une question sur une pièce Pull-Lover, votre taille ou votre commande ? Écrivez à notre atelier, nous vous répondrons avec soin.",
  alternates: { canonical: "/contact" },
  openGraph: { ...OPEN_GRAPH_BASE, title: "Contact | Pull-Lover", description: "Écrivez à l’équipe Pull-Lover. Nous vous répondrons avec soin depuis notre atelier à Madagascar.", images: [{ url: "/api/media/pull-lover-vue-de-haut-sur-le-lac.webp", alt: "Vue aérienne du lac et des paysages de Mantasoa" }] },
};

export default function ContactPage() {
  return <div className="pl-contact">
    <section className="pl-contact-hero" aria-labelledby="contact-title">
      <Image src="/api/media/pull-lover-vue-de-haut-sur-le-lac.webp" alt="Vue aérienne du lac et des paysages de Mantasoa" fill sizes="100vw" priority className="pl-contact-hero-image" />
      <div className="pl-contact-hero-shade" />
      <div className="pl-contact-hero-copy" data-reveal-stagger><p className="pl-contact-eyebrow">Depuis Madagascar, avec attention</p><h1 id="contact-title">Parlons<br /><em>maille.</em></h1><p>Une question, un doute sur votre taille ou simplement l’envie d’échanger&nbsp;? Nous sommes à votre écoute.</p></div>
      <span className="pl-contact-scroll" aria-hidden="true">Écrivez-nous <i /></span>
    </section>
    <section className="pl-contact-body" aria-label="Formulaire de contact">
      <aside className="pl-contact-intro" data-reveal-stagger><p className="pl-contact-eyebrow">Un lien direct avec l’atelier</p><h2>Nous prenons le temps de vous répondre.</h2><p>Chaque message est lu par notre équipe. Nous revenons vers vous au plus vite, généralement sous deux jours ouvrés.</p><dl><div><dt>Disponibilité</dt><dd>Lundi — vendredi</dd></div><div><dt>Réponse</dt><dd>Sous 48 heures ouvrées</dd></div><div><dt>Atelier</dt><dd>Antananarivo, Madagascar</dd></div></dl></aside>
      <div data-reveal><ContactForm /></div>
    </section>
  </div>;
}
