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
          <h1 id="home-title">Le pull qui prend <em>son temps.</em></h1>
          <div className="pl-hero-foot">
            <a className="pl-button pl-button-light" href="#piece">Découvrir la pièce <span aria-hidden="true">→</span></a>
            <p>Une seule pièce, fabriquée à la demande dans notre atelier familial à Antananarivo.</p>
          </div>
        </div>
        <a className="pl-scroll-cue" href="#manifeste">Explorer</a>
      </section>

      <section className="pl-manifesto" id="manifeste" aria-label="Notre philosophie">
        <p>Nous ne fabriquons pas plus. <span>Nous fabriquons mieux.</span> Une maille essentielle, née entre les hauts plateaux et le lac de Mantasoa.</p>
        <div className="pl-origin">Madagascar · Depuis notre atelier familial</div>
      </section>

      <MantasoaProduct />

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
          <p>Une maille essentielle. Le temps de bien faire.<br />Et le plaisir de la porter, saison après saison.</p>
          <a href="#piece" className="pl-button pl-button-light">Choisir ma taille</a>
        </div>
      </section>
    </div>
  );
}
