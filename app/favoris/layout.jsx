import { NO_INDEX } from "@/app/lib/seo";

// Page privée ou transactionnelle : exclue des moteurs de recherche
export const metadata = { title: "Mes favoris", robots: NO_INDEX };

export default function FavoritesLayout({ children }) {
  return children;
}
