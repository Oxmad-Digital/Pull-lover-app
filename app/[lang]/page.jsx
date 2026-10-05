import Image from "next/image";
import { notFound } from "next/navigation";
import MantasoaProduct from "@/app/components/home/MantasoaProduct";
import HomeCinematic from "@/app/components/home/HomeCinematic";
import JsonLd from "@/app/components/JsonLd";
import { getFeaturedProductState } from "@/app/lib/products";
import { SITE_NAME, openGraphBase, organizationJsonLd, pageAlternates, websiteJsonLd } from "@/app/lib/seo";
import "./home.css";

// Le prix et la description du produit sont rendus côté serveur, régénérés au plus toutes les 60 s
export const revalidate = 60;

const HERO_IMAGE = "/api/media/pull-lover-hero.webp?v=7a46013c4022";

// Le recadrage cover agrandit la photo au-delà de la largeur du viewport sur mobile.
// Les tailles suivent les hauteurs minimales du hero pour charger assez de pixels.
const HERO_SIZES = "(max-width: 599px) max(1316px, 100vw, calc((100svh - 50px) * 16 / 9)), max(1245px, 100vw, calc((100svh - 34px) * 16 / 9))";

const TEXT = {
  fr: {
    title: `${SITE_NAME} | La passion de la maille`,
    description: "Mailles artisanales imaginées et fabriquées à la demande dans notre atelier familial à Antananarivo, Madagascar. Découvrez la collection du moment.",
    ogTitle: `${SITE_NAME} | La passion de la maille`,
    ogDescription: "Mailles artisanales imaginées et fabriquées à la demande dans notre atelier familial à Madagascar.",
    ogAlt: "Le cardigan, au bord du lac",
    manifesto: [
      { text: "Tricoter uniquement ce que vous commandez." },
      { text: "C'est notre secret", accent: true },
      { text: "pour vous offrir une maille d’exception, confectionnée avec passion, en quantité limitée." },
    ],
    steps: [
      ["Vous précommandez", "Choisissez votre taille et réservez votre maille.", "30 jours"],
      ["Nous commandons le fil", "La laine nécessaire est commandée selon les quantités réservées.", "15 jours"],
      ["Nous fabriquons", "Chaque pièce est tricotée, assemblée et finie à la main.", "45 jours"],
      ["Nous expédions", "Votre maille quitte notre atelier pour vous accompagner longtemps.", "15 jours"],
    ],
    heroAlt: "Le cardigan porté au bord du lac, dans les hauts plateaux de Madagascar",
    eyebrow: "Maille de Madagascar",
    discover: "Découvrir la pièce",
    heroText: "Un cardigan oversize pensé pour devenir votre basique. Fabriqué à la demande à Madagascar.",
    explore: "Explorer",
    philosophy: "Notre philosophie",
    origin: "Madagascar · Depuis notre atelier familial",
    concept: "Notre concept",
    conceptTitle: "UNE COLLECTION, UN UNIVERS",
    conceptIntro: "Chaque nouvelle collection commence par un vêtement et l’univers que nous imaginons autour de lui. Le thème du site, le lieu du shooting et les images évoluent avec chaque pièce. Une nouvelle collection nous emmènera dans un nouvel endroit, toujours à Madagascar.",
    firstCollectionLabel: "Première collection : Mantasoa",
    firstCollection: "Première collection",
    collectionText: "Pour cette première collection, nous vous emmenons au bord du lac de Mantasoa. Un endroit étonnant à seulement quelques heures de Tana, où l’ombre des pins danse sur l’eau calme du lac. C’est ici qu’est née l’inspiration de cette première collection, et que nous avons réalisé le shooting photo.",
    workshopAlt: "Les mains d’une artisane réalisent les finitions d’un pull écru dans notre atelier",
    workshopEyebrow: "Le geste juste",
    workshopTitle: <>La maille, <em>un savoir-faire.</em></>,
    workshopText: "Depuis 30 ans, Ultramaille, notre atelier familial à Antananarivo, façonne la maille avec exigence. Pour fêter cet anniversaire, nous lançons notre propre marque. Le fil est choisi pour chaque pièce, l’assemblage et les finitions sont réalisés à la main, et chaque pièce est contrôlée avec soin avant de quitter l’atelier. De l’atelier au dressing.",
    workshopSignature: "Atelier familial",
    processEyebrow: "La précommande, simplement",
    processTitle: "Votre pull commence à exister quand vous le choisissez.",
    durationLabel: "Durée :",
    finalEyebrow: "Fabriqué à la demande",
    finalTitle: <>Un cardigan <br />intemporel et durable.</>,
    finalText: <>La passion de la maille.<br />Des pièces conçues pour traverser le temps sans se déformer.</>,
    chooseSize: "Choisir ma taille",
  },
  en: {
    title: `${SITE_NAME} | The love of knitwear`,
    description: "Handcrafted knitwear designed and made to order in our family workshop in Antananarivo, Madagascar. Discover the current collection.",
    ogTitle: `${SITE_NAME} | The love of knitwear`,
    ogDescription: "Handcrafted knitwear designed and made to order in our family workshop in Madagascar.",
    ogAlt: "The cardigan, by the lake",
    manifesto: [
      { text: "We only knit what you order." },
      { text: "That's our secret", accent: true },
      { text: "to offer you exceptional knitwear, crafted with passion, in limited quantities." },
    ],
    steps: [
      ["You pre-order", "Choose your size and reserve your piece.", "30 days"],
      ["We order the yarn", "The wool we need is ordered based on the quantities reserved.", "15 days"],
      ["We make it", "Each piece is knitted, assembled and finished by hand.", "45 days"],
      ["We ship it", "Your knit leaves our workshop, ready to stay with you for years.", "15 days"],
    ],
    heroAlt: "The cardigan worn by the lake, in the highlands of Madagascar",
    eyebrow: "Knitwear from Madagascar",
    discover: "Discover the piece",
    heroText: "An oversized cardigan designed to become your go-to essential. Made to order in Madagascar.",
    explore: "Explore",
    philosophy: "Our philosophy",
    origin: "Madagascar · From our family workshop",
    concept: "Our concept",
    conceptTitle: "ONE COLLECTION, ONE WORLD",
    conceptIntro: "Each new collection starts with a garment and the world we imagine around it. The website’s theme, the photo shoot location and the images change with every piece. Each new collection will take us somewhere new, always in Madagascar.",
    firstCollectionLabel: "First collection: Mantasoa",
    firstCollection: "First collection",
    collectionText: "For this first collection, we take you to the shores of Lake Mantasoa. A striking place just a few hours from Tana, where the shadows of the pines dance on the calm water. This is where the inspiration for this first collection was born, and where we did the photo shoot.",
    workshopAlt: "An artisan’s hands finishing an ecru sweater in our workshop",
    workshopEyebrow: "The right gesture",
    workshopTitle: <>Knitting, <em>a craft.</em></>,
    workshopText: "For 30 years, Ultramaille, our family workshop in Antananarivo, has been crafting knitwear with care and precision. To celebrate this anniversary, we are launching our own brand. The yarn is chosen for each piece, assembly and finishing are done by hand, and every piece is carefully inspected before it leaves the workshop. From our workshop to your wardrobe.",
    workshopSignature: "Family workshop",
    processEyebrow: "Pre-ordering, simply",
    processTitle: "Your sweater starts to exist the moment you choose it.",
    durationLabel: "Duration:",
    finalEyebrow: "Made to order",
    finalTitle: <>A timeless, <br />lasting cardigan.</>,
    finalText: <>A passion for knitwear.<br />Pieces designed to stand the test of time without losing their shape.</>,
    chooseSize: "Choose my size",
  },
};

// Chaque mot reste insécable ; chaque lettre est un span animé par HomeCinematic.
function splitChars(text) {
  return text.split(" ").flatMap((word, wordIndex) => [
    wordIndex > 0 ? " " : null,
    <span key={wordIndex} className="pl-manifesto-word">
      {Array.from(word).map((char, charIndex) => (
        <span key={charIndex} className="pl-manifesto-char">{char}</span>
      ))}
    </span>,
  ]);
}

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = TEXT[lang];
  // Les bots qui sondent /xmlrpc.php, /wp-login.php… atterrissent ici avec un « lang » inconnu
  if (!t) notFound();
  return {
    title: { absolute: t.title },
    description: t.description,
    alternates: pageAlternates(lang, "/"),
    openGraph: {
      ...openGraphBase(lang),
      title: t.ogTitle,
      description: t.ogDescription,
      images: [{ url: HERO_IMAGE, width: 1672, height: 941, alt: t.ogAlt }],
    },
  };
}

export default async function HomePage({ params }) {
  const { lang } = await params;
  const t = TEXT[lang];
  // Les bots qui sondent /xmlrpc.php, /wp-login.php… atterrissent ici avec un « lang » inconnu
  if (!t) notFound();
  const featured = await getFeaturedProductState();
  return (
    <div className="pl-home" id="accueil">
      <JsonLd data={[organizationJsonLd(lang), websiteJsonLd()]} />
      <HomeCinematic />
      <section className="pl-hero" aria-labelledby="home-title">
        <Image src={HERO_IMAGE} alt={t.heroAlt} fill sizes={HERO_SIZES} quality={90} preload className="pl-hero-image" />
        <div className="pl-hero-copy">
          <h1 id="home-title">
            <span className="pl-eyebrow">{t.eyebrow}</span>
            <span className="pl-hero-title-line"><span>Pull</span> <span><em>Lover</em></span></span>
          </h1>
          <div className="pl-hero-foot">
            <a className="pl-button pl-button-light" href="#piece">{t.discover}</a>
            <p>{t.heroText}</p>
          </div>
        </div>
        <a className="pl-scroll-cue" href="#manifeste">{t.explore}</a>
      </section>

      <section className="pl-manifesto" id="manifeste" aria-label={t.philosophy}>
        <p aria-label={t.manifesto.map((line) => line.text).join(" ")}>
          {t.manifesto.map((line, index) => (
            <span key={line.text} className={`pl-manifesto-line${line.accent ? " pl-manifesto-accent" : ""}`} aria-hidden="true">
              {index > 0 && " "}
              {splitChars(line.text)}
            </span>
          ))}
        </p>
        <span className="pl-manifesto-thread" aria-hidden="true" />
        <div className="pl-origin">{t.origin}</div>
      </section>

      <MantasoaProduct initialState={featured} />

      <section className="pl-collection-concept" id="collections" aria-labelledby="collection-concept-title">
        <div className="pl-collection-concept-head">
          <p className="pl-eyebrow" data-pl-scatter>{t.concept}</p>
          <h2 id="collection-concept-title" data-pl-scatter>{t.conceptTitle}</h2>
        </div>
        <span className="pl-collection-rule" aria-hidden="true" />
        <div className="pl-collection-concept-body">
          <p className="pl-collection-concept-intro" data-pl-scatter>{t.conceptIntro}</p>
          <article className="pl-collection-current" aria-label={t.firstCollectionLabel}>
            <span className="pl-collection-number" aria-hidden="true" data-pl-scatter>01</span>
            <div className="pl-collection-story">
              <p className="pl-collection-label" data-pl-scatter>{t.firstCollection}</p>
              <h3 data-pl-scatter>Mantasoa</h3>
              <p data-pl-scatter>{t.collectionText}</p>
            </div>
          </article>
        </div>
      </section>

      <section className="pl-workshop" id="atelier" aria-labelledby="workshop-title">
        <div className="pl-workshop-image">
          <Image src="/api/media/site/atelier-maille.webp" alt={t.workshopAlt} fill sizes="(max-width: 939px) 100vw, 50vw" />
        </div>
        <div className="pl-workshop-copy">
          <p className="pl-eyebrow">{t.workshopEyebrow}</p>
          <h2 id="workshop-title">{t.workshopTitle}</h2>
          <p className="pl-workshop-text">{t.workshopText}</p>
          <div className="pl-signature"><span>{t.workshopSignature}</span><span>Antananarivo, Madagascar</span></div>
        </div>
      </section>

      <section className="pl-process" id="precommande-info" aria-labelledby="process-title">
        <div className="pl-process-head">
          <p className="pl-eyebrow">{t.processEyebrow}</p>
          <h2 id="process-title">{t.processTitle}</h2>
        </div>
        <div className="pl-steps-wrap">
          <span className="pl-process-thread" aria-hidden="true" />
          <ol className="pl-steps">
            {t.steps.map(([title, description, duration], index) => (
              <li key={title}>
                <div className="pl-step-meta">
                  <span className="pl-step-number" aria-hidden="true">0{index + 1}</span>
                  <span className="pl-step-duration">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                    {t.durationLabel} {duration}
                  </span>
                </div>
                <h3>{title}</h3><p>{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pl-final" aria-labelledby="final-title">
        <Image src="/api/media/pull-lover-manequin-cardigan-2.webp?v=b25ae1191378" alt="" fill sizes="100vw" />
        <div className="pl-final-copy">
          <p className="pl-eyebrow">{t.finalEyebrow}</p>
          <h2 id="final-title">{t.finalTitle}</h2>
          <p>{t.finalText}</p>
          <a href="#piece" className="pl-button pl-button-light">{t.chooseSize}</a>
        </div>
      </section>
    </div>
  );
}
