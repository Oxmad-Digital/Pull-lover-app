import { NO_INDEX } from "@/app/lib/seo";

// Page privée ou transactionnelle : exclue des moteurs de recherche
export const metadata = { title: "Connexion", robots: NO_INDEX };

export default function LoginLayout({ children }) {
  return children;
}
