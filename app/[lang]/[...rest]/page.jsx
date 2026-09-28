import { notFound } from "next/navigation";

// Toute URL publique inconnue arrive ici (le middleware la préfixe par sa langue) :
// elle affiche la 404 de app/[lang]/not-found.jsx, avec le header et le footer du site.
export default function CatchAllNotFound() {
  notFound();
}
