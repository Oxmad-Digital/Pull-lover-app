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

const TEXT = {
  fr: {
    title: `${SITE_NAME} — Cardigan en maille de Madagascar, fait à la demande`,
    description: "Notre cardigan en maille de Madagascar, une pièce essentielle fabriquée à la demande dans notre atelier familial à Antananarivo, Madagascar.",
    ogTitle: "Pull-Lover — Le pull qui prend son temps",
    ogDescription: "Une seule pièce, fabriquée à la demande dans notre atelier familial à Madagascar.",
    ogAlt: "Le cardigan, au bord du lac",
    manifesto: [
      { text: "Produire uniquement ce que vous commandez." },
      { text: "C'est notre secret", accent: true },
      { text: "pour vous offrir une maille de qualité à prix juste, façonnée avec passion, sans aucun gaspillage." },
    ],
    steps: [
      ["Vous précommandez", "Choisissez votre taille et réservez votre maille."],
      ["Nous commandons le fil", "La laine nécessaire est commandée selon les quantités réservées."],
      ["Nous fabriquons", "Chaque pièce est tricotée, assemblée et finie à la main."],
      ["Nous expédions", "Votre maille quitte notre atelier pour vous accompagner longtemps."],
    ],
    heroAlt: "Le cardigan porté au bord du lac, dans les hauts plateaux de Madagascar",
    eyebrow: "Maille de Madagascar",
    discover: "Découvrir la pièce",
    heroText: "Un cardigan d’exception, fabriqué à la demande dans notre atelier familial à Madagascar.",
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
    workshopTitle: <>La maille, <em>un savoir-faire familial.</em></>,
    workshopText: "Nous choisissons un fil de qualité selon les exigences de chaque pièce, repris à la main par nos artisans pour l’assemblage et les finitions. Chaque pièce est ensuite contrôlée avec rigueur : qualité de la maille, propreté des coutures, netteté des finitions. La précommande nous permet de produire la juste quantité, pour vous proposer des pièces de qualité, au juste prix.",
    workshopSignature: "Atelier familial",
    processEyebrow: "La précommande, simplement",
    processTitle: "Votre pull commence à exister quand vous le choisissez.",
    finalEyebrow: "Fabriqué à la demande",
    finalTitle: <>Un vêtement <br />intemporel et durable.</>,
    finalText: <>La passion de la maille.<br />Des pièces conçues pour traverser le temps sans se déformer.</>,
    chooseSize: "Choisir ma taille",
  },
  en: {
    title: `${SITE_NAME} — Knit cardigan from Madagascar, made to order`,
    description: "Our knit cardigan from Madagascar, an essential piece made to order in our family workshop in Antananarivo, Madagascar.",
    ogTitle: "Pull-Lover — The sweater that takes its time",
    ogDescription: "A single piece, made to order in our family workshop in Madagascar.",
    ogAlt: "The cardigan, by the lake",
    manifesto: [
      { text: "We only make what you order." },
      { text: "That's our secret", accent: true },
      { text: "to offer you quality knitwear at a fair price, crafted with passion, with zero waste." },
    ],
    steps: [
      ["You pre-order", "Choose your size and reserve your piece."],
      ["We order the yarn", "The wool we need is ordered based on the quantities reserved."],
      ["We make it", "Each piece is knitted, assembled and finished by hand."],
      ["We ship it", "Your knit leaves our workshop, ready to stay with you for years."],
    ],
    heroAlt: "The cardigan worn by the lake, in the highlands of Madagascar",
    eyebrow: "Knitwear from Madagascar",
    discover: "Discover the piece",
    heroText: "An exceptional cardigan, made to order in our family workshop in Madagascar.",
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
    workshopTitle: <>Knitting, <em>a family craft.</em></>,
    workshopText: "We choose a quality yarn to suit each piece, then our artisans assemble and finish it by hand. Every piece is carefully inspected: quality of the knit, clean seams, crisp finishes. Pre-ordering lets us make just the right quantity, so we can offer you quality pieces at a fair price.",
    workshopSignature: "Family workshop",
    processEyebrow: "Pre-ordering, simply",
    processTitle: "Your sweater starts to exist the moment you choose it.",
    finalEyebrow: "Made to order",
    finalTitle: <>A timeless, <br />lasting garment.</>,
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
      images: [{ url: "/api/media/site/mantasoa-hero.webp", width: 1586, height: 992, alt: t.ogAlt }],
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
        <Image src="/pull-lover-hero.webp" alt={t.heroAlt} fill sizes="100vw" preload className="pl-hero-image" />
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
            {t.steps.map(([title, description], index) => (
              <li key={title}>
                <span className="pl-step-number" aria-hidden="true">0{index + 1}</span>
                <h3>{title}</h3><p>{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pl-final" aria-labelledby="final-title">
        <Image src="/api/media/pull-lover-manequin-cardigan-2.webp" alt="" fill sizes="100vw" />
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
