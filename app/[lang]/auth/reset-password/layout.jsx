import { privatePageMetadata } from "@/app/lib/seo";

// Page privée ou transactionnelle : exclue des moteurs de recherche
export const generateMetadata = privatePageMetadata({ fr: "Nouveau mot de passe", en: "New password" });

export default function ResetPasswordLayout({ children }) {
  return children;
}
