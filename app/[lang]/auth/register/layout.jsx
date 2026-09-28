import { privatePageMetadata } from "@/app/lib/seo";

// Page privée ou transactionnelle : exclue des moteurs de recherche
export const generateMetadata = privatePageMetadata({ fr: "Créer un compte", en: "Create an account" });

export default function RegisterLayout({ children }) {
  return children;
}
