"use client";

import { useEffect, useRef } from "react";
import styles from "./stats.module.css";

// Carte : public/world-map.min.svg (Simple World Map, CC BY-SA 3.0), un chemin par pays
// identifié par son code ISO 3166-1 en minuscules.
const EMPTY_FILL = "#F3EAE7";
const STROKE = "rgba(36, 59, 59, 0.18)";

/** Carte choroplèthe des vues par pays, teinte de l'accent Pull Lover selon le volume. */
export default function WorldMap({ countries }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;

    (async () => {
      let svgText;
      try {
        svgText = await (await fetch("/world-map.min.svg")).text();
      } catch {
        return;
      }
      if (cancelled) return;

      host.innerHTML = svgText;
      const svg = host.querySelector("svg");
      if (!svg) return;
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "Carte des visites par pays");
      svg.querySelector("title")?.remove();
      Object.assign(svg.style, { width: "100%", height: "auto", display: "block" });

      const byCode = new Map(countries.map((c) => [c.code.toLowerCase(), c]));
      const max = Math.max(1, ...countries.map((c) => c.views));

      const tooltip = document.createElement("div");
      tooltip.className = styles.mapTooltip;
      const tooltipName = document.createElement("span");
      tooltipName.className = styles.tooltipDate;
      const tooltipValue = document.createElement("strong");
      tooltip.append(tooltipName, tooltipValue);
      host.appendChild(tooltip);

      svg.querySelectorAll("path[id], g[id]").forEach((el) => {
        const country = byCode.get(el.id);
        const paths = el.tagName.toLowerCase() === "g" ? Array.from(el.querySelectorAll("path")) : [el];
        paths.forEach((p) => {
          p.style.stroke = STROKE;
          p.style.strokeWidth = "0.35";
          p.style.fill = EMPTY_FILL;
        });
        if (!country) return;

        // Racine carrée : les petits pays restent visibles à côté d'un pays dominant
        const intensity = 0.25 + 0.75 * Math.sqrt(country.views / max);
        paths.forEach((p) => {
          p.style.fill = `rgba(199, 92, 92, ${intensity.toFixed(2)})`;
          p.style.cursor = "pointer";
        });

        const show = (e) => {
          const rect = host.getBoundingClientRect();
          tooltipName.textContent = country.name;
          tooltipValue.textContent = `${country.views.toLocaleString("fr-FR")} vues`;
          tooltip.style.left = `${e.clientX - rect.left}px`;
          tooltip.style.top = `${e.clientY - rect.top}px`;
          tooltip.classList.add(styles.mapTooltipVisible);
          paths.forEach((p) => { p.style.fill = "#AD4646"; });
        };
        const hide = () => {
          tooltip.classList.remove(styles.mapTooltipVisible);
          paths.forEach((p) => { p.style.fill = `rgba(199, 92, 92, ${intensity.toFixed(2)})`; });
        };
        el.addEventListener("pointerenter", show);
        el.addEventListener("pointermove", show);
        el.addEventListener("pointerleave", hide);
      });
    })();

    return () => {
      cancelled = true;
      host.innerHTML = "";
    };
  }, [countries]);

  return <div ref={hostRef} className={styles.map} />;
}
