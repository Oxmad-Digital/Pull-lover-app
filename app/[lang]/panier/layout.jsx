import { privatePageMetadata } from "@/app/lib/seo";

// Page privée ou transactionnelle : exclue des moteurs de recherche
export const generateMetadata = privatePageMetadata({ fr: "Mon panier", en: "My cart" });

export default function CartLayout({ children }) {
  return children;
}
