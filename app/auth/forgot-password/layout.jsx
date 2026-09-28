import { NO_INDEX } from "@/app/lib/seo";

// Page privée ou transactionnelle : exclue des moteurs de recherche
export const metadata = { title: "Mot de passe oublié", robots: NO_INDEX };

export default function ForgotPasswordLayout({ children }) {
  return children;
}
