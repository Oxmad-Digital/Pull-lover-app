"use client";

import { useScrollReveal } from "../hooks/useScrollReveal";
import { ButtonPrimary } from "./ui/Button";
import { Eyebrow } from "./ui/Tag";
import "./NotreMarque.css";

const STATS = [
    { value: "15+", label: "Artisanes malgaches" },
    { value: "4", label: "Matières nobles" },
    { value: "100%", label: "Fait main" },
    { value: "2020", label: "Année de création" },
];


export default function NotreMarque() {
    const introRef = useScrollReveal();
    const statsRef = useScrollReveal();
    const videoHeaderRef = useScrollReveal();
    const videoWrapRef = useScrollReveal();
    const ctaRef = useScrollReveal();

    return (
        <div className="nm">

            {/* —— Intro —— */}
            <section className="nm-intro">
                <div className="nm-container">
                    <div className="nm-intro__inner reveal" ref={introRef}>
                        <div className="nm-intro__left">
                            <Eyebrow className="nm-eyebrow">Notre marque</Eyebrow>
                            <h2 className="nm-intro__heading">
                                Pull Lover, une marque, une histoire
                            </h2>
                        </div>
                        <div className="nm-intro__right">
                            <p>
                                Pull Lover est née d'une conviction simple : la mode peut être belle sans
                                sacrifier l'humain ni la planète. Fondée à Antananarivo, notre maison s'est
                                construite autour d'un réseau d'artisanes malgaches dont le savoir-faire,
                                transmis de génération en génération, donne vie à chaque pièce. Rien n'est
                                produit à la chaîne — chaque pull est l'expression d'un geste maîtrisé,
                                d'une attention portée au moindre détail.
                            </p>
                            <p>
                                Nous sélectionnons rigoureusement nos matières : laine mérinos douce et
                                thermorégulatrice, raphia naturel récolté à la main, coton biologique certifié,
                                soie sauvage aux reflets uniques. Ces fibres rares, issues des Hautes Terres
                                malgaches, définissent l'identité de notre collection — une élégance sobre,
                                durable, enracinée dans un territoire et une culture.
                            </p>
                            <p>
                                Choisir Pull Lover, c'est rejoindre un projet qui place les femmes artisanes
                                au cœur de sa démarche. Une part de chaque vente est reversée directement aux
                                ateliers pour améliorer les conditions de travail et former les prochaines
                                générations. La beauté d'un vêtement ne se mesure pas seulement à son
                                apparence, mais à l'histoire qu'il porte et aux mains qui l'ont créé.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* —— Stats —— */}
            <section className="nm-stats">
                <div className="nm-container">
                    <div className="nm-stats__grid reveal" ref={statsRef}>
                        {STATS.map((s) => (
                            <div key={s.label} className="nm-stat">
                                <span className="nm-stat__value">{s.value}</span>
                                <span className="nm-stat__label">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* —— Vidéo —— */}
            <section className="nm-video-section">
                <div className="nm-container">
                    <div className="nm-video-section__header reveal" ref={videoHeaderRef}>
                        <Eyebrow className="nm-eyebrow">Notre atelier</Eyebrow>
                        <h2 className="nm-video-section__heading">
                            Voir comment chaque pièce prend vie
                        </h2>
                        <p className="nm-video-section__sub">
                            Nos vêtements ne sortent pas d'une ligne de production anonyme. Chaque pièce est
                            tricotée à la main dans l'atelier familial{" "}
                            <a
                                href="https://www.ultramaille.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="nm-video-section__link"
                            >
                                Ultramaille
                            </a>
                            , basé à Antananarivo. C'est là que savoir-faire artisanal et matières nobles
                            se rencontrent, pour donner naissance à des pièces pensées pour durer.
                            Dans cette vidéo, vous pouvez observer les gestes précis et le soin apporté
                            à chaque étape de fabrication.
                        </p>
                    </div>
                    <div className="nm-video__wrapper reveal" ref={videoWrapRef}>
                        <video
                            className="nm-video__el"
                            controls
                            preload="metadata"
                        >
                            <source
                                src="/api/media/site/presentation-ultramaille.mp4"
                                type="video/mp4"
                            />
                            Votre navigateur ne supporte pas la lecture vidéo.
                        </video>
                        <button
                            className="nm-video__play"
                            aria-label="Lire la vidéo"
                            onClick={(e) => {
                                const video = e.currentTarget
                                    .closest(".nm-video__wrapper")
                                    .querySelector("video");
                                video.play();
                                e.currentTarget.style.display = "none";
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 64 64"
                                width="56"
                                height="56"
                                aria-hidden="true"
                            >
                                <circle cx="32" cy="32" r="32" fill="rgba(0,0,0,0.45)" />
                                <polygon points="26,20 48,32 26,44" fill="white" />
                            </svg>
                        </button>
                    </div>
                </div>
            </section>

            {/* —— CTA final —— */}
            <section className="nm-cta">
                <div className="nm-container">
                    <div className="nm-cta__inner reveal" ref={ctaRef}>
                        <h3 className="nm-cta__heading">
                            Prêt à trouver votre prochain coup de cœur ?
                        </h3>
                        <p className="nm-cta__sub">
                            Découvrez nos pulls et accessoires faits main, créés à Madagascar.
                        </p>
                        <ButtonPrimary href="/#piece" size="lg">
                            Voir la collection
                        </ButtonPrimary>
                    </div>
                </div>
            </section>

        </div>
    );
}
