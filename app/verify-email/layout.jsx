import { NO_INDEX } from "@/app/lib/seo";

// Page privée ou transactionnelle : exclue des moteurs de recherche
export const metadata = { title: "Vérification de l’e-mail", robots: NO_INDEX };

export default function VerifyEmailLayout({ children }) {
  return children;
}
