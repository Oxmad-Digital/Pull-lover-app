"use client";

import Image from "next/image";
import { ButtonPrimary } from "./ui/Button";
import { Eyebrow } from "./ui/Tag";
import "./AproposSection.css";

const AproposSection = () => {

    return (
        <section className="apropos-section">
            <div className="apropos-main-container">

                {/* Image produit */}
                <div className="apropos-product-presentation">
                    <Image
                        src="/api/media/site/apropos-pull-maille-bleue.jpg"
                        alt="Pull-lover maille bleue"
                        width={480}
                        height={560}
                        className="apropos-product-image"
                        priority
                    />
                </div>

                {/* Bloc texte */}
                <div className="apropos-container">
                    <div className="apropos-txt-container">

                        {/* Groupe label + titre — gap 10px */}
                        <div className="apropos-header">
                            <Eyebrow className="apropos-eyebrow">Notre marque</Eyebrow>
                            <h2 className="apropos-title section-title">La passion de la maille</h2>
                        </div>

                        {/* Description — 60px après le titre */}
                        <p className="apropos-description">
                            Chaque pièce est conçue et réalisée à la main par nos artisanes
                            à Antananarivo. Un geste ancestral, des matières nobles, une
                            attention portée à chaque détail. Depuis notre fondation, nous
                            travaillons en étroite collaboration avec des tisserandes
                            expérimentées qui perpétuent un savoir-faire transmis de
                            génération en génération. Chaque point, chaque couleur, chaque
                            forme est pensée pour allier authenticité et élégance
                            contemporaine.
                        </p>

                        {/* Bouton */}
                        <ButtonPrimary href="/NotreMarque" style={{ marginTop: "40px", alignSelf: "flex-start" }}>En savoir plus</ButtonPrimary>

                    </div>
                </div>

            </div>
        </section>
    );
};

export default AproposSection;