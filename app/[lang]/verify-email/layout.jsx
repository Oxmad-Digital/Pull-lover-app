import { privatePageMetadata } from "@/app/lib/seo";

// Page privée ou transactionnelle : exclue des moteurs de recherche
export const generateMetadata = privatePageMetadata({ fr: "Vérification de l’e-mail", en: "Email verification" });

export default function VerifyEmailLayout({ children }) {
  return children;
}
