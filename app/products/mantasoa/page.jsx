import MantasoaProductPage from "./MantasoaProductPage";

export const metadata = {
  title: "Le Mantasoa — Pull en maille fabriqué à Madagascar",
  description:
    "Découvrez le Mantasoa, choisissez votre taille et commandez cette maille essentielle fabriquée à la demande dans notre atelier familial à Antananarivo.",
  alternates: { canonical: "/products/mantasoa" },
  openGraph: {
    title: "Le Mantasoa — Pull-Lover",
    description: "Une maille essentielle, imaginée et fabriquée à Madagascar.",
    images: [
      { url: "/api/media/site/mantasoa-hero.webp", alt: "Le Mantasoa porté au bord du lac" },
    ],
  },
};

export default function MantasoaPage() {
  return <MantasoaProductPage />;
}
