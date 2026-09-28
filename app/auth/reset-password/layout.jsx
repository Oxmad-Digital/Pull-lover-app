import { NO_INDEX } from "@/app/lib/seo";

// Page privée ou transactionnelle : exclue des moteurs de recherche
export const metadata = { title: "Nouveau mot de passe", robots: NO_INDEX };

export default function ResetPasswordLayout({ children }) {
  return children;
}
