"use client";

import { useEffect } from "react";

// Apparitions au défilement des pages publiques, avec le même vocabulaire que l'accueil
// (montée de 32px, flou 8px, 1,1s, 0,12s entre deux éléments).
//
// - `data-reveal` sur un élément : il apparaît quand il entre dans l'écran.
// - `data-reveal-stagger` sur un conteneur : ses enfants directs apparaissent l'un après l'autre,
//   y compris ceux ajoutés plus tard (produits chargés, pagination…).
//
// Le script inline du layout pose `html.pl-motion` avant le premier rendu : le CSS cache alors
// les éléments marqués, et ce composant les révèle. Sans JS, ou si l'utilisateur réduit les
// animations, la classe n'est pas posée et tout reste visible.
const STAGGER_MS = 120;
const MAX_STEPS = 8;
const DURATION_MS = 1100;

// Un élément n'est modifié qu'une fois hydraté par React : sinon ses attributs ne
// correspondraient plus au HTML serveur (contenu dans un <Suspense> hydraté plus tard).
const isHydrated = (element) => Object.keys(element).some((key) => key.startsWith("__reactFiber$"));

export default function SiteReveal() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("pl-motion")) return undefined;
    window.__plReveal = true;

    const pending = new Set();
    const timers = new Set();
    let frame = 0;

    const later = (callback, delay) => {
      const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay);
      timers.add(timer);
    };

    const reveal = (element, delay) => {
      if (!pending.delete(element)) return;
      observer.unobserve(element);
      const start = () => {
        if (!element.isConnected) return;
        if (!isHydrated(element)) { later(start, 50); return; }
        element.style.setProperty("--pl-reveal-delay", `${delay}ms`);
        element.setAttribute("data-reveal", "in");
        later(() => {
          element.setAttribute("data-reveal", "done");
          element.style.removeProperty("--pl-reveal-delay");
        }, delay + DURATION_MS + 50);
      };
      start();
    };

    // Les éléments qui entrent ensemble dans l'écran sont décalés dans l'ordre du document.
    const revealBatch = (elements) => {
      elements
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        .forEach((element, index) => reveal(element, Math.min(index, MAX_STEPS) * STAGGER_MS));
    };

    const observer = new IntersectionObserver((entries) => {
      revealBatch(entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target));
    }, { rootMargin: "0px 0px -10% 0px" });

    // En bas de page (ou sur une page qui ne défile pas), la marge de 10 % ne serait jamais
    // franchie : on révèle alors tout ce qui est visible.
    const checkPageEnd = () => {
      frame = 0;
      if (window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 4) return;
      revealBatch([...pending].filter((element) => element.getBoundingClientRect().top < window.innerHeight));
    };
    const scheduleCheck = () => { if (!frame) frame = requestAnimationFrame(checkPageEnd); };

    const register = (element) => {
      const state = element.getAttribute("data-reveal");
      if (state === "in" || state === "done" || pending.has(element)) return;
      pending.add(element);
      observer.observe(element);
    };

    const scan = (scope) => {
      if (scope.matches("[data-reveal]") || scope.parentElement?.matches("[data-reveal-stagger]")) register(scope);
      if (scope.matches("[data-reveal-stagger]")) Array.from(scope.children).forEach(register);
      scope.querySelectorAll("[data-reveal]").forEach(register);
      scope.querySelectorAll("[data-reveal-stagger]").forEach((container) => Array.from(container.children).forEach(register));
    };

    scan(document.body);
    scheduleCheck();
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) scan(node);
      }));
      scheduleCheck();
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck);

    return () => {
      mutations.disconnect();
      observer.disconnect();
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
    };
  }, []);

  return null;
}
