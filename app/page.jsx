import Image from "next/image";
import MantasoaProduct from "./components/home/MantasoaProduct";
import "./home.css";

export const metadata = {
  title: "Pull-Lover — Maille de Madagascar",
  description: "Le Mantasoa, une maille essentielle fabriquée à la demande dans notre atelier familial à Antananarivo, Madagascar.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Pull-Lover — Le pull qui prend son temps",
    description: "Une seule pièce, fabriquée à la demande dans notre atelier familial à Madagascar.",
    images: [{ url: "/api/media/site/mantasoa-hero.webp", width: 1586, height: 992, alt: "Le Mantasoa, au bord du lac" }],
  },
};

const steps = [
  ["Vous précommandez", "Choisissez votre taille et réservez votre Mantasoa."],
  ["Nous tricotons", "La production démarre avec les quantités réservées."],
  ["Nous finissons", "Chaque pièce est assemblée, contrôlée et finie à la main."],
  ["Il arrive chez vous", "Votre Mantasoa quitte notre atelier pour vous accompagner longtemps."],
];

export default function HomePage() {
  return (
    <div className="pl-home" id="accueil">
      <section className="pl-hero" aria-labelledby="home-title">
        <Image src="/pull-lover-hero.webp" alt="Le pull Mantasoa porté au bord du lac, dans les hauts plateaux de Madagascar" fill sizes="100vw" preload className="pl-hero-image" />
        <div className="pl-hero-copy">
          <p className="pl-eyebrow">Maille de Madagascar · Le Mantasoa</p>
          <h1 id="home-title">Pull <em>Lover</em></h1>
          <div className="pl-hero-foot">
            <a className="pl-button pl-button-light" href="#piece">Découvrir la pièce</a>
            <p>Un cardigan d’exception, fabriqué à la demande dans notre atelier familial à Madagascar.</p>
          </div>
        </div>
        <a className="pl-scroll-cue" href="#manifeste">Explorer</a>
      </section>

      <section className="pl-manifesto" id="manifeste" aria-label="Notre philosophie">
        <p>Nous ne fabriquons pas plus. <span>Nous fabriquons mieux.</span> Une maille essentielle, née entre les hauts plateaux et le lac de Mantasoa.</p>
        <div className="pl-origin">Madagascar · Depuis notre atelier familial</div>
      </section>

      <MantasoaProduct />

      <section className="pl-collection-concept" id="collections" aria-labelledby="collection-concept-title">
        <div className="pl-collection-concept-head">
          <p className="pl-eyebrow">Notre concept</p>
          <h2 id="collection-concept-title">UNE COLLECTION, UN UNIVERS</h2>
        </div>
        <div className="pl-collection-concept-body">
          <p className="pl-collection-concept-intro">Chaque nouvelle collection commence par un vêtement et l’univers que nous imaginons autour de lui. Le thème du site, le lieu du shooting et les images évoluent avec chaque pièce. Une nouvelle collection nous emmènera dans un nouvel endroit, toujours à Madagascar.</p>
          <article className="pl-collection-current" aria-label="Première collection : Le Mantasoa">
            <span className="pl-collection-number" aria-hidden="true">01</span>
            <div className="pl-collection-story">
              <p className="pl-collection-label">Première collection</p>
              <h3>Le Mantasoa</h3>
              <p>Pour ce premier cardigan, nous avons choisi le lac de Mantasoa. C’est là que nous avons réalisé le shooting et trouvé l’atmosphère de cette première collection : ses eaux calmes, sa lumière et ses hauts plateaux.</p>
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
          <h2 id="workshop-title">Fabriqué par des mains, <em>pas par des stocks.</em></h2>
          <p className="pl-workshop-text">Le Mantasoa passe entre les mains de notre équipe familiale, du premier fil à la dernière finition. La précommande nous permet de produire la juste quantité, de préserver le temps du geste et d’éviter les invendus.</p>
          <div className="pl-signature"><span>Atelier familial</span><span>Antananarivo, Madagascar</span></div>
        </div>
      </section>

      <section className="pl-process" id="precommande-info" aria-labelledby="process-title">
        <div className="pl-process-head">
          <p className="pl-eyebrow">La précommande, simplement</p>
          <h2 id="process-title">Votre pull commence à exister quand vous le choisissez.</h2>
        </div>
        <ol className="pl-steps">
          {steps.map(([title, description], index) => (
            <li key={title}>
              <span className="pl-step-number" aria-hidden="true">0{index + 1}</span>
              <h3>{title}</h3><p>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="pl-final" aria-labelledby="final-title">
        <Image src="/api/media/site/mantasoa-hero.webp" alt="" fill sizes="100vw" />
        <div className="pl-final-copy">
          <p className="pl-eyebrow">Le Mantasoa · Fabriqué à la demande</p>
          <h2 id="final-title">Un pull.<br />Longtemps.</h2>
          <p>Une maille essentielle. Le temps de bien faire.<br />Et le plaisir de la porter, année après année.</p>
          <a href="#piece" className="pl-button pl-button-light">Choisir ma taille</a>
        </div>
      </section>
    </div>
  );
}
