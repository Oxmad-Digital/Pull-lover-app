import Image from "next/image";
import { notFound } from "next/navigation";
import ContactForm from "./ContactForm";
import { openGraphBase, pageAlternates } from "@/app/lib/seo";
import "./contact.css";

const HERO_IMAGE = "/api/media/pull-lover-vue-de-haut-sur-le-lac.webp?v=4b51b2c2b9d7";
// Tenir compte de la largeur de la photo agrandie par le recadrage cover.
const HERO_SIZES = "(max-width: 599px) max(1138px, 100vw, calc((100svh - 50px) * 16 / 9)), (max-width: 939px) max(1245px, 100vw), (max-width: 1366px) and (orientation: portrait) max(1245px, 100vw), max(100vw, calc(min(760px, 76svh) * 16 / 9))";

const TEXT = {
  fr: {
    description: "Une question sur une pièce Pull-Lover, votre taille ou votre commande ? Écrivez à notre atelier, nous vous répondrons avec soin.",
    ogDescription: "Écrivez à l’équipe Pull-Lover. Nous vous répondrons avec soin depuis notre atelier à Madagascar.",
    heroAlt: "Une femme en cardigan vert assise au bord du lac de Mantasoa",
    eyebrow: "Depuis Madagascar, avec attention",
    title: <>Parlons<br /><em>maille.</em></>,
    intro: "Une question, un doute sur votre taille ou simplement l’envie d’échanger ? Nous sommes à votre écoute.",
    scroll: "Écrivez-nous",
    formLabel: "Formulaire de contact",
    asideEyebrow: "Un lien direct avec l’atelier",
    asideTitle: "Nous prenons le temps de vous répondre.",
    asideText: "Chaque message est lu par notre équipe. Nous revenons vers vous au plus vite, généralement sous deux jours ouvrés.",
    facts: [["Disponibilité", "Lundi — vendredi"], ["Réponse", "Sous 48 heures ouvrées"], ["Atelier", "Antananarivo, Madagascar"]],
  },
  en: {
    description: "A question about a Pull-Lover piece, your size or your order? Write to our workshop and we’ll get back to you with care.",
    ogDescription: "Write to the Pull-Lover team. We’ll get back to you with care from our workshop in Madagascar.",
    heroAlt: "A woman in a green cardigan seated beside Lake Mantasoa",
    eyebrow: "From Madagascar, with care",
    title: <>Let’s talk<br /><em>knitwear.</em></>,
    intro: "A question, unsure about your size, or simply want to chat? We’re here to listen.",
    scroll: "Write to us",
    formLabel: "Contact form",
    asideEyebrow: "A direct line to the workshop",
    asideTitle: "We take the time to reply.",
    asideText: "Every message is read by our team. We get back to you as soon as possible, usually within two business days.",
    facts: [["Availability", "Monday — Friday"], ["Response", "Within 48 business hours"], ["Workshop", "Antananarivo, Madagascar"]],
  },
};

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = TEXT[lang];
  if (!t) notFound();
  return {
    title: "Contact",
    description: t.description,
    alternates: pageAlternates(lang, "/contact"),
    openGraph: { ...openGraphBase(lang), title: "Contact | Pull-Lover", description: t.ogDescription, images: [{ url: HERO_IMAGE, width: 1672, height: 941, alt: t.heroAlt }] },
  };
}

export default async function ContactPage({ params }) {
  const { lang } = await params;
  const t = TEXT[lang];
  if (!t) notFound();
  return <div className="pl-contact">
    <section className="pl-contact-hero" aria-labelledby="contact-title">
      <Image src={HERO_IMAGE} alt={t.heroAlt} fill sizes={HERO_SIZES} quality={90} preload className="pl-contact-hero-image" />
      <div className="pl-contact-hero-shade" aria-hidden="true" />
      <div className="pl-contact-hero-copy" data-reveal-stagger><p className="pl-contact-eyebrow">{t.eyebrow}</p><h1 id="contact-title">{t.title}</h1><p>{t.intro}</p></div>
      <span className="pl-contact-scroll" aria-hidden="true">{t.scroll} <i /></span>
    </section>
    <section className="pl-contact-body" aria-label={t.formLabel}>
      <aside className="pl-contact-intro" data-reveal-stagger><p className="pl-contact-eyebrow">{t.asideEyebrow}</p><h2>{t.asideTitle}</h2><p>{t.asideText}</p><dl>{t.facts.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl></aside>
      <div data-reveal><ContactForm /></div>
    </section>
  </div>;
}
