import { privatePageMetadata } from "@/app/lib/seo";

// Page privée ou transactionnelle : exclue des moteurs de recherche
export const generateMetadata = privatePageMetadata({ fr: "Connexion", en: "Sign in" });

export default function LoginLayout({ children }) {
  return children;
}
