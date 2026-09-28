import { NO_INDEX } from "@/app/lib/seo";

// Page privée ou transactionnelle : exclue des moteurs de recherche
export const metadata = { title: "Mon panier", robots: NO_INDEX };

export default function CartLayout({ children }) {
  return children;
}
