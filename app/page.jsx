import Image from "next/image";
import MantasoaProduct from "./components/home/MantasoaProduct";
import HomeCinematic from "./components/home/HomeCinematic";
import "./home.css";

const MANIFESTO_LINES = [
  { text: "Produire uniquement ce que vous commandez." },
  { text: "C'est notre secret", accent: true },
  { text: "pour vous offrir une maille de qualité à prix juste, façonnée avec passion, sans aucun gaspillage." },
];

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

export const metadata = {
  title: "Pull-Lover — Maille de Madagascar",
  description: "Notre cardigan en maille de Madagascar, une pièce essentielle fabriquée à la demande dans notre atelier familial à Antananarivo, Madagascar.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Pull-Lover — Le pull qui prend son temps",
    description: "Une seule pièce, fabriquée à la demande dans notre atelier familial à Madagascar.",
    images: [{ url: "/api/media/site/mantasoa-hero.webp", width: 1586, height: 992, alt: "Le cardigan, au bord du lac" }],
  },
};

const steps = [
  ["Vous précommandez", "Choisissez votre taille et réservez votre maille."],
  ["Nous commandons le fil", "La laine nécessaire est commandée selon les quantités réservées."],
  ["Nous fabriquons", "Chaque pièce est tricotée, assemblée et finie à la main."],
  ["Nous expédions", "Votre maille quitte notre atelier pour vous accompagner longtemps."],
];

export default function HomePage() {
  return (
    <div className="pl-home" id="accueil">
      <HomeCinematic />
      <section className="pl-hero" aria-labelledby="home-title">
        <Image src="/pull-lover-hero.webp" alt="Le cardigan porté au bord du lac, dans les hauts plateaux de Madagascar" fill sizes="100vw" preload className="pl-hero-image" />
        <div className="pl-hero-copy">
          <p className="pl-eyebrow">Maille de Madagascar</p>
          <h1 id="home-title" className="pl-hero-title-line"><span>Pull</span> <span><em>Lover</em></span></h1>
          <div className="pl-hero-foot">
            <a className="pl-button pl-button-light" href="#piece">Découvrir la pièce</a>
            <p>Un cardigan d’exception, fabriqué à la demande dans notre atelier familial à Madagascar.</p>
          </div>
        </div>
        <a className="pl-scroll-cue" href="#manifeste">Explorer</a>
      </section>

      <section className="pl-manifesto" id="manifeste" aria-label="Notre philosophie">
        <p aria-label={MANIFESTO_LINES.map((line) => line.text).join(" ")}>
          {MANIFESTO_LINES.map((line, index) => (
            <span key={line.text} className={`pl-manifesto-line${line.accent ? " pl-manifesto-accent" : ""}`} aria-hidden="true">
              {index > 0 && " "}
              {splitChars(line.text)}
            </span>
          ))}
        </p>
        <span className="pl-manifesto-thread" aria-hidden="true" />
        <div className="pl-origin">Madagascar · Depuis notre atelier familial</div>
      </section>

      <MantasoaProduct />

      <section className="pl-collection-concept" id="collections" aria-labelledby="collection-concept-title">
        <div className="pl-collection-concept-head">
          <p className="pl-eyebrow" data-pl-scatter>Notre concept</p>
          <h2 id="collection-concept-title" data-pl-scatter>UNE COLLECTION, UN UNIVERS</h2>
        </div>
        <span className="pl-collection-rule" aria-hidden="true" />
        <div className="pl-collection-concept-body">
          <p className="pl-collection-concept-intro" data-pl-scatter>Chaque nouvelle collection commence par un vêtement et l’univers que nous imaginons autour de lui. Le thème du site, le lieu du shooting et les images évoluent avec chaque pièce. Une nouvelle collection nous emmènera dans un nouvel endroit, toujours à Madagascar.</p>
          <article className="pl-collection-current" aria-label="Première collection : Mantasoa">
            <span className="pl-collection-number" aria-hidden="true" data-pl-scatter>01</span>
            <div className="pl-collection-story">
              <p className="pl-collection-label" data-pl-scatter>Première collection</p>
              <h3 data-pl-scatter>Mantasoa</h3>
              <p data-pl-scatter>Pour cette première collection, nous vous emmenons au bord du lac de Mantasoa. Un endroit étonnant à seulement quelques heures de Tana, où l’ombre des pins danse sur l’eau calme du lac. C’est ici qu’est née l’inspiration de cette première collection, et que nous avons réalisé le shooting photo.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="pl-workshop" id="atelier" aria-labelledby="workshop-title">
        <div className="pl-workshop-image">
          <Image src="/api/media/site/atelier-maille.webp" alt="Les mains d’une artisane réalisent les finitions d’un pull écru dans notre atelier" fill sizes="(max-width: 939px) 100vw, 50vw" />
        </div>
        <div className="pl-workshop-copy">
          <p className="pl-eyebrow">Le geste juste</p>
          <h2 id="workshop-title">La maille, <em>un savoir-faire familial.</em></h2>
          <p className="pl-workshop-text">Nous choisissons un fil de qualité selon les exigences de chaque pièce, repris à la main par nos artisans pour l’assemblage et les finitions. Chaque pièce est ensuite contrôlée avec rigueur : qualité de la maille, propreté des coutures, netteté des finitions. La précommande nous permet de produire la juste quantité, pour vous proposer des pièces de qualité, au juste prix.</p>
          <div className="pl-signature"><span>Atelier familial</span><span>Antananarivo, Madagascar</span></div>
        </div>
      </section>

      <section className="pl-process" id="precommande-info" aria-labelledby="process-title">
        <div className="pl-process-head">
          <p className="pl-eyebrow">La précommande, simplement</p>
          <h2 id="process-title">Votre pull commence à exister quand vous le choisissez.</h2>
        </div>
        <div className="pl-steps-wrap">
          <span className="pl-process-thread" aria-hidden="true" />
          <ol className="pl-steps">
            {steps.map(([title, description], index) => (
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
          <p className="pl-eyebrow">Fabriqué à la demande</p>
          <h2 id="final-title">Un vêtement <br />intemporel et durable.</h2>
          <p>La passion de la maille.<br />Des pièces conçues pour traverser le temps sans se déformer.</p>
          <a href="#piece" className="pl-button pl-button-light">Choisir ma taille</a>
        </div>
      </section>
    </div>
  );
}
