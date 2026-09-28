import { privatePageMetadata } from "@/app/lib/seo";

// Page privée ou transactionnelle : exclue des moteurs de recherche
export const generateMetadata = privatePageMetadata({ fr: "Mot de passe oublié", en: "Forgot password" });

export default function ForgotPasswordLayout({ children }) {
  return children;
}
