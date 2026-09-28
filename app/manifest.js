import { SITE_NAME } from "./lib/seo";

export default function manifest() {
  return {
    name: `${SITE_NAME} — Maille de Madagascar`,
    short_name: SITE_NAME,
    description: "Mailles artisanales fabriquées à la demande dans notre atelier familial à Antananarivo, Madagascar.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff9f6",
    theme_color: "#0a0a0a",
    lang: "fr",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
