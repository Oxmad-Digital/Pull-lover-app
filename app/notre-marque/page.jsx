import NotreMarque from "../components/NotreMarque";

export const metadata = {
    title: "Notre histoire",
    description: "L’histoire de Pull-Lover : une maille artisanale imaginée et fabriquée à la demande dans notre atelier familial à Antananarivo, Madagascar.",
    alternates: { canonical: "/notre-marque" },
};

export default function NotreMarquePage() {
    return <NotreMarque />;
}