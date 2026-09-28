import { NO_INDEX } from "@/app/lib/seo";

// Page privée ou transactionnelle : exclue des moteurs de recherche
export const metadata = { title: "Créer un compte", robots: NO_INDEX };

export default function RegisterLayout({ children }) {
  return children;
}
