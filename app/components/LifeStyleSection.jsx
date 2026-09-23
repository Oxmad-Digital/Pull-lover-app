"use client";

import Image from "next/image";
import "./LifeStyleSection.css";

export default function LifeStyleSection() {
    return (
        <section className="lifestyle-section">
            <div className="lifestyle-inner">

                <div className="lifestyle-band">

                    {/* Texte à gauche */}
                    <div className="lifestyle-band-text">
                        <h2 className="lifestyle-title section-title">Soyez vous-même&nbsp;!</h2>
                        <p className="lifestyle-subtitle">
                            Ego vero sic intellego. Patres conscripti, nos hoc tempore in
                            provinciis decernendis perpetuae pacis habere oportere rationem.
                        </p>
                    </div>

                    {/* Image unique à droite */}
                    <div className="lifestyle-band-img">
                        <Image
                            src="/api/media/site/lifestyle-pull-noir.jpg"
                            alt="Femme marchant sur la plage"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            style={{ objectFit: "cover", objectPosition: "center top" }}
                        />
                    </div>

                </div>

            </div>
        </section>
    );
}