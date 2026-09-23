"use client";

import { useState } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { ButtonPrimary } from "./ui/Button";
import { Eyebrow } from "./ui/Tag";
import "./Contact.css";

const INFOS = [
    {
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
            </svg>
        ),
        label: "Délai de réponse",
        value: "Sous 24 heures",
    },
];

export default function Contact() {
    const [formData, setFormData] = useState({ nom: "", mail: "", message: "" });
    const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"

    const formRef = useScrollReveal();
    const imageRef = useScrollReveal();

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setStatus("success");
                setFormData({ nom: "", mail: "", message: "" });
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    };

    return (
        <section className="contact">
            <div className="contact__container">

                {/* ── Formulaire ── */}
                <div className="contact__form-side reveal" ref={formRef}>

                    <div className="contact__header">
                        <Eyebrow className="contact-eyebrow">Contactez-nous</Eyebrow>
                        <h1 className="contact__heading">
                            Une question ?<br />On vous répond.
                        </h1>
                        <p className="contact__subtext">
                            Notre équipe est disponible pour répondre à toutes vos questions
                            sur nos produits, vos commandes ou notre marque.
                        </p>
                    </div>

                    <div className="contact__infos">
                        {INFOS.map((info) => (
                            <div key={info.label} className="contact__info-item">
                                <span className="contact__info-icon">{info.icon}</span>
                                <div>
                                    <p className="contact__info-label">{info.label}</p>
                                    <p className="contact__info-value">{info.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form className="contact__form" onSubmit={handleSubmit} noValidate>
                        <div className="contact__field">
                            <label htmlFor="nom" className="contact__label">Nom complet</label>
                            <input
                                id="nom"
                                name="nom"
                                type="text"
                                className="contact__input"
                                placeholder="Tom Wybo"
                                value={formData.nom}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="contact__field">
                            <label htmlFor="mail" className="contact__label">Email</label>
                            <input
                                id="mail"
                                name="mail"
                                type="email"
                                className="contact__input"
                                placeholder="tom.wybo@gmail.com"
                                value={formData.mail}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="contact__field">
                            <label htmlFor="message" className="contact__label">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                className="contact__textarea"
                                placeholder="Écris ton message..."
                                rows={5}
                                value={formData.message}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <ButtonPrimary
                            type="submit"
                            full
                            disabled={status === "loading"}
                        >
                            {status === "loading" ? "Envoi en cours..." : "Envoyer"}
                        </ButtonPrimary>

                        {status === "success" && (
                            <p className="contact__feedback contact__feedback--success">
                                Message envoyé avec succès !
                            </p>
                        )}
                        {status === "error" && (
                            <p className="contact__feedback contact__feedback--error">
                                Une erreur est survenue. Réessaie plus tard.
                            </p>
                        )}
                    </form>
                </div>

                {/* ── Image ── */}
                <div className="contact__image-side reveal" ref={imageRef}>
                    <img
                        className="contact__image"
                        src="/api/media/site/contact-pull-vert-olive.jpg"
                        alt="Homme portant un pull-over vert olive sur un chemin de sable"
                    />
                </div>

            </div>
        </section>
    );
}
