"use client";

import { useEffect } from "react";

export default function HomeCinematic() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let context;
    let cancelled = false;
    const interactionCleanups = [];
    let resizeObserver;
    let refreshTimer;

    async function mountAnimations() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);
      const home = document.querySelector(".pl-home");
      if (!home) return;

      // Vocabulaire commun : même montée, même flou, même rythme pour toutes les apparitions.
      // Toujours passer une copie ({ ...REVEAL }) : GSAP modifie l'objet vars qu'il reçoit.
      const REVEAL = { y: 32, autoAlpha: 0, filter: "blur(8px)", duration: 1.1, ease: "power3.out", clearProps: "filter" };
      const STAGGER = 0.12;
      const LINE = { scaleX: 0, duration: 1.4, ease: "power3.inOut" };
      const START = "top 75%";

      // Timeline jouée une seule fois quand la section entre dans l'écran. Les tweens "from"
      // sont rendus dès la création : le contenu est caché avant d'arriver à l'écran.
      const onEnter = (trigger, build, start = START) =>
        build(gsap.timeline({ scrollTrigger: { trigger, start, once: true } }));
      const q = (selector, scope) => gsap.utils.toArray(selector, home.querySelector(scope));

      context = gsap.context(() => {
        home.classList.add("is-cinematic");

        gsap.timeline({ defaults: { ease: "power3.out" } })
          .fromTo(".pl-hero-image", { scale: 1.075 }, { scale: 1, duration: 1.8 })
          .from(".pl-hero .pl-eyebrow", { y: 18, autoAlpha: 0, duration: 0.65 }, 0.45)
          .from(".pl-hero-title-line > span", { yPercent: 115, duration: 1, stagger: STAGGER }, 0.5)
          .from(".pl-hero-foot > *", { y: 24, autoAlpha: 0, duration: 0.7, stagger: STAGGER }, 0.95)
          .from(".pl-scroll-cue", { autoAlpha: 0, y: -16, duration: 0.65 }, 1.25);

        gsap.to(".pl-hero", {
          "--pl-hero-y": "58%",
          ease: "none",
          scrollTrigger: { trigger: ".pl-hero", start: "top top", end: "bottom top", scrub: 0.7 },
        });

        // Manifeste : lettres → trait → origine, enchaînés dans une seule timeline.
        onEnter(".pl-manifesto", (tl) => tl
          .from(".pl-manifesto-char", {
            yPercent: 35,
            autoAlpha: 0,
            filter: "blur(8px)",
            duration: 0.9,
            stagger: 0.022,
            ease: "power2.out",
            clearProps: "filter",
          })
          .from(".pl-manifesto-thread", { ...LINE }, "-=1.2")
          .from(".pl-origin", { ...REVEAL }, "-=0.9"), "top 72%");

        gsap.fromTo(".pl-product-visual img", { scale: 1.08 }, {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: ".pl-product", start: "top bottom", end: "bottom top", scrub: 0.8 },
        });
        // La fiche produit se remplit après le chargement de l'API : le CSS la garde cachée
        // (.is-cinematic) et les enfants présents au moment de l’entrée sont animés une seule fois.
        const productInfo = home.querySelector(".pl-product-info");
        if (productInfo) {
          ScrollTrigger.create({
            trigger: productInfo,
            start: START,
            onEnter: () => {
              if (productInfo.classList.contains("is-revealed")) return;
              productInfo.classList.add("is-revealed");
              gsap.from(productInfo.children, { ...REVEAL, stagger: STAGGER });
            },
          });
        }

        // Section concept : chaque bloc apparaît séparément, dans un ordre aléatoire.
        onEnter(".pl-collection-concept-head", (tl) => tl
          .from(q("[data-pl-scatter]", ".pl-collection-concept-head"), { ...REVEAL, duration: 1.3, stagger: { each: 0.18, from: "random" } })
          .from(".pl-collection-rule", { ...LINE }, 0.3));
        onEnter(".pl-collection-concept-body", (tl) => tl
          .from(q("[data-pl-scatter]", ".pl-collection-concept-body"), { ...REVEAL, duration: 1.3, stagger: { each: 0.18, from: "random" } }));

        gsap.to(".pl-collection-number", {
          yPercent: -24,
          ease: "none",
          scrollTrigger: { trigger: ".pl-collection-concept", start: "top bottom", end: "bottom top", scrub: 0.8 },
        });

        gsap.fromTo(".pl-workshop-image", { clipPath: "inset(10% 0 10% 0)" }, {
          clipPath: "inset(0% 0 0% 0)",
          ease: "none",
          scrollTrigger: { trigger: ".pl-workshop", start: "top 82%", end: "center 52%", scrub: 0.7 },
        });
        gsap.fromTo(".pl-workshop-image img", { scale: 1.12, yPercent: -2 }, {
          scale: 1.06,
          yPercent: 2,
          ease: "none",
          scrollTrigger: { trigger: ".pl-workshop", start: "top bottom", end: "bottom top", scrub: 0.8 },
        });
        onEnter(".pl-workshop-copy", (tl) => tl.from(".pl-workshop-copy > *", { ...REVEAL, stagger: STAGGER }));

        onEnter(".pl-process-head", (tl) => tl.from(".pl-process-head > *", { ...REVEAL, stagger: STAGGER }));
        onEnter(".pl-steps", (tl) => tl
          .from(".pl-process-thread", { ...LINE })
          .from(".pl-steps li", { ...REVEAL, stagger: 0.16 }, 0.2));

        gsap.fromTo(".pl-final > img", { scale: 1.1 }, {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: ".pl-final", start: "top bottom", end: "bottom bottom", scrub: 0.8 },
        });
        onEnter(".pl-final", (tl) => tl.from(".pl-final-copy > *", { ...REVEAL, stagger: 0.16 }), "top 62%");

        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          const hero = document.querySelector(".pl-hero");
          if (hero) {
            const moveHeroX = gsap.quickTo(hero, "--pl-hero-x", { duration: 0.9, ease: "power3" });
            const moveLightX = gsap.quickTo(hero, "--pl-light-x", { duration: 0.55, ease: "power2" });
            const moveLightY = gsap.quickTo(hero, "--pl-light-y", { duration: 0.55, ease: "power2" });
            const handleHeroMove = (event) => {
              const bounds = hero.getBoundingClientRect();
              const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
              const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
              moveHeroX(`${49 + x * 2}%`);
              moveLightX(`${x * 100}%`);
              moveLightY(`${y * 100}%`);
            };
            const handleHeroLeave = () => {
              moveHeroX("50%");
              moveLightX("50%");
              moveLightY("45%");
            };
            hero.addEventListener("pointermove", handleHeroMove);
            hero.addEventListener("pointerleave", handleHeroLeave);
            interactionCleanups.push(() => {
              hero.removeEventListener("pointermove", handleHeroMove);
              hero.removeEventListener("pointerleave", handleHeroLeave);
            });
          }

          gsap.utils.toArray(".pl-home .pl-button").forEach((button) => {
            const moveX = gsap.quickTo(button, "x", { duration: 0.35, ease: "power3" });
            const moveY = gsap.quickTo(button, "y", { duration: 0.35, ease: "power3" });
            const handleMove = (event) => {
              const bounds = button.getBoundingClientRect();
              moveX((event.clientX - bounds.left - bounds.width / 2) * 0.12);
              moveY((event.clientY - bounds.top - bounds.height / 2) * 0.12);
            };
            const handleLeave = () => { moveX(0); moveY(0); };
            button.addEventListener("pointermove", handleMove);
            button.addEventListener("pointerleave", handleLeave);
            interactionCleanups.push(() => {
              button.removeEventListener("pointermove", handleMove);
              button.removeEventListener("pointerleave", handleLeave);
            });
          });
        }
      }, home);

      let lastHeight = home.offsetHeight;
      resizeObserver = new ResizeObserver(() => {
        if (home.offsetHeight === lastHeight) return;
        lastHeight = home.offsetHeight;
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
      });
      resizeObserver.observe(home);
    }

    mountAnimations();
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      clearTimeout(refreshTimer);
      interactionCleanups.forEach((cleanup) => cleanup());
      document.querySelector(".pl-home")?.classList.remove("is-cinematic");
      document.querySelector(".pl-product-info")?.classList.remove("is-revealed");
      context?.revert();
    };
  }, []);

  return <div className="pl-film-grain" aria-hidden="true" />;
}
