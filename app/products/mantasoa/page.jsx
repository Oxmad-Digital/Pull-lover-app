import MantasoaProductPage from "./MantasoaProductPage";

export const metadata = {
  title: "Cardigan en maille — Pull-Lover",
  description:
    "Découvrez notre cardigan en maille de Madagascar, choisissez votre taille et commandez cette pièce essentielle fabriquée à la demande dans notre atelier familial à Antananarivo.",
  alternates: { canonical: "/products/mantasoa" },
  openGraph: {
    title: "Cardigan en maille — Pull-Lover",
    description: "Une maille essentielle, imaginée et fabriquée à Madagascar.",
    images: [
      { url: "/api/media/site/mantasoa-hero.webp", alt: "Cardigan en maille porté au bord du lac" },
    ],
  },
};

export default function MantasoaPage() {
  return <MantasoaProductPage />;
}
